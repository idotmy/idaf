import React, { useState } from 'react';
import { Wallet, RefreshCw } from 'lucide-react';
import { DomainListing, InvestorPosition, ListingStatus } from '../types/domain.ts';
import { formatUSDC, formatTokenAmount } from '../utils/format.ts';
import { APP_CONFIG } from '../config/contracts.ts';

interface PortfolioViewProps {
  account?: `0x${string}`;
  isConnected: boolean;
  listings: DomainListing[];
  userPositions: Record<number, InvestorPosition>;
  onSelectListing: (listing: DomainListing) => void;
  onClaimSalePayout: (listingId: number) => Promise<boolean>;
  onClaimRefund: (listingId: number) => Promise<boolean>;
  onCancelListing: (listingId: number) => Promise<boolean>;
  onRefresh: () => void;
  isLoading: boolean;
  theme?: 'light' | 'dark';
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  account,
  isConnected,
  listings,
  userPositions,
  onSelectListing,
  onClaimSalePayout,
  onClaimRefund,
  onCancelListing,
  onRefresh,
  isLoading,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'investments' | 'my-listings'>('investments');

  if (!isConnected || !account) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
          }`}>
          <Wallet className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold">Connect Wallet to View Portfolio</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Connect your Web3 wallet on Arbitrum to view your token positions, claimable payouts, and created domain listings.
        </p>
      </div>
    );
  }

  // Filter listings where user holds tokens
  const investedListings = listings.filter((l) => {
    const pos = userPositions[l.listingId];
    return pos && pos.tokenBalance > 0n;
  });

  // Filter listings where user is the seller
  const myListings = listings.filter((l) => {
    return l.seller.toLowerCase() === account.toLowerCase();
  });

  // Aggregate user investment portfolio totals
  let totalTokensOwned = 0n;
  let totalContributed = 0n;
  let totalPotentialPayout = 0n;

  Object.values(userPositions).forEach((pos) => {
    totalTokensOwned += pos.tokenBalance;
    totalContributed += pos.usdcContributed;
    totalPotentialPayout += pos.potentialSalePayoutUSDC;
  });

  return (
    <div className="max-w-[112rem] mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-2">
      {/* Header & Stats Strip */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Investor & Creator Portfolio
            </h1>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              Account: {account}
            </p>
          </div>

          <button
            onClick={onRefresh}
            className={`self-start sm:self-auto py-2 px-3 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors border ${isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-xs'
              }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-500' : ''}`} />
            <span>Sync</span>
          </button>
        </div>

        {/* Portfolio Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <div className={`flex gap-2 items-center justify-between rounded-xl p-4 border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <span className={`text-xs block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total USDC Contributed</span>
            <span className={`text-sm font-bold font-mono tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatUSDC(totalContributed)}
            </span>
          </div>

          <div className={`flex gap-2 items-center justify-between rounded-xl p-4 border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <span className={`text-xs block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tokens Held</span>
            <span className={`text-sm font-bold font-mono tabular-nums ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
              {formatTokenAmount(totalTokensOwned)}
            </span>
          </div>

          <div className={`flex gap-2 items-center justify-between rounded-xl p-4 border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <span className={`text-xs block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Potential Sale Payouts</span>
            <span className={`text-sm font-bold font-mono tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {formatUSDC(totalPotentialPayout)}
            </span>
          </div>

          <div className={`flex gap-2 items-center justify-between rounded-xl p-4 border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <span className={`text-xs block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Active Positions</span>
            <span className={`text-sm font-bold font-mono tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {investedListings.length}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex items-center gap-2 border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <button
          onClick={() => setActiveTab('investments')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${activeTab === 'investments'
            ? (isDark ? 'bg-slate-800 text-cyan-400' : 'bg-cyan-50 text-cyan-800 font-bold border border-cyan-200')
            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          My Token Investments ({investedListings.length})
        </button>
        <button
          onClick={() => setActiveTab('my-listings')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${activeTab === 'my-listings'
            ? (isDark ? 'bg-slate-800 text-cyan-400' : 'bg-cyan-50 text-cyan-800 font-bold border border-cyan-200')
            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          My Created Domain Listings ({myListings.length})
        </button>
      </div>

      {/* Tab 1: INVESTMENTS */}
      {activeTab === 'investments' && (
        <div className="space-y-4">
          {investedListings.length === 0 ? (
            <div className={`rounded-2xl p-12 text-center space-y-3 border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-300'
              }`}>
              <p className="text-sm text-slate-500">You do not currently hold  tokens in any domain listings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {investedListings.map((listing) => {
                const pos = userPositions[listing.listingId];
                const userTokensNum = Number(pos.tokenBalance) / 10 ** APP_CONFIG.tokensDecimals;
                const sharePercent = (userTokensNum / APP_CONFIG.totalTokenSupply) * 100;

                return (
                  <div
                    key={listing.listingId}
                    className={`rounded-xl p-5 space-y-4 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${isDark ? 'bg-cyan-950/80 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-300 text-cyan-700'
                          }`}>
                          {listing.domainName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-base font-bold">{listing.domainName}</h3>
                          <span className="text-xs text-slate-500 font-mono">Listing #{listing.listingId}</span>
                        </div>
                      </div>

                      <span className={`text-xs font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                        {sharePercent.toFixed(2)}% Share
                      </span>
                    </div>

                    <div className={`grid grid-cols-2 gap-2 text-xs font-mono py-2 border-y ${isDark ? 'border-slate-800/80' : 'border-slate-200'
                      }`}>
                      <div>
                        <span className="text-slate-500 block">Tokens Held</span>
                        <span className="font-semibold">{formatTokenAmount(pos.tokenBalance)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Cost Paid</span>
                        <span className="font-semibold">{formatUSDC(pos.usdcContributed)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Sale Payout Target</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatUSDC(pos.potentialSalePayoutUSDC)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Status</span>
                        <span>
                          {listing.state === ListingStatus.ACTIVE ? 'Active Offering' : listing.state === ListingStatus.SOLD ? 'Sold & Claimable' : 'Expired/Cancelled'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      {listing.state === ListingStatus.SOLD && pos.potentialSalePayoutUSDC > 0n && (
                        <button
                          onClick={() => onClaimSalePayout(listing.listingId)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Claim {formatUSDC(pos.potentialSalePayoutUSDC)}
                        </button>
                      )}
                      {listing.state === ListingStatus.SOLD && pos.potentialSalePayoutUSDC === 0n && (
                        <p role="status" className="flex-1 text-xs text-amber-700 dark:text-amber-300">
                          Claim amount rounds to 0 USDC. Hold more tokens in this wallet before claiming.
                        </p>
                      )}

                      {(listing.state === ListingStatus.CANCELLED || listing.state === ListingStatus.EXPIRED) && pos.refundableUSDC > 0n && (
                        <button
                          onClick={() => onClaimRefund(listing.listingId)}
                          className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Claim Refund ({formatUSDC(pos.refundableUSDC)})
                        </button>
                      )}
                      {(listing.state === ListingStatus.CANCELLED || listing.state === ListingStatus.EXPIRED) && pos.refundableUSDC === 0n && (
                        <p role="status" className="flex-1 text-xs text-amber-700 dark:text-amber-300">
                          Refund rounds to 0 USDC. Hold more tokens in this wallet before claiming.
                        </p>
                      )}

                      <button
                        onClick={() => onSelectListing(listing)}
                        className={`py-2 px-4 rounded-lg text-xs font-medium transition-colors border ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                      >
                        Terminal
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: MY CREATED LISTINGS */}
      {activeTab === 'my-listings' && (
        <div className="space-y-4">
          {myListings.length === 0 ? (
            <div className={`rounded-2xl p-12 text-center space-y-3 border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
              }`}>
              <p className="text-sm text-slate-500">You have not created any domain listings yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {myListings.map((listing) => (
                <div
                  key={listing.listingId}
                  className={`rounded-xl p-5 space-y-4 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold">{listing.domainName}</h3>
                      <span className="text-xs text-slate-500 font-mono">NFT Token ID #{listing.tokenId.toString()}</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {formatUSDC(listing.askingPriceUSDC)}
                    </span>
                  </div>

                  <div className={`grid grid-cols-2 gap-2 text-xs font-mono py-2 border-y ${isDark ? 'border-slate-800/80' : 'border-slate-100'
                    }`}>
                    <div>
                      <span className="text-slate-500 block">Tokens Sold</span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{formatTokenAmount(listing.tokensSold)} / 1M</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Vault Escrow</span>
                      <span className="font-semibold">{formatUSDC(listing.escrowedUSDC)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {listing.state === ListingStatus.ACTIVE && (
                      <button
                        onClick={() => onCancelListing(listing.listingId)}
                        className="flex-1 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Cancel & Retrieve NFT
                      </button>
                    )}
                    <button
                      onClick={() => onSelectListing(listing)}
                      className={`py-2 px-4 rounded-lg text-xs font-medium transition-colors border ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
