import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { getAddress, isAddress, formatEther, JsonRpcProvider } from 'ethers';
import { useAccount, useChainId, useBalance, useSwitchChain, useDisconnect, useConnect } from 'wagmi';
import { WalletState } from '../types/protocol.ts';
import { SUPPORTED_CHAINS } from '../config/chains.ts';
import { APP_CONFIG } from '../config/contracts.ts';

interface WalletContextType {
  wallet: WalletState;
  connectWallet: () => Promise<void>;
  connectMetaMaskDirectly: () => Promise<void>;
  disconnectWallet: () => void;
  switchChain: (chainId: number) => Promise<boolean>;
  isRainbowOpen?: boolean;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Wagmi hooks for real on-chain connection
  const { address: wagmiAddress, isConnected: isWagmiConnected, isConnecting: isWagmiConnecting } = useAccount();
  const wagmiChainId = useChainId();
  const { data: wagmiBalanceData, isLoading: isWagmiBalanceLoading } = useBalance({
    address: wagmiAddress,
  });
  const { switchChainAsync } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const { connectAsync, connectors } = useConnect();

  // Explicit user disconnect flag
  const [isManuallyDisconnected, setIsManuallyDisconnected] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('dot_i_wallet_disconnected') === 'true';
    }
    return false;
  });

  // Injected direct window.ethereum state (Guarantees instant sync with MetaMask/Rabby)
  const [injectedState, setInjectedState] = useState<{
    address: string | null;
    chainId: number;
    balanceEth: string;
    isConnected: boolean;
  }>({
    address: null,
    chainId: APP_CONFIG.chainId,
    balanceEth: '0',
    isConnected: false,
  });

  // Helper to fetch native injected balance
  const updateInjectedBalance = useCallback(async (address: string) => {
    if (!address || !isAddress(address)) return;

    const activeChainId = injectedState.chainId || APP_CONFIG.chainId;
    const chainConfig = SUPPORTED_CHAINS[activeChainId] || SUPPORTED_CHAINS[42161];

    try {
      if (chainConfig?.rpcUrl) {
        const arbProvider = new JsonRpcProvider(chainConfig.rpcUrl);
        const rawArbBal = await arbProvider.getBalance(address).catch(() => null);
        if (rawArbBal !== null) {
          const balInEth = Number(formatEther(rawArbBal)).toFixed(4);
          setInjectedState((prev) => ({ ...prev, balanceEth: balInEth }));
          return;
        }
      }
    } catch (e) {
      console.warn('RPC balance query error, falling back to injected', e);
    }

    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    try {
      const eth = (window as any).ethereum;
      const rawBal = await eth.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      if (rawBal) {
        const balInEth = Number(formatEther(BigInt(rawBal))).toFixed(4);
        setInjectedState((prev) => ({ ...prev, balanceEth: balInEth }));
      }
    } catch (e) {
      console.warn('Failed to fetch balance from injected wallet', e);
    }
  }, [injectedState.chainId]);

  // Listen to window.ethereum accounts & chain changes
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    const eth = (window as any).ethereum;

    if (!isManuallyDisconnected) {
      eth.request({ method: 'eth_accounts' })
        .then(async (accounts: string[]) => {
          if (accounts && accounts.length > 0 && isAddress(accounts[0])) {
            const rawChainId = await eth.request({ method: 'eth_chainId' }).catch(() => '0xa4b1');
            const parsedChainId = parseInt(rawChainId, 16) || APP_CONFIG.chainId;
            const cleanAddr = getAddress(accounts[0]);
            setInjectedState({
              address: cleanAddr,
              chainId: parsedChainId,
              balanceEth: '0.00',
              isConnected: true,
            });
            updateInjectedBalance(cleanAddr);
          }
        })
        .catch(() => { });
    }

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts && accounts.length > 0 && isAddress(accounts[0])) {
        const cleanAddr = getAddress(accounts[0]);
        setIsManuallyDisconnected(false);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('dot_i_wallet_disconnected');
        }
        setInjectedState((prev) => ({
          ...prev,
          address: cleanAddr,
          isConnected: true,
        }));
        updateInjectedBalance(cleanAddr);
      } else {
        setInjectedState({
          address: null,
          chainId: APP_CONFIG.chainId,
          balanceEth: '0',
          isConnected: false,
        });
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const parsedChainId = parseInt(chainIdHex, 16);
      if (parsedChainId && !isNaN(parsedChainId)) {
        setInjectedState((prev) => ({
          ...prev,
          chainId: parsedChainId,
        }));
        if (injectedState.address) {
          updateInjectedBalance(injectedState.address);
        }
      }
    };

    eth.on?.('accountsChanged', handleAccountsChanged);
    eth.on?.('chainChanged', handleChainChanged);

    return () => {
      eth.removeListener?.('accountsChanged', handleAccountsChanged);
      eth.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [updateInjectedBalance, injectedState.address, isManuallyDisconnected]);

  // Keep balance freshly synced
  useEffect(() => {
    const activeAddr = wagmiAddress || injectedState.address;
    if (!activeAddr) return;

    updateInjectedBalance(activeAddr);
    const interval = setInterval(() => {
      updateInjectedBalance(activeAddr);
    }, 12000);

    return () => clearInterval(interval);
  }, [wagmiAddress, injectedState.address, updateInjectedBalance]);

  // Calculate consolidated wallet state
  const wallet = useMemo<WalletState>(() => {
    if (isManuallyDisconnected) {
      return {
        address: null,
        chainId: APP_CONFIG.chainId,
        isConnected: false,
        isConnecting: false,
        balanceEth: '0',
      };
    }

    if (isWagmiConnected && wagmiAddress) {
      const formattedBal = wagmiBalanceData
        ? Number(formatEther(wagmiBalanceData.value)).toFixed(4)
        : injectedState.balanceEth || '0.00';

      return {
        address: getAddress(wagmiAddress),
        chainId: wagmiChainId || injectedState.chainId || APP_CONFIG.chainId,
        isConnected: true,
        isConnecting: isWagmiConnecting || (isWagmiBalanceLoading && !wagmiBalanceData && !injectedState.balanceEth),
        balanceEth: formattedBal,
      };
    }

    if (injectedState.isConnected && injectedState.address) {
      return {
        address: injectedState.address,
        chainId: injectedState.chainId,
        isConnected: true,
        isConnecting: false,
        balanceEth: injectedState.balanceEth,
      };
    }

    return {
      address: null,
      chainId: APP_CONFIG.chainId,
      isConnected: false,
      isConnecting: isWagmiConnecting,
      balanceEth: '0',
    };
  }, [
    isManuallyDisconnected,
    isWagmiConnected,
    wagmiAddress,
    wagmiChainId,
    wagmiBalanceData,
    isWagmiConnecting,
    injectedState,
    isWagmiBalanceLoading,
  ]);

  const connectMetaMaskDirectly = async () => {
    setIsManuallyDisconnected(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('dot_i_wallet_disconnected');
    }

    const hasInjected = typeof window !== 'undefined' && Boolean((window as any).ethereum);

    if (!hasInjected) {
      alert('Web3 wallet extension not found in your browser.\nPlease install MetaMask or open the application in a Web3 browser.');
      return;
    }

    const eth = (window as any).ethereum;

    try {
      const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });

      if (accounts && accounts.length > 0 && isAddress(accounts[0])) {
        const cleanAddr = getAddress(accounts[0]);
        const rawChainId = await eth.request({ method: 'eth_chainId' }).catch(() => '0xa4b1');
        const parsedChainId = parseInt(rawChainId, 16) || APP_CONFIG.chainId;

        setInjectedState({
          address: cleanAddr,
          chainId: parsedChainId,
          balanceEth: '0.00',
          isConnected: true,
        });

        updateInjectedBalance(cleanAddr);

        const targetConnector =
          connectors.find((c) => c.id === 'injected' || c.id === 'metaMask' || c.name.toLowerCase().includes('metamask')) ||
          connectors[0];

        if (targetConnector) {
          try {
            await connectAsync({ connector: targetConnector });
          } catch (syncErr) {
            // Non-blocking
          }
        }
        return;
      }
    } catch (err: any) {
      console.warn('Direct MetaMask connection error:', err);
      if (err?.code === 4001) {
        alert('Wallet connection request was rejected.');
        return;
      }
    }

    const fallbackConnector =
      connectors.find((c) => c.id === 'injected' || c.id === 'metaMask') ||
      connectors[0];

    if (fallbackConnector) {
      try {
        await connectAsync({ connector: fallbackConnector });
      } catch (err: any) {
        console.warn('Fallback connect error:', err);
      }
    }
  };

  const connectWallet = async () => {
    setIsManuallyDisconnected(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('dot_i_wallet_disconnected');
    }
    await connectMetaMaskDirectly();
  };

  const disconnectWallet = () => {
    setIsManuallyDisconnected(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dot_i_wallet_disconnected', 'true');
    }
    if (isWagmiConnected) {
      try {
        disconnect();
      } catch (e) { }
    }
    setInjectedState({
      address: null,
      chainId: APP_CONFIG.chainId,
      balanceEth: '0',
      isConnected: false,
    });
  };

  const switchChain = async (targetChainId: number): Promise<boolean> => {
    const target = SUPPORTED_CHAINS[targetChainId];
    if (!target) return false;

    let switchAttempted = false;

    if (isWagmiConnected && switchChainAsync) {
      try {
        await switchChainAsync({ chainId: targetChainId });
        switchAttempted = true;
      } catch (err: any) {
        console.warn('Wagmi switchChainAsync warning/fallback:', err?.message || err);
      }
    }

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const eth = (window as any).ethereum;
      const chainIdHex = `0x${targetChainId.toString(16)}`;
      try {
        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
        switchAttempted = true;
      } catch (switchError: any) {
        if (
          switchError.code === 4902 ||
          switchError?.data?.originalError?.code === 4902 ||
          /unrecognized chain/i.test(switchError?.message || '')
        ) {
          try {
            await eth.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: chainIdHex,
                  chainName: target.name,
                  nativeCurrency: target.nativeCurrency,
                  rpcUrls: [target.rpcUrl],
                  blockExplorerUrls: [target.explorerUrl],
                },
              ],
            });
            switchAttempted = true;
          } catch (addError) {
            console.error('Failed to add network to wallet:', addError);
            return false;
          }
        } else if (switchError?.code === 4001) {
          console.warn('User rejected network switch request.');
          return false;
        }
      }
    }

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const rawHex = await (window as any).ethereum.request({ method: 'eth_chainId' });
        const confirmedChainId = parseInt(rawHex, 16);
        if (confirmedChainId === targetChainId) {
          setInjectedState((prev) => ({ ...prev, chainId: targetChainId }));
          if (injectedState.address) {
            updateInjectedBalance(injectedState.address);
          }
          return true;
        }
      } catch (checkErr) {
        console.warn('Failed to query post-switch chainId from provider:', checkErr);
      }
    }

    if (switchAttempted) {
      setInjectedState((prev) => ({ ...prev, chainId: targetChainId }));
      return true;
    }

    return false;
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connectWallet,
        connectMetaMaskDirectly,
        disconnectWallet,
        switchChain,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
