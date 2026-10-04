export interface WalletState {
  address: string | null;
  chainId: number;
  isConnected: boolean;
  isConnecting: boolean;
  balanceEth: string;
}

export interface SupportedChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}
