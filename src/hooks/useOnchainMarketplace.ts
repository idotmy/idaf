import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { createPublicClient, http, fallback, parseUnits, formatUnits, getAddress } from 'viem';
import { arbitrum } from 'viem/chains';
import { APP_CONFIG, MARKETPLACE_ABI, ERC20_ABI, ERC721_ABI } from '../config/contracts.ts';
import { DomainListing, InvestorPosition, TxStatus, OwnedDomainNFT } from '../types/domain.ts';
import { formatWeb3Error } from '../utils/errors.ts';

// Dedicated public RPC client for Arbitrum
const publicClient = createPublicClient({
  chain: arbitrum,
  transport: fallback([
    http('https://arb1.arbitrum.io/rpc'),
    http('https://arbitrum.llamarpc.com'),
    http('https://arbitrum-one-rpc.publicnode.com'),
    http('https://arbitrum.drpc.org'),
  ]),
});

/**
 * Resilient on-chain domain name resolver.
 * Queries domainNameOf, getDomainName, domain, domains, name, and tokenURI metadata.
 */
async function resolveDomainName(
  nftContract: `0x${string}`,
  tokenId: bigint
): Promise<string> {
  const cleanContract = getAddress(nftContract);

  // 1. Try domainNameOf(tokenId)
  try {
    const dName = await publicClient.readContract({
      address: cleanContract,
      abi: ERC721_ABI,
      functionName: 'domainNameOf',
      args: [tokenId],
    });
    if (dName && typeof dName === 'string' && dName.trim().length > 0) {
      return dName.trim();
    }
  } catch {}

  // 2. Try getDomainName(tokenId)
  try {
    const dName = await publicClient.readContract({
      address: cleanContract,
      abi: ERC721_ABI,
      functionName: 'getDomainName',
      args: [tokenId],
    });
    if (dName && typeof dName === 'string' && dName.trim().length > 0) {
      return dName.trim();
    }
  } catch {}

  // 3. Try domain(tokenId)
  try {
    const dName = await publicClient.readContract({
      address: cleanContract,
      abi: ERC721_ABI,
      functionName: 'domain',
      args: [tokenId],
    });
    if (dName && typeof dName === 'string' && dName.trim().length > 0) {
      return dName.trim();
    }
  } catch {}

  // 4. Try domains(tokenId)
  try {
    const dName = await publicClient.readContract({
      address: cleanContract,
      abi: ERC721_ABI,
      functionName: 'domains',
      args: [tokenId],
    });
    if (dName && typeof dName === 'string' && dName.trim().length > 0) {
      return dName.trim();
    }
  } catch {}

  // 5. Try name(tokenId)
  try {
    const dName = await publicClient.readContract({
      address: cleanContract,
      abi: ERC721_ABI,
      functionName: 'name',
      args: [tokenId],
    });
    if (dName && typeof dName === 'string' && dName.trim().length > 0) {
      return dName.trim();
    }
  } catch {}

  // 6. Try tokenURI(tokenId) metadata
  try {
    const uri = await publicClient.readContract({
      address: cleanContract,
      abi: ERC721_ABI,
      functionName: 'tokenURI',
      args: [tokenId],
    });

    if (uri && typeof uri === 'string') {
      if (uri.startsWith('data:application/json;base64,')) {
        const base64Data = uri.slice('data:application/json;base64,'.length);
        const jsonStr = atob(base64Data);
        const parsed = JSON.parse(jsonStr);
        if (parsed.name) return parsed.name;
        if (parsed.domain) return parsed.domain;
        if (parsed.domain_name) return parsed.domain_name;
      } else if (uri.startsWith('data:application/json,')) {
        const jsonStr = decodeURIComponent(uri.slice('data:application/json,'.length));
        const parsed = JSON.parse(jsonStr);
        if (parsed.name) return parsed.name;
        if (parsed.domain) return parsed.domain;
      }
    }
  } catch {}

  return `${tokenId.toString()}.i`;
}

export function useOnchainMarketplace() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const checksummedAddress = useMemo(() => {
    if (!address) return undefined;
    try {
      return getAddress(address);
    } catch {
      return undefined;
    }
  }, [address]);

  const [listings, setListings] = useState<DomainListing[]>([]);
  const [userPositions, setUserPositions] = useState<Record<number, InvestorPosition>>({});
  const [userOwnedDomains, setUserOwnedDomains] = useState<OwnedDomainNFT[]>([]);
  const [isScanningDomains, setIsScanningDomains] = useState<boolean>(false);
  const [usdcBalance, setUsdcBalance] = useState<bigint>(0n);
  const [usdcAllowance, setUsdcAllowance] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [txStatus, setTxStatus] = useState<TxStatus>({ state: 'idle' });
  const [refetchTrigger, setRefetchTrigger] = useState<number>(0);

  const refreshData = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  // Fetch on-chain listings directly from the smart contract
  useEffect(() => {
    let isMounted = true;

    async function fetchOnchainData() {
      try {
        setIsLoading(true);
        // 1. Fetch total listings count
        const total = await publicClient.readContract({
          address: APP_CONFIG.contracts.marketplace.address,
          abi: MARKETPLACE_ABI,
          functionName: 'totalListings',
        }).catch(() => 0n);

        const totalNum = Number(total);
        const fetchedListings: DomainListing[] = [];
        const positions: Record<number, InvestorPosition> = {};

        if (totalNum > 0) {
          // Read all listings in parallel from the smart contract
          const listingPromises = Array.from({ length: totalNum }, (_, i) => {
            const id = BigInt(i + 1);
            return publicClient.readContract({
              address: APP_CONFIG.contracts.marketplace.address,
              abi: MARKETPLACE_ABI,
              functionName: 'getListing',
              args: [id],
            });
          });

          const results = await Promise.allSettled(listingPromises);

          for (let i = 0; i < results.length; i++) {
            const res = results[i];
            if (res.status === 'fulfilled' && res.value) {
              const item = res.value as any;
              let dName = item.domainName;

              // If domainName is missing or just looks like an unformatted numeric ID, resolve from contract
              if (!dName || dName.trim() === '' || /^\d+$/.test(dName.trim())) {
                try {
                  dName = await resolveDomainName(item.nftContract, BigInt(item.tokenId));
                } catch {
                  dName = item.domainName || `${item.tokenId}.i`;
                }
              }

              fetchedListings.push({
                listingId: Number(item.listingId),
                seller: item.seller,
                nftContract: item.nftContract,
                tokenId: BigInt(item.tokenId),
                domainName: dName,
                idafToken: item.idafToken,
                askingPriceUSDC: BigInt(item.askingPriceUSDC),
                discountBps: BigInt(item.discountBps),
                offeringTotalUSDC: BigInt(item.offeringTotalUSDC),
                tokenPriceUSDC: BigInt(item.tokenPriceUSDC),
                tokensSold: BigInt(item.tokensSold),
                escrowedUSDC: BigInt(item.escrowedUSDC),
                createdAt: BigInt(item.createdAt),
                expiresAt: BigInt(item.expiresAt),
                state: Number(item.state),
                finalBuyer: item.finalBuyer,
                settledAt: BigInt(item.settledAt),
              });

              // If wallet is connected, read user's investor position for this listing
              if (checksummedAddress) {
                try {
                  const pos = await publicClient.readContract({
                    address: APP_CONFIG.contracts.marketplace.address,
                    abi: MARKETPLACE_ABI,
                    functionName: 'getInvestorPosition',
                    args: [BigInt(i + 1), checksummedAddress],
                  }) as any;

                  positions[i + 1] = {
                    tokenBalance: BigInt(pos[0]),
                    usdcContributed: BigInt(pos[1]),
                    proRataShareBps: BigInt(pos[2]),
                    potentialSalePayoutUSDC: BigInt(pos[3]),
                    refundableUSDC: BigInt(pos[4]),
                  };
                } catch (e) {
                  positions[i + 1] = {
                    tokenBalance: 0n,
                    usdcContributed: 0n,
                    proRataShareBps: 0n,
                    potentialSalePayoutUSDC: 0n,
                    refundableUSDC: 0n,
                  };
                }
              }
            }
          }
        }

        if (isMounted) {
          setListings(fetchedListings);
          setUserPositions(positions);
        }

        // Fetch user's USDC balance & allowance
        if (checksummedAddress && isMounted) {
          try {
            const [bal, allow] = await Promise.all([
              publicClient.readContract({
                address: APP_CONFIG.contracts.usdc.address,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [checksummedAddress],
              }),
              publicClient.readContract({
                address: APP_CONFIG.contracts.usdc.address,
                abi: ERC20_ABI,
                functionName: 'allowance',
                args: [checksummedAddress, APP_CONFIG.contracts.marketplace.address],
              }),
            ]);
            setUsdcBalance(bal);
            setUsdcAllowance(allow);
          } catch (e) {
            console.error('Failed to fetch USDC balance/allowance:', e);
          }
        }

        // Scan connected wallet's owned domain NFTs on Arbitrum
        if (checksummedAddress && isMounted) {
          setIsScanningDomains(true);
          try {
            const domainNftAddr = APP_CONFIG.contracts.domainNft.address;
            const marketplaceAddr = APP_CONFIG.contracts.marketplace.address;

            // Check if user has global approval for all NFTs
            const isApprovedForAll = await publicClient.readContract({
              address: domainNftAddr,
              abi: ERC721_ABI,
              functionName: 'isApprovedForAll',
              args: [checksummedAddress, marketplaceAddr],
            }).catch(() => false);

            const foundDomains: OwnedDomainNFT[] = [];

            // Attempt 1: Try ERC721Enumerable balanceOf & tokenOfOwnerByIndex
            let usedEnumerable = false;
            try {
              const nftBalance = await publicClient.readContract({
                address: domainNftAddr,
                abi: ERC721_ABI,
                functionName: 'balanceOf',
                args: [checksummedAddress],
              });

              const count = Number(nftBalance);
              if (count > 0 && count <= 200) {
                const enumPromises = Array.from({ length: count }, async (_, idx) => {
                  try {
                    const tokenId = await publicClient.readContract({
                      address: domainNftAddr,
                      abi: ERC721_ABI,
                      functionName: 'tokenOfOwnerByIndex',
                      args: [checksummedAddress, BigInt(idx)],
                    });

                    const domainName = await resolveDomainName(domainNftAddr, tokenId);
                    const approvedAddr = await publicClient.readContract({
                      address: domainNftAddr,
                      abi: ERC721_ABI,
                      functionName: 'getApproved',
                      args: [tokenId],
                    }).catch(() => '0x0000000000000000000000000000000000000000');

                    const isApproved = isApprovedForAll || approvedAddr.toLowerCase() === marketplaceAddr.toLowerCase();
                    const isListed = fetchedListings.some(
                      (l) =>
                        l.nftContract.toLowerCase() === domainNftAddr.toLowerCase() &&
                        l.tokenId === tokenId &&
                        l.state === 0
                    );

                    return {
                      tokenId,
                      domainName,
                      nftContract: domainNftAddr,
                      isApprovedForMarketplace: isApproved,
                      isListedInEscrow: isListed,
                      owner: checksummedAddress,
                    } as OwnedDomainNFT;
                  } catch {
                    return null;
                  }
                });

                const enumResults = await Promise.allSettled(enumPromises);
                for (const r of enumResults) {
                  if (r.status === 'fulfilled' && r.value) {
                    foundDomains.push(r.value);
                  }
                }
                if (foundDomains.length > 0) {
                  usedEnumerable = true;
                }
              }
            } catch {
              usedEnumerable = false;
            }

            // Attempt 2: Fallback scan if contract is non-enumerable
            if (!usedEnumerable) {
              const tokenScanPromises = Array.from({ length: 100 }, (_, idx) => {
                const tokenId = BigInt(idx + 1);
                return publicClient.readContract({
                  address: domainNftAddr,
                  abi: ERC721_ABI,
                  functionName: 'ownerOf',
                  args: [tokenId],
                }).then(async (owner) => {
                  if (owner.toLowerCase() === checksummedAddress.toLowerCase()) {
                    const domainName = await resolveDomainName(domainNftAddr, tokenId);
                    const approvedAddr = await publicClient.readContract({
                      address: domainNftAddr,
                      abi: ERC721_ABI,
                      functionName: 'getApproved',
                      args: [tokenId],
                    }).catch(() => '0x0000000000000000000000000000000000000000');

                    const isApproved = isApprovedForAll || approvedAddr.toLowerCase() === marketplaceAddr.toLowerCase();
                    const isListed = fetchedListings.some(
                      (l) =>
                        l.nftContract.toLowerCase() === domainNftAddr.toLowerCase() &&
                        l.tokenId === tokenId &&
                        l.state === 0
                    );

                    return {
                      tokenId,
                      domainName,
                      nftContract: domainNftAddr,
                      isApprovedForMarketplace: isApproved,
                      isListedInEscrow: isListed,
                      owner: checksummedAddress,
                    } as OwnedDomainNFT;
                  }
                  return null;
                }).catch(() => null);
              });

              const scannedResults = await Promise.allSettled(tokenScanPromises);
              for (const r of scannedResults) {
                if (r.status === 'fulfilled' && r.value) {
                  foundDomains.push(r.value);
                }
              }
            }

            if (isMounted) {
              setUserOwnedDomains(foundDomains);
            }
          } catch (scanErr) {
            console.warn('Error scanning user domains:', scanErr);
          } finally {
            if (isMounted) {
              setIsScanningDomains(false);
            }
          }
        } else if (isMounted) {
          setUserOwnedDomains([]);
        }
      } catch (err) {
        console.error('Error fetching on-chain data:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchOnchainData();
    return () => {
      isMounted = false;
    };
  }, [checksummedAddress, refetchTrigger]);

  // Execute on-chain action with full transaction lifecycle management
  const executeTx = async (
    title: string,
    action: (client: any) => Promise<`0x${string}`>
  ): Promise<boolean> => {
    if (!walletClient || !checksummedAddress) {
      setTxStatus({
        state: 'error',
        title,
        errorMessage: 'Please connect your Arbitrum wallet first via RainbowKit.',
      });
      return false;
    }

    try {
      setTxStatus({ state: 'waiting-wallet', title });
      const hash = await action(walletClient);
      setTxStatus({ state: 'pending', title, txHash: hash });

      // Wait for on-chain receipt confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === 'success') {
        setTxStatus({ state: 'success', title, txHash: hash });
        refreshData();
        return true;
      } else {
        setTxStatus({
          state: 'error',
          title,
          txHash: hash,
          errorMessage: 'Transaction reverted on-chain.',
        });
        return false;
      }
    } catch (err: any) {
      console.error('Transaction error:', err);
      const friendlyMessage = formatWeb3Error(err);
      setTxStatus({
        state: 'error',
        title,
        errorMessage: friendlyMessage,
      });
      return false;
    }
  };

  // Safe write contract helper with dynamic gas fee buffer for Arbitrum
  const safeWriteContract = async (client: any, params: any): Promise<`0x${string}`> => {
    let gasConfig: any = {};
    try {
      const fees = await publicClient.estimateFeesPerGas();
      if (fees.maxFeePerGas) {
        gasConfig.maxFeePerGas = (fees.maxFeePerGas * 150n) / 100n;
      }
      if (fees.maxPriorityFeePerGas) {
        gasConfig.maxPriorityFeePerGas = (fees.maxPriorityFeePerGas * 130n) / 100n;
      }
      if (!gasConfig.maxFeePerGas && fees.gasPrice) {
        gasConfig.gasPrice = (fees.gasPrice * 150n) / 100n;
      }
    } catch (e) {
      console.warn('Could not fetch gas fee estimation, falling back to wallet defaults:', e);
    }

    return client.writeContract({
      ...params,
      ...gasConfig,
    });
  };

  // 1. Approve USDC Spending
  const approveUSDC = async (amount: bigint): Promise<boolean> => {
    return executeTx('Approve USDC', async (client) => {
      return safeWriteContract(client, {
        address: APP_CONFIG.contracts.usdc.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [APP_CONFIG.contracts.marketplace.address, amount],
      });
    });
  };

  // 2. Buy Tokens
  const buyTokens = async (listingId: number, tokenAmount: bigint): Promise<boolean> => {
    return executeTx(`Buy Tokens (Listing #${listingId})`, async (client) => {
      return safeWriteContract(client, {
        address: APP_CONFIG.contracts.marketplace.address,
        abi: MARKETPLACE_ABI,
        functionName: 'buyTokens',
        args: [BigInt(listingId), tokenAmount],
      });
    });
  };

  // 3. Redeem Tokens During Active Offering
  const redeemTokens = async (listingId: number, tokenAmount: bigint): Promise<boolean> => {
    return executeTx(`Redeem Tokens (Listing #${listingId})`, async (client) => {
      return safeWriteContract(client, {
        address: APP_CONFIG.contracts.marketplace.address,
        abi: MARKETPLACE_ABI,
        functionName: 'redeemTokens',
        args: [BigInt(listingId), tokenAmount],
      });
    });
  };

  // 4. Buyout Entire Domain NFT
  const buyoutDomain = async (listingId: number): Promise<boolean> => {
    return executeTx(`Complete Domain Buyout (Listing #${listingId})`, async (client) => {
      return safeWriteContract(client, {
        address: APP_CONFIG.contracts.marketplace.address,
        abi: MARKETPLACE_ABI,
        functionName: 'buyoutDomain',
        args: [BigInt(listingId)],
      });
    });
  };

  // 5. Claim Pro-Rata Sale Payout
  const claimSalePayout = async (listingId: number): Promise<boolean> => {
    return executeTx(`Claim Sale Payout (Listing #${listingId})`, async (client) => {
      return safeWriteContract(client, {
        address: APP_CONFIG.contracts.marketplace.address,
        abi: MARKETPLACE_ABI,
        functionName: 'claimSalePayout',
        args: [BigInt(listingId)],
      });
    });
  };

  // 6. Cancel Listing (Seller only)
  const cancelListing = async (listingId: number): Promise<boolean> => {
    return executeTx(`Cancel Listing #${listingId}`, async (client) => {
      return safeWriteContract(client, {
        address: APP_CONFIG.contracts.marketplace.address,
        abi: MARKETPLACE_ABI,
        functionName: 'cancelListing',
        args: [BigInt(listingId)],
      });
    });
  };

  // 7. Settle Expired Listing
  const finalizeExpiredListing = async (listingId: number): Promise<boolean> => {
    return executeTx(`Finalize Expired Listing #${listingId}`, async (client) => {
      return safeWriteContract(client, {
        address: APP_CONFIG.contracts.marketplace.address,
        abi: MARKETPLACE_ABI,
        functionName: 'finalizeExpiredListing',
        args: [BigInt(listingId)],
      });
    });
  };

  // 8. Claim 100% Refund (For Cancelled/Expired listings)
  const claimRefund = async (listingId: number): Promise<boolean> => {
    return executeTx(`Claim 100% Refund (Listing #${listingId})`, async (client) => {
      return safeWriteContract(client, {
        address: APP_CONFIG.contracts.marketplace.address,
        abi: MARKETPLACE_ABI,
        functionName: 'claimRefund',
        args: [BigInt(listingId)],
      });
    });
  };

  // 9. Create New Listing
  const createListing = async (
    nftContract: `0x${string}`,
    tokenId: bigint,
    domainName: string,
    askingPriceUSDC: bigint,
    discountBps: bigint,
    durationDays: number
  ): Promise<boolean> => {
    const durationSeconds = BigInt(durationDays * 24 * 60 * 60);

    return executeTx(`Create Escrow Listing (${domainName})`, async (client) => {
      return safeWriteContract(client, {
        address: APP_CONFIG.contracts.marketplace.address,
        abi: MARKETPLACE_ABI,
        functionName: 'createListing',
        args: [
          getAddress(nftContract),
          tokenId,
          domainName,
          askingPriceUSDC,
          discountBps,
          durationSeconds,
        ],
      });
    });
  };

  // 10. Approve NFT to Marketplace Escrow
  const approveNFT = async (nftContract: `0x${string}`, tokenId: bigint): Promise<boolean> => {
    return executeTx(`Approve NFT #${tokenId} for Escrow`, async (client) => {
      return safeWriteContract(client, {
        address: getAddress(nftContract),
        abi: ERC721_ABI,
        functionName: 'approve',
        args: [APP_CONFIG.contracts.marketplace.address, tokenId],
      });
    });
  };

  // 11. Pre-check if domain is already registered on-chain
  const checkDomainAvailability = async (rawDomainName: string): Promise<boolean> => {
    const trimmed = rawDomainName.trim().toLowerCase();
    if (!trimmed) return false;
    const formatted = trimmed.endsWith('.i') ? trimmed : `${trimmed}.i`;

    try {
      const isTaken = await publicClient.readContract({
        address: APP_CONFIG.contracts.domainNft.address,
        abi: ERC721_ABI,
        functionName: 'isDomainTaken',
        args: [formatted],
      });
      return !isTaken;
    } catch (e) {
      console.warn('Error checking domain availability on-chain:', e);
      return true;
    }
  };

  return {
    listings,
    userPositions,
    userOwnedDomains,
    isScanningDomains,
    usdcBalance,
    usdcAllowance,
    isLoading,
    txStatus,
    setTxStatus,
    refreshData,
    approveUSDC,
    buyTokens,
    redeemTokens,
    buyoutDomain,
    claimSalePayout,
    cancelListing,
    finalizeExpiredListing,
    claimRefund,
    createListing,
    approveNFT,
    checkDomainAvailability,
    isConnected,
    account: checksummedAddress,
  };
}
