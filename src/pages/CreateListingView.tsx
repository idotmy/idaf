import React, { useState, useEffect } from 'react';
import { parseUnits } from 'viem';
import {
  ShieldCheck,
  CheckCircle2,
  Globe,
  RefreshCw,
  AlertCircle,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { APP_CONFIG } from '../config/contracts.ts';
import { OwnedDomainNFT } from '../types/domain.ts';

interface CreateListingViewProps {
  account?: `0x${string}`;
  isConnected: boolean;
  userOwnedDomains: OwnedDomainNFT[];
  isScanningDomains: boolean;
  onCreateListing: (
    nftContract: `0x${string}`,
    tokenId: bigint,
    domainName: string,
    askingPriceUSDC: bigint,
    discountBps: bigint,
    durationDays: number
  ) => Promise<boolean>;
  onApproveNFT: (nftContract: `0x${string}`, tokenId: bigint) => Promise<boolean>;
  checkDomainAvailability: (domainName: string) => Promise<boolean>;
  onRefresh: () => void;
  onNavigateMarketplace: () => void;
  theme?: 'light' | 'dark';
}

export const CreateListingView: React.FC<CreateListingViewProps> = ({
  account,
  isConnected,
  userOwnedDomains,
  isScanningDomains,
  onCreateListing,
  onApproveNFT,
  checkDomainAvailability,
  onRefresh,
  onNavigateMarketplace,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

  // Selected domain state
  const [selectedTokenId, setSelectedTokenId] = useState<string>('');
  const [selectedDomainName, setSelectedDomainName] = useState<string>('');
  const [isApproved, setIsApproved] = useState<boolean>(false);

  // Pricing & economics
  const [askingPriceInput, setAskingPriceInput] = useState<string>('1000');
  const [selectedDiscountBps, setSelectedDiscountBps] = useState<number>(2000); // 20%
  const [durationDays, setDurationDays] = useState<number>(30);

  // Flow & submission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionStage, setActionStage] = useState<'idle' | 'approving' | 'listing'>('idle');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Simulation slider for example outcome
  const [simSoldPercent, setSimSoldPercent] = useState<number>(10);

  // Auto-select first available domain when owned list loads
  useEffect(() => {
    if (userOwnedDomains.length > 0 && !selectedTokenId) {
      const available = userOwnedDomains.find((d) => !d.isListedInEscrow) || userOwnedDomains[0];
      if (available) {
        setSelectedTokenId(available.tokenId.toString());
        setSelectedDomainName(available.domainName);
        setIsApproved(available.isApprovedForMarketplace);
      }
    }
  }, [userOwnedDomains, selectedTokenId]);

  // When clicking an owned domain card
  const handleSelectOwnedDomain = (domain: OwnedDomainNFT) => {
    if (domain.isListedInEscrow) return;
    setSelectedTokenId(domain.tokenId.toString());
    setSelectedDomainName(domain.domainName);
    setIsApproved(domain.isApprovedForMarketplace);
  };

  // Calculations
  const askingPriceUSD = parseFloat(askingPriceInput) || 0;
  const selectedDiscountObj =
    APP_CONFIG.allowedDiscounts.find((d) => d.value === selectedDiscountBps) ||
    APP_CONFIG.allowedDiscounts[1];
  const offeringValueUSD = askingPriceUSD * (1 - selectedDiscountObj.percentage / 100);
  const tokenUnitPrice = offeringValueUSD / APP_CONFIG.totalTokenSupply;

  // Handle Approve NFT
  const handleApprove = async () => {
    if (!selectedTokenId) return;
    setIsSubmitting(true);
    setActionStage('approving');
    try {
      const ok = await onApproveNFT(
        APP_CONFIG.contracts.domainNft.address,
        BigInt(selectedTokenId)
      );
      if (ok) {
        setIsApproved(true);
        onRefresh();
      }
    } finally {
      setIsSubmitting(false);
      setActionStage('idle');
    }
  };

  // Handle Create Listing
  const handleCreate = async () => {
    if (!selectedTokenId || !selectedDomainName || askingPriceUSD <= 0) return;
    setIsSubmitting(true);
    setActionStage('listing');
    try {
      const tokenIdBig = BigInt(selectedTokenId);
      const askingPriceBig = parseUnits(askingPriceUSD.toFixed(6), APP_CONFIG.currencyDecimals);
      const discountBpsBig = BigInt(selectedDiscountBps);

      const ok = await onCreateListing(
        APP_CONFIG.contracts.domainNft.address,
        tokenIdBig,
        selectedDomainName,
        askingPriceBig,
        discountBpsBig,
        durationDays
      );

      if (ok) {
        setIsCompleted(true);
        onRefresh();
      }
    } finally {
      setIsSubmitting(false);
      setActionStage('idle');
    }
  };

  return (
    <div className="max-w-[112rem] mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
      {/* Header Banner */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            List Domains
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Tokenize your .i domain NFT into 1,000,000 fractional ERC-20 shares backed by on-chain smart escrow
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRefresh}
            className={`p-2.5 rounded-xl border text-xs font-mono inline-flex items-center gap-1.5 transition-colors ${isDark
              ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200'
              : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs'
              }`}
            title="Refresh on-chain state"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanningDomains ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {isCompleted ? (
        <div className={`rounded-3xl p-10 text-center space-y-5 border max-w-2xl mx-auto ${isDark ? 'bg-slate-900/90 border-slate-800 shadow-2xl text-white' : 'bg-white border-slate-200 shadow-xl text-slate-900'
          }`}>
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Domain NFT Locked & Listed in Escrow!
            </h2>
            <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Your domain <strong className="text-cyan-400 font-mono font-bold">{selectedDomainName}</strong> is now securely locked in the smart contract escrow. Investors can buy token shares immediately on Arbitrum.
            </p>
          </div>

          <div className={`p-5 rounded-2xl border text-xs font-mono text-left space-y-2.5 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Domain Name:</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedDomainName}</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Token ID:</span>
              <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>#{selectedTokenId}</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Buyout Asking Price:</span>
              <span className="font-bold text-emerald-400">${askingPriceUSD.toLocaleString()} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Offering Valuation ({selectedDiscountObj.percentage}% OFF):</span>
              <span className="font-bold text-cyan-400">${offeringValueUSD.toLocaleString()} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Supply Issued:</span>
              <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>1,000,000 Tokens</span>
            </div>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={onNavigateMarketplace}
              className="py-3 px-6 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Explore in Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsCompleted(false);
                setSelectedTokenId('');
                setSelectedDomainName('');
              }}
              className={`py-3 px-6 rounded-xl border font-bold text-sm transition-colors ${isDark ? 'border-slate-800 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-800 hover:bg-slate-100'}`}
            >
              List Another Domain
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Left Form Area (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            {/* STEP 1: Select Verified Domain NFT */}
            <div className={`rounded-2xl p-6 border space-y-5 transition-all ${isDark ? 'bg-slate-900/60 border-slate-800 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
              }`}>
              <div className={`flex items-center gap-3 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-sm text-cyan-400">
                  1
                </div>
                <div>
                  <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Select Your .i Domain
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Choose an owned .i domain from your connected Arbitrum wallet ({userOwnedDomains.length} Found)
                  </p>
                </div>
              </div>

              {!isConnected ? (
                <div className={`p-8 text-center space-y-3 rounded-xl border border-dashed ${isDark ? 'border-slate-800 bg-slate-950/40 text-slate-300' : 'border-slate-300 bg-slate-50 text-slate-600'}`}>
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-xs">
                    Please connect your Arbitrum wallet to view and select your owned .i domains.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {isScanningDomains ? (
                    <div className="py-8 text-center space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
                      <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Scanning Arbitrum for your domain NFTs...</p>
                    </div>
                  ) : userOwnedDomains.length === 0 ? (
                    <div className={`p-6 rounded-2xl border text-center space-y-3 ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                      <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          No .i Domain NFTs Found in Connected Wallet
                        </h3>
                        <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          No .i Domain NFTs were detected in this wallet address on Arbitrum. Ensure your wallet is connected to the right account.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                        {userOwnedDomains.map((domain) => {
                          const isSelected = selectedTokenId === domain.tokenId.toString();
                          const isListed = domain.isListedInEscrow;

                          return (
                            <div
                              key={domain.tokenId.toString()}
                              onClick={() => handleSelectOwnedDomain(domain)}
                              className={`p-4 rounded-xl border text-left cursor-pointer transition-all relative ${isListed
                                ? isDark
                                  ? 'bg-slate-950/40 border-slate-800/50 opacity-60 cursor-not-allowed'
                                  : 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                                : isSelected
                                  ? isDark
                                    ? 'bg-cyan-950/50 border-cyan-400 ring-2 ring-cyan-500/30 shadow-md'
                                    : 'bg-cyan-50/80 border-cyan-500 ring-2 ring-cyan-500/30 shadow-xs'
                                  : isDark
                                    ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                                }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2.5">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${isDark ? 'bg-cyan-950/80 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'}`}>
                                    <Globe className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className={`font-mono font-bold text-sm tracking-tight truncate max-w-[150px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                      {domain.domainName}
                                    </div>
                                    <div className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                      Token ID #{domain.tokenId.toString()}
                                    </div>
                                  </div>
                                </div>

                                {isSelected && !isListed && (
                                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                                )}
                              </div>

                              <div className={`flex items-center justify-between pt-2.5 border-t text-[11px] font-mono ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                {isListed ? (
                                  <span className="text-amber-400 font-semibold inline-flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> In Escrow
                                  </span>
                                ) : domain.isApprovedForMarketplace ? (
                                  <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Approved
                                  </span>
                                ) : (
                                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                                    Ready to List
                                  </span>
                                )}

                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isSelected ? 'bg-cyan-500 text-slate-950' : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                                  }`}>
                                  {isListed ? 'LISTED' : isSelected ? 'SELECTED' : 'SELECT'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Selected domain confirmation banner */}
                      {selectedTokenId && (
                        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${isDark ? 'bg-cyan-950/30 border-cyan-500/30 text-slate-200' : 'bg-cyan-50 border-cyan-200 text-slate-700'}`}>
                          <div className="flex items-center gap-2">
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Selected Domain:</span>
                            <span className="font-mono font-bold text-cyan-400 text-sm">
                              {selectedDomainName}
                            </span>
                          </div>
                          <span className={`font-mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Token ID #{selectedTokenId}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* STEP 2: Fractional Offering Economics */}
            <div className={`rounded-2xl p-6 border space-y-5 transition-all ${isDark ? 'bg-slate-900/60 border-slate-800 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
              }`}>
              <div className={`flex items-center gap-3 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-sm text-cyan-400">
                  2
                </div>
                <div>
                  <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Configure Token Offering Economics
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Set buyout asking price, duration, and investor discount tier
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Asking Price Input */}
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Full Buyout Asking Price (USDC)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={askingPriceInput}
                      onChange={(e) => setAskingPriceInput(e.target.value)}
                      className={`w-full rounded-xl pl-4 pr-16 py-2.5 font-mono text-sm focus:outline-none border ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-400' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                        }`}
                      placeholder="1000"
                    />
                    <span className="absolute right-3.5 top-3 text-xs font-mono font-bold text-slate-400">
                      USDC
                    </span>
                  </div>
                  {/* Quick price presets */}
                  <div className="flex gap-1.5 mt-2">
                    {[500, 1000, 2500, 5000].map((val) => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setAskingPriceInput(val.toString())}
                        className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-colors ${askingPriceInput === val.toString()
                          ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-500'
                          : isDark
                            ? 'border-slate-800 bg-slate-950/60 text-slate-300 hover:text-white hover:border-slate-700'
                            : 'border-slate-200 text-slate-600 hover:text-slate-900 bg-slate-50'
                          }`}
                      >
                        ${val.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Select */}
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Escrow Offering Duration
                  </label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className={`w-full rounded-xl px-4 py-2.5 font-mono text-xs focus:outline-none border ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-400' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                      }`}
                  >
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days (Recommended)</option>
                    <option value={60}>60 Days</option>
                    <option value={90}>90 Days</option>
                  </select>
                  <p className={`text-[11px] font-mono mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    If unsold after {durationDays} days, investors get 100% principal refund.
                  </p>
                </div>
              </div>

              {/* Curated Discount Tiers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`block text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Curated Offering Discount Tier (On-Chain Enforced)
                  </label>
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                    Selected: {selectedDiscountObj.percentage}% Discount
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {APP_CONFIG.allowedDiscounts.map((discount) => {
                    const isTierSelected = selectedDiscountBps === discount.value;
                    return (
                      <button
                        type="button"
                        key={discount.value}
                        onClick={() => setSelectedDiscountBps(discount.value)}
                        className={`p-3 rounded-xl border text-center transition-all ${isTierSelected
                          ? isDark
                            ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 font-bold ring-1 ring-cyan-400/50 shadow-md'
                            : 'bg-cyan-50 border-cyan-500 text-cyan-900 font-bold shadow-xs ring-1 ring-cyan-500'
                          : isDark
                            ? 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                          }`}
                      >
                        <div className="text-xs font-mono font-bold">{discount.percentage}% OFF</div>
                        <div className="text-[11px] text-emerald-400 mt-1 font-semibold">
                          +{discount.investorRoi.toFixed(0)}% ROI
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* STEP 3: Smart Execution (2-Step Approval & Listing) */}
            <div className={`rounded-2xl p-6 border space-y-4 ${isDark ? 'bg-slate-900/60 border-slate-800 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
              }`}>
              <div className={`flex items-center gap-3 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-sm text-cyan-400">
                  3
                </div>
                <div>
                  <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Escrow Authorization & Launch
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Deposit the domain NFT into the escrow marketplace contract
                  </p>
                </div>
              </div>

              {!selectedTokenId ? (
                <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${isDark ? 'bg-amber-950/20 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Please select an owned domain NFT in Step 1 before proceeding.</span>
                </div>
              ) : !isApproved ? (
                <div className="space-y-3">
                  <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${isDark ? 'bg-cyan-950/30 border-cyan-500/30 text-slate-200' : 'bg-cyan-50 border-cyan-200 text-slate-800'}`}>
                    <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-1">Step 1 of 2: Approval Required</span>
                      <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                        Before listing, grant the marketplace escrow contract permission to transfer <strong>{selectedDomainName}</strong>.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isSubmitting || !isConnected}
                    className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {actionStage === 'approving'
                      ? 'Approving NFT in Wallet...'
                      : `Approve ${selectedDomainName} for Escrow`}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${isDark ? 'bg-emerald-950/30 border-emerald-500/30 text-slate-200' : 'bg-emerald-50 border-emerald-200 text-slate-800'}`}>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-1">NFT Approved & Ready</span>
                      <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                        Contract approval verified on Arbitrum. Click below to lock the domain in escrow and issue tokens.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={isSubmitting || askingPriceUSD <= 0 || !isConnected}
                    className="w-full py-3.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    {actionStage === 'listing'
                      ? 'Locking in Escrow & Creating Listing...'
                      : `Lock in Escrow & Create ${selectedDomainName} Listing`}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Live Preview & Economics Terminal (5 Columns) */}
          <div className="lg:col-span-5 space-y-5 sticky top-6">
            {/* Visual Domain Certificate Preview */}
            <div className={`rounded-3xl p-6 border relative overflow-hidden transition-all ${isDark
              ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border-slate-800 shadow-2xl'
              : 'bg-gradient-to-br from-white via-slate-50 to-cyan-50/50 border-slate-200 shadow-lg'
              }`}>
              <div className={`flex items-center justify-between gap-2 border-b pb-3.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className={`text-[11px] font-mono uppercase tracking-widest font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Arbitrum Certificate
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                  1,000,000 Tokens
                </span>
              </div>

              {/* Big Domain Display */}
              <div className="py-7 text-center space-y-1.5">
                <div className={`text-3xl sm:text-4xl font-black font-mono tracking-tight flex items-center justify-center gap-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <span>{selectedDomainName || 'yourdomain.i'}</span>
                </div>
                <div className={`text-xs font-mono flex items-center justify-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>Token ID: #{selectedTokenId || '—'}</span>
                  <span>·</span>
                  <span>{durationDays} Days Escrow</span>
                </div>
              </div>

              {/* Economic Summary Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                  <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Buyout Price</div>
                  <div className={`text-sm font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    ${askingPriceUSD.toLocaleString()} USDC
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                  <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Offering ({selectedDiscountObj.percentage}% OFF)</div>
                  <div className="text-sm font-bold text-cyan-400 mt-1">
                    ${offeringValueUSD.toLocaleString()} USDC
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                  <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Token Unit Price</div>
                  <div className="text-sm font-bold text-emerald-400 mt-1">
                    ${tokenUnitPrice.toFixed(6)}
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                  <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Investor ROI</div>
                  <div className="text-sm font-bold text-emerald-400 mt-1">
                    +{selectedDiscountObj.investorRoi.toFixed(0)}% Profit
                  </div>
                </div>
              </div>

              {/* Settlement Simulation Breakdown */}
              <div className={`mt-5 p-4 rounded-2xl border space-y-3.5 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                <div className={`flex items-center justify-between text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <span>Pro-Rata Settlement Simulator</span>
                  <span className="font-mono text-cyan-400 font-bold">{simSoldPercent}% Sold</span>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={simSoldPercent}
                  onChange={(e) => setSimSoldPercent(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />

                <div className="space-y-2 text-xs font-mono pt-1">
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Tokens Sold to Investors:</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {(APP_CONFIG.totalTokenSupply * (simSoldPercent / 100)).toLocaleString()} Tokens
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Capital Raised from Offering:</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      ${(offeringValueUSD * (simSoldPercent / 100)).toFixed(2)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Investor Payout at Buyout:</span>
                    <span className="text-emerald-400 font-bold">
                      ${(askingPriceUSD * (simSoldPercent / 100)).toFixed(2)} USDC
                    </span>
                  </div>
                  <div className={`flex justify-between border-t pt-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Your Total Seller Proceeds:</span>
                    <span className="text-cyan-400 font-bold">
                      ${(
                        askingPriceUSD * (1 - simSoldPercent / 100) +
                        offeringValueUSD * (simSoldPercent / 100)
                      ).toFixed(2)} USDC
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
