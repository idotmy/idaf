import React, { useState } from 'react';
import { X, ExternalLink, ShieldCheck, ShoppingCart, ArrowDownLeft, AlertTriangle } from 'lucide-react';
import { parseUnits } from 'viem';
import { DomainListing, InvestorPosition, ListingStatus } from '../types/domain.ts';
import { formatUSDC, formatTokenAmount, formatAddress, formatTimeRemaining, getExplorerAddressUrl } from '../utils/format.ts';
import { APP_CONFIG } from '../config/contracts.ts';

interface DomainDetailModalProps {
  listing: DomainListing;
  position?: InvestorPosition;
  account?: `0x${string}`;
  usdcBalance: bigint;
  usdcAllowance: bigint;
  onClose: () => void;
  onApproveUSDC: (amount: bigint) => Promise<boolean>;
  onBuyTokens: (listingId: number, tokenAmount: bigint) => Promise<boolean>;
  onRedeemTokens: (listingId: number, tokenAmount: bigint) => Promise<boolean>;
  onBuyoutDomain: (listingId: number) => Promise<boolean>;
  onCancelListing: (listingId: number) => Promise<boolean>;
  onFinalizeExpired: (listingId: number) => Promise<boolean>;
  onClaimSalePayout: (listingId: number) => Promise<boolean>;
  onClaimRefund: (listingId: number) => Promise<boolean>;
  theme?: 'light' | 'dark';
}

export const DomainDetailModal: React.FC<DomainDetailModalProps> = ({
  listing,
  position,
  account,
  usdcBalance,
  usdcAllowance,
  onClose,
  onApproveUSDC,
  onBuyTokens,
  onRedeemTokens,
  onBuyoutDomain,
  onCancelListing,
  onFinalizeExpired,
  onClaimSalePayout,
  onClaimRefund,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [activeActionTab, setActiveActionTab] = useState<'buy' | 'redeem' | 'buyout' | 'manage'>('buy');
  const [buyAmountInput, setBuyAmountInput] = useState<string>('50000');
  const [redeemAmountInput, setRedeemAmountInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const timeInfo = formatTimeRemaining(listing.expiresAt);
  const totalTokens = APP_CONFIG.totalTokenSupply;
  const soldNum = Number(listing.tokensSold) / 10 ** APP_CONFIG.tokensDecimals;
  const remainingTokens = Math.max(0, totalTokens - soldNum);
  const discountPercent = Number(listing.discountBps) / 100;

  // Offering target & token unit price
  const offeringTargetUSDC = Number(listing.offeringTotalUSDC) / 10 ** APP_CONFIG.currencyDecimals;
  const askingPriceUSD = Number(listing.askingPriceUSDC) / 10 ** APP_CONFIG.currencyDecimals;
  const tokenUnitPrice = offeringTargetUSDC / totalTokens;

  // Buy calculations
  const buyAmountTokens = parseFloat(buyAmountInput) || 0;
  const buyAmountUnits = (() => {
    const amount = buyAmountInput.trim();
    if (!amount) return 0n;
    try {
      return parseUnits(amount, APP_CONFIG.tokensDecimals);
    } catch {
      return 0n;
    }
  })();
  const totalTokenUnits =
    BigInt(APP_CONFIG.totalTokenSupply) * 10n ** BigInt(APP_CONFIG.tokensDecimals);
  const exactBuyCostUSDCBigInt =
    totalTokenUnits > 0n ? (buyAmountUnits * listing.offeringTotalUSDC) / totalTokenUnits : 0n;
  const buyCostUSDC =
    exactBuyCostUSDCBigInt > 0n
      ? Number(exactBuyCostUSDCBigInt) / 10 ** APP_CONFIG.currencyDecimals
      : buyAmountTokens * tokenUnitPrice;
  const needsAllowance = usdcAllowance < exactBuyCostUSDCBigInt;
  const hasInsufficientBalanceForBuy = Boolean(account && exactBuyCostUSDCBigInt > 0n && usdcBalance < exactBuyCostUSDCBigInt);
  const hasInsufficientBalanceForBuyout = Boolean(account && usdcBalance < listing.askingPriceUSDC);

  // Potential payout if whole domain is sold at Asking Price:
  const potentialPayout = (buyAmountTokens / totalTokens) * askingPriceUSD;
  const netProfit = potentialPayout - buyCostUSDC;

  const isSeller = account && listing.seller.toLowerCase() === account.toLowerCase();
  const userTokenBalance = position?.tokenBalance || 0n;
  const userTokenBalanceNum = Number(userTokenBalance) / 10 ** APP_CONFIG.tokensDecimals;
  const salePayoutUSDC = position?.potentialSalePayoutUSDC ?? 0n;
  const refundUSDC = position?.refundableUSDC ?? 0n;
  const ownerRetainedUnits =
    totalTokenUnits > listing.tokensSold ? totalTokenUnits - listing.tokensSold : 0n;
  const redeemAmountUnits = (() => {
    const amount = redeemAmountInput.trim();
    if (!amount) return 0n;
    try {
      return parseUnits(amount, APP_CONFIG.tokensDecimals);
    } catch {
      return 0n;
    }
  })();
  const redeemAmountValid = redeemAmountUnits > 0n && redeemAmountUnits <= userTokenBalance;
  const calculatedRedeemRefund =
    (redeemAmountUnits * listing.offeringTotalUSDC) / totalTokenUnits;
  const estimatedRedeemRefund =
    calculatedRedeemRefund > listing.escrowedUSDC
      ? listing.escrowedUSDC
      : calculatedRedeemRefund;
  const redeemAmountTooSmall = redeemAmountValid && estimatedRedeemRefund === 0n;

  const handleBuy = async () => {
    if (!account || buyAmountTokens <= 0 || buyAmountTokens > remainingTokens || buyAmountUnits === 0n || hasInsufficientBalanceForBuy) return;
    setIsSubmitting(true);
    try {
      if (needsAllowance) {
        const approved = await onApproveUSDC(exactBuyCostUSDCBigInt);
        if (!approved) return;
      }
      await onBuyTokens(listing.listingId, buyAmountUnits);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRedeem = async () => {
    if (!redeemAmountValid || estimatedRedeemRefund === 0n) return;
    setIsSubmitting(true);
    try {
      await onRedeemTokens(listing.listingId, redeemAmountUnits);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuyout = async () => {
    if (!account || listing.state !== ListingStatus.ACTIVE || hasInsufficientBalanceForBuyout) return;
    setIsSubmitting(true);
    try {
      if (usdcAllowance < listing.askingPriceUSDC) {
        const approved = await onApproveUSDC(listing.askingPriceUSDC);
        if (!approved) return;
      }
      await onBuyoutDomain(listing.listingId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className={`w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden relative my-auto border transition-colors ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
        {/* Modal Header */}
        <div className={`px-6 py-5 border-b flex items-center justify-between ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/80'
          }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-lg ${isDark ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
              }`}>
              {listing.domainName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                  {listing.domainName}
                </h2>
                <span className={`text-xs font-mono px-2 py-0.5 rounded border ${isDark ? 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40' : 'text-cyan-700 border-cyan-200 bg-cyan-50 font-medium'
                  }`}>
                  Listing #{listing.listingId}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                <span>NFT: {formatAddress(listing.nftContract)}</span>
                <span>·</span>
                <span>Token ID: #{listing.tokenId.toString()}</span>
                <span>·</span>
                <a
                  href={getExplorerAddressUrl(listing.idafToken)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                >
                  ERC-20 Contract <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-lg border transition-colors ${isDark ? 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white' : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Grid */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x ${isDark ? 'divide-slate-800' : 'divide-slate-200'
          }`}>
          {/* Left Column: On-Chain Economic Metrics */}
          <div className="lg:col-span-7 p-6 space-y-6">
            {/* Key Metric Blocks */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`rounded-xl p-3.5 border ${isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}>
                <span className="text-xs text-slate-500 block mb-1">Asking Price</span>
                <span className="text-base font-bold font-mono tabular-nums">
                  {formatUSDC(listing.askingPriceUSDC)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Full Buyout</span>
              </div>

              <div className={`rounded-xl p-3.5 border ${isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}>
                <span className="text-xs text-slate-500 block mb-1">Offering Value</span>
                <span className="text-base font-bold text-cyan-600 dark:text-cyan-400 font-mono tabular-nums">
                  {formatUSDC(listing.offeringTotalUSDC)}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  {discountPercent}% Discount
                </span>
              </div>

              <div className={`rounded-xl p-3.5 border ${isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}>
                <span className="text-xs text-slate-500 block mb-1">Token Unit Price</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                  ${tokenUnitPrice.toFixed(6)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Fixed per Token</span>
              </div>
            </div>

            {/* Token Distribution Progress */}
            <div className={`rounded-xl p-4 space-y-3 border ${isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500 dark:text-slate-400">
                  Investor Share: <strong className="text-cyan-600 dark:text-cyan-400">{formatTokenAmount(listing.tokensSold)}</strong> ({((soldNum / totalTokens) * 100).toFixed(1)}%)
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Owner Retained: <strong>{formatTokenAmount(ownerRetainedUnits)}</strong>
                </span>
              </div>
              <div className={`w-full rounded-full h-3 overflow-hidden border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200 border-slate-300'
                }`}>
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(soldNum / totalTokens) * 100}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span>Escrowed in Vault: <strong className="font-mono text-slate-900 dark:text-white">{formatUSDC(listing.escrowedUSDC)}</strong></span>
                <span className="font-mono text-[11px]">{timeInfo.text}</span>
              </div>
            </div>

            {/* Settlement Rules */}
            <div className={`rounded-xl p-4 space-y-2 text-xs border ${isDark ? 'bg-slate-950/40 border-slate-800/60 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-semibold mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>On-Chain Settlement Rules</span>
              </div>
              <p className="leading-relaxed">
                <strong>When Domain Sells:</strong> Final Buyer pays {formatUSDC(listing.askingPriceUSDC)}. Investors receive pro-rata payout based on tokens held (+{((askingPriceUSD / offeringTargetUSDC - 1) * 100).toFixed(1)}% ROI).
              </p>
              <p className="leading-relaxed">
                <strong>If Expired or Cancelled:</strong> 100% of escrowed USDC is refunded to token holders with zero loss of principal. The Domain NFT returns to seller.
              </p>
            </div>

            {/* User Position Summary if holding tokens */}
            {userTokenBalance > 0n && (
              <div className={`rounded-xl p-4 space-y-2 border ${isDark ? 'bg-cyan-950/30 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
                }`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">Your Position in this Domain</span>
                  <span className="text-xs font-mono font-bold text-cyan-800 dark:text-cyan-400">
                    {formatTokenAmount(userTokenBalance)} Tokens ({((userTokenBalanceNum / totalTokens) * 100).toFixed(2)}%)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 text-slate-700 dark:text-slate-300">
                  <div>Contributed: {formatUSDC(position?.usdcContributed)}</div>
                  <div>Sale Payout Value: <strong className="text-emerald-600 dark:text-emerald-400">{formatUSDC(position?.potentialSalePayoutUSDC)}</strong></div>
                </div>

                {listing.state === ListingStatus.SOLD && salePayoutUSDC > 0n && (
                  <button
                    onClick={() => onClaimSalePayout(listing.listingId)}
                    className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Claim {formatUSDC(salePayoutUSDC)} Sale Proceeds
                  </button>
                )}

                {listing.state === ListingStatus.SOLD && salePayoutUSDC === 0n && (
                  <p role="status" className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                    This balance rounds down to 0 USDC. Hold more tokens in this wallet before claiming; no tokens will be burned.
                  </p>
                )}

                {(listing.state === ListingStatus.CANCELLED || listing.state === ListingStatus.EXPIRED) && refundUSDC > 0n && (
                  <button
                    onClick={() => onClaimRefund(listing.listingId)}
                    className="w-full mt-2 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Claim 100% Refund ({formatUSDC(refundUSDC)})
                  </button>
                )}

                {(listing.state === ListingStatus.CANCELLED || listing.state === ListingStatus.EXPIRED) && refundUSDC === 0n && (
                  <p role="status" className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                    This balance rounds down to 0 USDC. Hold more tokens in this wallet before claiming; no tokens will be burned.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Interactive Trading Terminal */}
          <div className={`lg:col-span-5 p-6 flex flex-col justify-between ${isDark ? 'bg-slate-950/50' : 'bg-slate-50/50'
            }`}>
            <div>
              {/* Tab Selector */}
              <div className={`flex items-center gap-1 p-1 rounded-lg mb-5 text-xs font-medium border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                <button
                  onClick={() => setActiveActionTab('buy')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${activeActionTab === 'buy'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  Buy Tokens
                </button>
                {userTokenBalance > 0n && listing.state === ListingStatus.ACTIVE && (
                  <button
                    onClick={() => setActiveActionTab('redeem')}
                    className={`flex-1 py-1.5 rounded-md transition-colors ${activeActionTab === 'redeem'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    Redeem
                  </button>
                )}
                <button
                  onClick={() => setActiveActionTab('buyout')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${activeActionTab === 'buyout'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  Buyout Domain
                </button>
                {(isSeller || timeInfo.isExpired) && (
                  <button
                    onClick={() => setActiveActionTab('manage')}
                    className={`flex-1 py-1.5 rounded-md transition-colors ${activeActionTab === 'manage'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    Admin
                  </button>
                )}
              </div>

              {/* ACTION: BUY TOKENS */}
              {activeActionTab === 'buy' && (
                <div className="space-y-4">
                  {listing.state !== ListingStatus.ACTIVE ? (
                    <div className={`p-4 rounded-xl text-center text-sm border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                      }`}>
                      This offering is closed ({listing.state === ListingStatus.SOLD ? 'Domain Sold' : 'Closed'}).
                    </div>
                  ) : timeInfo.isExpired ? (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-300 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>Offering Expired</span>
                      </div>
                      <p>This offering has reached its duration. You can trigger on-chain expiration settlement.</p>
                      <button
                        onClick={() => onFinalizeExpired(listing.listingId)}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold transition-colors"
                      >
                        Finalize Expired Listing
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-mono">
                          <span>Amount of Tokens</span>
                          <span>Max: {remainingTokens.toLocaleString()}</span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max={remainingTokens}
                            value={buyAmountInput}
                            onChange={(e) => setBuyAmountInput(e.target.value)}
                            className={`w-full rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-cyan-500 border ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            placeholder="e.g. 100000"
                          />
                          <button
                            onClick={() => setBuyAmountInput(remainingTokens.toString())}
                            className={`absolute right-3 top-3 text-xs font-mono px-2 py-0.5 rounded border ${isDark ? 'text-cyan-400 bg-cyan-950 border-cyan-500/30' : 'text-cyan-700 bg-cyan-50 border-cyan-200 font-medium'
                              }`}
                          >
                            MAX
                          </button>
                        </div>
                      </div>

                      {/* Quick preset chips */}
                      <div className="flex items-center gap-2 text-xs">
                        {[10000, 50000, 100000, 250000].map((amt) => (
                          <button
                            key={amt}
                            onClick={() => setBuyAmountInput(amt.toString())}
                            className={`flex-1 py-1 rounded border font-mono text-[11px] transition-colors ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                          >
                            {amt >= 1000 ? `${amt / 1000}k` : amt}
                          </button>
                        ))}
                      </div>

                      {/* Financial Projection Box */}
                      <div className={`rounded-xl p-4 space-y-2.5 text-xs font-mono border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                        }`}>
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>Required Investment:</span>
                          <span className="font-bold text-slate-900 dark:text-white">${buyCostUSDC.toFixed(4)} USDC</span>
                        </div>
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>Ownership Share:</span>
                          <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{((buyAmountTokens / totalTokens) * 100).toFixed(2)}%</span>
                        </div>
                        <div className={`flex justify-between pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                          <span>Payout on Final Sale:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">${potentialPayout.toFixed(2)} USDC</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Net Potential Profit:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">+${netProfit.toFixed(2)} (+{((netProfit / buyCostUSDC) * 100 || 0).toFixed(1)}%)</span>
                        </div>
                      </div>

                      {hasInsufficientBalanceForBuy && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Insufficient USDC balance ({formatUSDC(usdcBalance)} available, {formatUSDC(exactBuyCostUSDCBigInt)} required).</span>
                        </div>
                      )}

                      {/* Buy Action Button */}
                      <button
                        onClick={handleBuy}
                        disabled={isSubmitting || !account || hasInsufficientBalanceForBuy || buyAmountTokens <= 0 || buyAmountTokens > remainingTokens || buyAmountUnits === 0n}
                        className="w-full py-3.5 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {!account
                          ? 'Connect Wallet to Buy'
                          : hasInsufficientBalanceForBuy
                            ? `Insufficient USDC (${formatUSDC(usdcBalance)})`
                            : needsAllowance
                              ? 'Approve & Buy Tokens'
                              : `Buy ${buyAmountTokens.toLocaleString()} Tokens`}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ACTION: REDEEM */}
              {activeActionTab === 'redeem' && (
                <div className="space-y-4">
                  <div className={`p-3 rounded-xl text-xs space-y-1 border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                    }`}>
                    <div className="font-semibold text-slate-900 dark:text-slate-200">Active Offering Redemption</div>
                    <p>Redeem your tokens back for 100% of your initial USDC cost before listing closes.</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-mono">
                      <span>Amount to Redeem</span>
                      <span>You hold: {userTokenBalanceNum.toLocaleString()}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        max={userTokenBalanceNum}
                        value={redeemAmountInput}
                        onChange={(e) => setRedeemAmountInput(e.target.value)}
                        className={`w-full rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-cyan-500 border ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        placeholder="e.g. 50000"
                      />
                      <button
                        onClick={() => setRedeemAmountInput(userTokenBalanceNum.toString())}
                        className={`absolute right-3 top-3 text-xs font-mono px-2 py-0.5 rounded border ${isDark ? 'text-cyan-400 bg-cyan-950 border-cyan-500/30' : 'text-cyan-700 bg-cyan-50 border-cyan-200'
                          }`}
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  {redeemAmountValid && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Estimated refund: {formatUSDC(estimatedRedeemRefund)}
                    </p>
                  )}
                  {redeemAmountTooSmall && (
                    <p role="status" className="text-xs text-amber-700 dark:text-amber-300">
                      This amount rounds down to 0 USDC. Increase the amount to redeem; no tokens will be burned.
                    </p>
                  )}

                  <button
                    onClick={handleRedeem}
                    disabled={isSubmitting || !redeemAmountValid || estimatedRedeemRefund === 0n}
                    className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    Redeem Tokens for USDC
                  </button>
                </div>
              )}

              {/* ACTION: BUYOUT */}
              {activeActionTab === 'buyout' && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl space-y-2 text-xs border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                    <span className="text-sm font-semibold block text-slate-900 dark:text-white">Complete Domain Buyout</span>
                    <p className="text-slate-500 dark:text-slate-400">
                      Acquire the complete Domain NFT ({listing.domainName}) from escrow by paying the Asking Price.
                    </p>
                    <div className={`pt-2 border-t font-mono flex justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                      <span className="text-slate-500">Total Buyout Price:</span>
                      <strong className="text-slate-900 dark:text-white text-sm">{formatUSDC(listing.askingPriceUSDC)}</strong>
                    </div>
                  </div>

                  {hasInsufficientBalanceForBuyout && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Insufficient USDC balance ({formatUSDC(usdcBalance)} available, {formatUSDC(listing.askingPriceUSDC)} required).</span>
                    </div>
                  )}

                  <button
                    onClick={handleBuyout}
                    disabled={isSubmitting || !account || listing.state !== ListingStatus.ACTIVE || hasInsufficientBalanceForBuyout}
                    className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {!account
                      ? 'Connect Wallet to Buyout'
                      : hasInsufficientBalanceForBuyout
                        ? `Insufficient USDC (${formatUSDC(usdcBalance)})`
                        : `Buyout NFT for ${formatUSDC(listing.askingPriceUSDC)}`}
                  </button>
                </div>
              )}

              {/* ACTION: MANAGE */}
              {activeActionTab === 'manage' && (
                <div className="space-y-4 text-xs">
                  {isSeller && listing.state === ListingStatus.ACTIVE && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-3">
                      <span className="font-bold text-rose-600 dark:text-rose-400 text-sm block">Cancel Listing</span>
                      <p className="text-slate-600 dark:text-slate-400">
                        As the domain seller, you can cancel this listing before sale. The NFT will be returned to your wallet, and investors will be refunded 100%.
                      </p>
                      <button
                        onClick={() => onCancelListing(listing.listingId)}
                        disabled={isSubmitting}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg transition-colors"
                      >
                        Cancel Listing & Retrieve NFT
                      </button>
                    </div>
                  )}

                  {timeInfo.isExpired && listing.state === ListingStatus.ACTIVE && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
                      <span className="font-bold text-amber-600 dark:text-amber-400 text-sm block">Settle Expired Listing</span>
                      <p className="text-slate-600 dark:text-slate-400">
                        This listing has exceeded its duration. Anyone can trigger settlement on-chain to return the NFT to seller and open refund pool for investors.
                      </p>
                      <button
                        onClick={() => onFinalizeExpired(listing.listingId)}
                        disabled={isSubmitting}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors"
                      >
                        Execute Expiry Settlement
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Terminal Footer */}
            <div className={`pt-4 border-t text-[11px] font-mono flex justify-between items-center ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'
              }`}>
              <span>Arbitrum</span>
              <span>Gas-Optimized Smart Escrow</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
