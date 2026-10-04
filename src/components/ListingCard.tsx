import React from 'react';
import { Globe, ArrowUpRight, Clock } from 'lucide-react';
import { DomainListing, ListingStatus } from '../types/domain.ts';
import { formatUSDC, formatTokenAmount, formatTimeRemaining, formatAddress } from '../utils/format.ts';
import { APP_CONFIG } from '../config/contracts.ts';

interface ListingCardProps {
  listing: DomainListing;
  onSelect: (listing: DomainListing) => void;
  theme?: 'light' | 'dark';
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onSelect, theme = 'light' }) => {
  const isDark = theme === 'dark';
  const timeInfo = formatTimeRemaining(listing.expiresAt);
  const totalTokens = APP_CONFIG.totalTokenSupply;
  const soldNum = Number(listing.tokensSold) / 10 ** APP_CONFIG.tokensDecimals;
  const soldPercent = Math.min(100, (soldNum / totalTokens) * 100);
  const discountPercent = Number(listing.discountBps) / 100;

  // Calculate unit token price in USD
  const tokenUnitPrice = (Number(listing.offeringTotalUSDC) / 10 ** APP_CONFIG.currencyDecimals) / totalTokens;

  // Status text
  const getStatusLabel = () => {
    switch (listing.state) {
      case ListingStatus.ACTIVE:
        return timeInfo.isExpired ? 'Expired (Pending Settle)' : 'Active Offering';
      case ListingStatus.SOLD:
        return 'Domain Sold';
      case ListingStatus.EXPIRED:
        return 'Expired';
      case ListingStatus.CANCELLED:
        return 'Cancelled';
      case ListingStatus.SETTLED:
        return 'Settled';
      default:
        return 'Unknown';
    }
  };

  return (
    <div
      onClick={() => onSelect(listing)}
      className={`group relative rounded-xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between border ${isDark
          ? 'bg-slate-900/90 hover:bg-slate-900 border-slate-800 hover:border-cyan-500/50 shadow-md'
          : 'bg-white hover:bg-slate-50/90 border-slate-300 hover:border-cyan-600/60 shadow-sm hover:shadow-md'
        }`}
    >
      {/* Header Zone: Domain Name & Status */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs border group-hover:scale-105 transition-transform ${isDark
                ? 'bg-cyan-950/60 border-cyan-500/30 text-cyan-400'
                : 'bg-cyan-50 border-cyan-300 text-cyan-700'
              }`}>
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-lg font-bold tracking-tight transition-colors ${isDark ? 'text-white group-hover:text-cyan-400' : 'text-slate-900 group-hover:text-cyan-600'
                }`}>
                {listing.domainName}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Token #{listing.tokenId.toString()} · {formatAddress(listing.nftContract)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-xs font-semibold ${listing.state === ListingStatus.SOLD
                ? 'text-emerald-600 dark:text-emerald-400'
                : isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
              {getStatusLabel()}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              #{listing.listingId}
            </div>
          </div>
        </div>

        {/* Pricing Metrics Grid */}
        <div className={`grid grid-cols-2 gap-3 py-3 border-y my-3 text-xs ${isDark ? 'border-slate-800/80' : 'border-slate-200'
          }`}>
          <div>
            <span className="text-slate-500 block mb-0.5">Asking Price</span>
            <span className={`text-sm font-semibold font-mono tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatUSDC(listing.askingPriceUSDC)}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block mb-0.5">Discount Tier</span>
            <span className={`text-sm font-semibold font-mono tabular-nums ${isDark ? 'text-cyan-400' : 'text-cyan-700 font-bold'
              }`}>
              {discountPercent}% OFF
            </span>
          </div>

          <div>
            <span className="text-slate-500 block mb-0.5">Offering Target</span>
            <span className={`text-sm font-semibold font-mono tabular-nums ${isDark ? 'text-slate-200' : 'text-slate-700'
              }`}>
              {formatUSDC(listing.offeringTotalUSDC)}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block mb-0.5">Token Unit Price</span>
            <span className={`text-sm font-semibold font-mono tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-600'
              }`}>
              ${tokenUnitPrice.toFixed(6)}
            </span>
          </div>
        </div>

        {/* Offering Progress Bar */}
        <div className="space-y-1.5 my-3">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400">
              Sold: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{formatTokenAmount(listing.tokensSold)}</strong> / 1M
            </span>
            <span className={`font-semibold tabular-nums ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
              {soldPercent.toFixed(1)}% Share
            </span>
          </div>
          <div className={`w-full rounded-full h-2 overflow-hidden border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
            }`}>
            <div
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${soldPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Meta & Action */}
      <div className={`pt-2.5 flex items-center justify-between text-xs border-t mt-2 ${isDark ? 'border-slate-800/50 text-slate-400' : 'border-slate-200 text-slate-500'
        }`}>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <Clock className="w-3.5 h-3.5 opacity-70" />
          <span>{timeInfo.text}</span>
        </div>

        <div className={`flex items-center gap-1 font-medium text-xs ${isDark ? 'text-cyan-400 group-hover:text-cyan-300' : 'text-cyan-700 group-hover:text-cyan-800'
          }`}>
          <span>Trading Terminal</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
