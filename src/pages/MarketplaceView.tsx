import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, Plus, Globe, ShieldCheck } from 'lucide-react';
import { DomainListing, ListingStatus } from '../types/domain.ts';
import { ListingCard } from '../components/ListingCard.tsx';
import { formatUSDC } from '../utils/format.ts';

interface MarketplaceViewProps {
  listings: DomainListing[];
  isLoading: boolean;
  onSelectListing: (listing: DomainListing) => void;
  onNavigateCreate: () => void;
  onRefresh: () => void;
  theme?: 'light' | 'dark';
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  listings,
  isLoading,
  onSelectListing,
  onNavigateCreate,
  onRefresh,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter listings
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch = item.domainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nftContract.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tokenId.toString().includes(searchQuery);

      if (!matchesSearch) return false;

      if (statusFilter === 'active') return item.state === ListingStatus.ACTIVE;
      if (statusFilter === 'sold') return item.state === ListingStatus.SOLD;
      if (statusFilter === 'expired') return item.state === ListingStatus.EXPIRED;
      if (statusFilter === 'cancelled') return item.state === ListingStatus.CANCELLED;
      return true;
    });
  }, [listings, searchQuery, statusFilter]);

  // Aggregate stats
  const totalVolume = listings.reduce((acc, l) => acc + l.escrowedUSDC, 0n);
  const activeCount = listings.filter((l) => l.state === ListingStatus.ACTIVE).length;
  const soldCount = listings.filter((l) => l.state === ListingStatus.SOLD).length;
  const expiredCount = listings.filter((l) => l.state === ListingStatus.EXPIRED).length;
  const cancelledCount = listings.filter((l) => l.state === ListingStatus.CANCELLED).length;

  return (
    <div className="max-w-[112rem] mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-2">
      {/* Hero Strip */}
      <div className={`relative overflow-hidden rounded-2xl p-6 sm:p-2 border transition-colors ${isDark
        ? 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border-slate-800'
        : 'bg-gradient-to-r from-white via-cyan-50/50 to-blue-50/60 border-slate-200/90 shadow-xs'
        }`}>
        <div className="lg:flex items-center justify-between gap-3 max-w-[112rem] space-y-2">
          <div>
            <h1 className={`text-2xl font-extrabold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'
              }`}>
              Tokenize .i Domains
            </h1>

            <p className={`text-xs leading-relaxed max-w-3xl ${isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
              Tokenize <strong>.i</strong> domains into 1,000,000 fixed tokens on Arbitrum. Backed 100% by smart contract escrow with pro-rata payout.
            </p>
          </div>
          <div>
            <button
              onClick={onNavigateCreate}
              className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" />
              List Domains
            </button>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs font-mono">
          <div className={`flex gap-2 items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white/80 border-slate-200 shadow-xs'}`}>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Total Offerings</span>
            <span className={`text-sm font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{listings.length}</span>
          </div>
          <div className={`flex gap-2 items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white/80 border-slate-200 shadow-xs'}`}>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Active Listings</span>
            <span className={`text-sm font-bold tabular-nums ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{activeCount}</span>
          </div>
          <div className={`flex gap-2 items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white/80 border-slate-200 shadow-xs'}`}>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Domains Sold</span>
            <span className={`text-sm font-bold tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{soldCount}</span>
          </div>
          <div className={`flex gap-2 items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white/80 border-slate-200 shadow-xs'}`}>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Escrowed Volume</span>
            <span className={`text-sm font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatUSDC(totalVolume)}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div id="listings-section" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search domains by name, contract, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono border ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-xs'
                }`}
            />
          </div>

          {/* Filter Tabs */}
          <div className={`flex items-center gap-1 p-1 rounded-lg text-xs font-medium border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-xs'
            }`}>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${statusFilter === 'all'
                ? (isDark ? 'bg-slate-800 text-white font-bold' : 'bg-slate-100 text-slate-900 font-bold')
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              All ({listings.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-md transition-colors ${statusFilter === 'active'
                ? (isDark ? 'bg-slate-800 text-cyan-400 font-bold' : 'bg-cyan-50 text-cyan-700 font-bold')
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('sold')}
              className={`px-3 py-1.5 rounded-md transition-colors ${statusFilter === 'sold'
                ? (isDark ? 'bg-slate-800 text-emerald-400 font-bold' : 'bg-emerald-50 text-emerald-700 font-bold')
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Sold ({soldCount})
            </button>
            <button
              onClick={() => setStatusFilter('expired')}
              className={`px-3 py-1.5 rounded-md transition-colors ${statusFilter === 'expired'
                ? (isDark ? 'bg-slate-800 text-amber-400 font-bold' : 'bg-amber-50 text-amber-700 font-bold')
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Expired ({expiredCount})
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 rounded-md transition-colors ${statusFilter === 'cancelled'
                ? (isDark ? 'bg-slate-800 text-rose-400 font-bold' : 'bg-rose-50 text-rose-700 font-bold')
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Cancelled ({cancelledCount})
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className={`p-2 rounded-lg border transition-colors flex items-center justify-center self-end sm:self-auto ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900 shadow-xs'
              }`}
            title="Refresh Blockchain Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-500' : ''}`} />
          </button>
        </div>

        {/* Listings Grid */}
        {isLoading && listings.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto" />
            <p className="text-sm font-mono text-slate-500 dark:text-slate-400">Querying Arbitrum on-chain listings...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className={`py-20 text-center rounded-2xl p-8 space-y-4 border ${isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200'
            }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
              }`}>
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">No Active Listings Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {listings.length === 0
                ? 'No domain listings exist on the Arbitrum contract yet.'
                : 'No listings match your filter criteria.'}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={onNavigateCreate}
                className="py-2 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
              >
                List the First .i Domain
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.listingId}
                listing={listing}
                onSelect={onSelectListing}
                theme={theme}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
