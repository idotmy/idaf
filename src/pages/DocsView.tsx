import React, { useState } from 'react';
import {
  BookOpen,
  ShieldCheck,
  Zap,
  Coins,
  ChevronDown,
  ExternalLink,
  Code2,
  Layers,
  HelpCircle,
  Scale,
  FileCode2,
  Globe,
  Copy,
  Check,
  Menu,
} from 'lucide-react';
import { APP_CONFIG } from '../config/contracts.ts';
import { getExplorerAddressUrl } from '../utils/format.ts';

interface DocsViewProps {
  theme?: 'light' | 'dark';
  onNavigateMarket?: () => void;
  onNavigateList?: () => void;
}

export const DocsView: React.FC<DocsViewProps> = ({
  theme = 'light',
  onNavigateMarket,
  onNavigateList,
}) => {
  const isDark = theme === 'dark';
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const toggleFaq = (index: number) => {
    setExpandedFaq((prev) => (prev === index ? null : index));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(label);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const navItems = [
    { id: 'overview', label: 'Protocol Overview' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'tokenomics', label: 'Tokenomics & Economics' },
    { id: 'architecture', label: 'Architecture & Security' },
    { id: 'faq', label: 'FAQ' },
    { id: 'contracts', label: 'Verified Contracts' },
  ];

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: 'What is IDAF (Instant Domain Asset Fractionalization)?',
      a: 'IDAF is a fully on-chain Web3 protocol on Arbitrum that enables domain NFT holders to fractionalize and tokenize their domain assets into 1,000,000 liquid ERC-20 shares. The original Domain NFT is locked securely inside a trustless smart contract escrow until full buyout or cancellation.',
    },
    {
      q: 'How are investors protected from losses if a domain is not bought out?',
      a: 'If a domain offering is not bought out by the expiration date (or is cancelled by the seller), 100% of the escrowed USDC is immediately unlockable by investors through the claimRefund function. Investors retrieve their exact principal without slippage or liquidation penalties.',
    },
    {
      q: 'Can investors redeem their tokens during an active offering?',
      a: 'Yes. As long as the offering is active and not expired, any token holder can call the redeemTokens function to burn their IDAF tokens and withdraw their initial USDC contribution instantly from the escrow vault.',
    },
    {
      q: 'How does pro-rata payout work when a buyer purchases the domain?',
      a: 'When a buyer pays the full Asking Price in USDC via buyoutDomain, the Domain NFT is transferred to the new owner. The sale proceeds are split on-chain: the seller receives their retained share + escrowed capital, while the investor pool (proportional to tokens sold) is held for investors to claim with guaranteed profit based on the discount tier.',
    },
    {
      q: 'Are the fractional tokens standard ERC-20 tokens?',
      a: 'Yes. Each domain creates a dedicated ERC-20 contract (named "IDAF <domainName>" with symbol "IDAF-<DOMAIN>") adhering to the ERC-20 standard with 18 decimals and a fixed supply of 1,000,000 tokens.',
    },
    {
      q: 'Is there any database dependency in IDAF?',
      a: 'Zero. IDAF is completely decentralized and runs directly on-chain. All listings, bids, balances, and positions are read live from the Arbitrum smart contracts via RPC providers, ensuring complete censorship resistance and permanent availability.',
    },
  ];

  return (
    <div className="max-w-[112rem] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      {/* Hero Header */}
      <div
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-10 border transition-all ${
          isDark
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-slate-800 shadow-xl'
            : 'bg-gradient-to-r from-white via-cyan-50/40 to-blue-50/60 border-slate-200 shadow-sm'
        }`}
      >
        <div className="max-w-4xl space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <BookOpen className="w-3.5 h-3.5" />
            <span>IDAF Protocol Documentation</span>
          </div>
          <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Documentation & Protocol Guide
          </h1>
          <p className={`text-xs sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Explore the architecture, smart contract mechanics, fractional economic models, and security guarantees behind IDAF on Arbitrum.
          </p>
        </div>
      </div>

      {/* Mobile Sticky Navigation Dropdown (Only visible on Mobile < lg) */}
      <div className="lg:hidden sticky top-16 z-30 py-1">
        <div
          className={`rounded-xl border p-2 shadow-lg backdrop-blur-md ${
            isDark ? 'bg-slate-900/95 border-slate-700 text-white' : 'bg-white/95 border-slate-300 text-slate-900'
          }`}
        >
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold"
          >
            <span className="flex items-center gap-2">
              <Menu className="w-4 h-4 text-cyan-400" />
              <span>Section: <strong className="text-cyan-400">{navItems.find((n) => n.id === activeSection)?.label}</strong></span>
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${mobileMenuOpen ? 'rotate-180 text-cyan-400' : ''}`} />
          </button>

          {mobileMenuOpen && (
            <div className={`mt-2 pt-2 border-t space-y-1 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeSection === item.id
                      ? isDark
                        ? 'bg-cyan-950 text-cyan-300 font-bold'
                        : 'bg-cyan-50 text-cyan-800 font-bold'
                      : isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Desktop Sticky Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Desktop Sidebar Navigation (Hidden on mobile) */}
        <div className="hidden lg:block lg:col-span-3 lg:sticky lg:top-20 space-y-3">
          <div
            className={`p-3 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className={`px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Table of Contents
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeSection === item.id
                      ? isDark
                        ? 'bg-cyan-950/70 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'bg-cyan-50 text-cyan-800 font-bold border border-cyan-200'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Quick Action Box */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <span className="text-xs font-bold block">Ready to explore?</span>
            <div className="flex flex-col gap-2">
              <button
                onClick={onNavigateMarket}
                className="w-full py-2 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors text-center cursor-pointer"
              >
                Browse Marketplace
              </button>
              <button
                onClick={onNavigateList}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-colors border text-center cursor-pointer ${
                  isDark ? 'border-slate-700 hover:bg-slate-800 text-white' : 'border-slate-300 hover:bg-white text-slate-900'
                }`}
              >
                Tokenize a Domain
              </button>
            </div>
          </div>
        </div>

        {/* Content Body (9 Columns on Desktop, Full Width on Mobile) */}
        <div className="lg:col-span-9 space-y-10 w-full overflow-hidden">
          {/* SECTION 1: PROTOCOL OVERVIEW */}
          <section id="overview" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <h2 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                1. Protocol Overview
              </h2>
            </div>

            <div className={`p-4 sm:p-6 rounded-2xl border space-y-4 leading-relaxed text-xs sm:text-sm ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
              <p>
                <strong>IDAF (Instant Domain Asset Fractionalization)</strong> is an Arbitrum-native Web3 marketplace and escrow protocol. It bridges the liquidity gap for high-value Web3 domain names (such as <strong>.i</strong> domains and ENS assets) by enabling trustless fractional ownership, capital formation, and pro-rata exit liquidity.
              </p>
              <p>
                Traditional domain sales require a single wealthy buyer to purchase the domain in full, which causes prolonged illiquidity for domain owners. IDAF allows domain sellers to offer a curated discount to a pool of fractional investors in exchange for immediate liquidity, while maintaining smart contract-enforced settlement when the domain is bought out.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <ShieldCheck className="w-5 h-5 text-emerald-400 mb-1.5" />
                  <div className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>100% Escrow Backed</div>
                  <div className="text-[11px] text-slate-400 mt-1">Domain NFTs are locked in smart contract escrow with no custodial third party.</div>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <Coins className="w-5 h-5 text-cyan-400 mb-1.5" />
                  <div className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>Pro-Rata Settlement</div>
                  <div className="text-[11px] text-slate-400 mt-1">Automatic mathematical distribution of buyout proceeds to token holders.</div>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <Zap className="w-5 h-5 text-amber-400 mb-1.5" />
                  <div className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>Zero Database Risk</div>
                  <div className="text-[11px] text-slate-400 mt-1">100% on-chain state queries directly on Arbitrum One via RPC nodes.</div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: HOW IT WORKS */}
          <section id="how-it-works" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                2. How It Works: Step-by-Step Lifecycle
              </h2>
            </div>

            <div className={`p-4 sm:p-6 rounded-2xl border space-y-5 text-xs sm:text-sm ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
              {/* Step 1 */}
              <div className="flex gap-3.5">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                  1
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className={`font-bold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Listing & Escrow Deposit</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The domain owner selects an owned .i NFT, chooses a full buyout Asking Price (e.g. $1,000 USDC), a discount tier (e.g. 20% OFF), and a duration (e.g. 30 days). The NFT is deposited into the <code>IDAFMarket</code> smart contract.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3.5">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                  2
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className={`font-bold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Dedicated ERC-20 Token Deployment</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The contract deploys a dedicated <code>IDAFToken</code> contract for the listing with exactly <strong>1,000,000 tokens</strong> (symbol: <code>IDAF-&lt;DOMAIN&gt;</code>). The total offering value is set at <code>Asking Price × (100% - Discount)</code> (e.g. $800 USDC for $1,000 asking price).
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3.5">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                  3
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className={`font-bold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Investor Participation & Redemption Rights</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Investors purchase tokens with USDC at the discounted price. During the active offering period, any investor can redeem their tokens back for 100% of their contributed USDC if they change their mind before the offering closes.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3.5">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                  4
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className={`font-bold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Domain Buyout & Automatic Settlement</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    A final buyer acquires the full Domain NFT by paying the Asking Price ($1,000 USDC). The contract instantly transfers the NFT to the buyer, pays the seller their proceeds, and locks the investor payout pool. Token holders then call <code>claimSalePayout</code> to burn their tokens and claim their profit.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-3.5">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                  5
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className={`font-bold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>100% Refund Guarantee on Expiry</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    If no buyer executes a full buyout before the expiration timestamp, the listing can be settled. The NFT returns to the seller, and all token holders claim 100% of their contributed USDC with zero loss of principal.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: TOKENOMICS & ECONOMICS */}
          <section id="tokenomics" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <h2 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                3. Tokenomics & Curated Discount Tiers
              </h2>
            </div>

            <div className={`p-4 sm:p-6 rounded-2xl border space-y-5 text-xs sm:text-sm ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
              <div className="space-y-2">
                <h3 className={`font-bold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Mathematical Equations</h3>
                <div className={`p-3.5 rounded-xl font-mono text-[11px] sm:text-xs space-y-1.5 border overflow-x-auto ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div><strong>Total Supply:</strong> 1,000,000 Tokens (18 Decimals)</div>
                  <div><strong>Offering Valuation:</strong> AskingPrice × (10,000 - DiscountBps) / 10,000</div>
                  <div><strong>Token Unit Price:</strong> OfferingValuation / 1,000,000</div>
                  <div><strong>Investor Sale Payout:</strong> (TokensHeld × AskingPrice) / 1,000,000</div>
                </div>
              </div>

              {/* Discount Tiers: Responsive Cards on Mobile & Table on Larger Screens */}
              <div className="space-y-2.5">
                <h3 className={`font-bold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>On-Chain Enforced Discount Tiers</h3>

                {/* Mobile View: Clean Card Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:hidden">
                  {APP_CONFIG.allowedDiscounts.map((tier) => (
                    <div
                      key={tier.value}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className={`font-bold font-mono text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{tier.label}</div>
                        <div className="text-[10px] font-mono text-slate-400">{tier.value} BPS</div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-xs text-cyan-400 font-bold">{tier.percentage}% OFF</div>
                        <div className="text-[11px] text-emerald-400 font-semibold">+{tier.investorRoi.toFixed(1)}% ROI</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View: Full Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className={`w-full text-left text-xs font-mono border rounded-xl overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <thead className={isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-700'}>
                      <tr>
                        <th className="p-3">Tier</th>
                        <th className="p-3">Discount BPS</th>
                        <th className="p-3">Investor Discount</th>
                        <th className="p-3">Investor Profit / ROI</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                      {APP_CONFIG.allowedDiscounts.map((tier) => (
                        <tr key={tier.value} className={isDark ? 'hover:bg-slate-950/40' : 'hover:bg-slate-50'}>
                          <td className="p-3 font-bold">{tier.label}</td>
                          <td className="p-3">{tier.value} BPS</td>
                          <td className="p-3 text-cyan-400 font-bold">{tier.percentage}% OFF</td>
                          <td className="p-3 text-emerald-400 font-bold">+{tier.investorRoi.toFixed(1)}% ROI</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: ARCHITECTURE & SECURITY */}
          <section id="architecture" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Code2 className="w-4 h-4" />
              </div>
              <h2 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                4. Architecture & Security Standards
              </h2>
            </div>

            <div className={`p-4 sm:p-6 rounded-2xl border space-y-4 text-xs sm:text-sm ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className={`p-3.5 rounded-xl border space-y-1.5 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>Reentrancy Protection</h4>
                  <p className="text-xs text-slate-400">
                    All state-changing functions adhere strictly to the <strong>Checks-Effects-Interactions</strong> pattern and are protected with <code>nonReentrant</code> execution guards.
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border space-y-1.5 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>Immutable Mint Access</h4>
                  <p className="text-xs text-slate-400">
                    Token minting and burning can ONLY be triggered by the immutable marketplace contract. No third-party or owner can inflate token supply.
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border space-y-1.5 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>Burn-on-Claim Settlement</h4>
                  <p className="text-xs text-slate-400">
                    Tokens are permanently burned upon payout or refund withdrawal, preventing double-spend attacks and ensuring zero discrepancy in remaining balances.
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border space-y-1.5 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>Direct Layer-2 Finality</h4>
                  <p className="text-xs text-slate-400">
                    Settlements execute on Arbitrum One with sub-second finality and negligible gas costs, making fractional trades frictionless.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: FAQ */}
          <section id="faq" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h2 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                5. Frequently Asked Questions (FAQ)
              </h2>
            </div>

            <div className="space-y-2.5">
              {faqs.map((faq, index) => {
                const isOpen = expandedFaq === index;
                return (
                  <div
                    key={index}
                    className={`rounded-xl border transition-all overflow-hidden ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className={`w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                        isDark ? 'text-white hover:text-cyan-400' : 'text-slate-900 hover:text-cyan-600'
                      }`}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-cyan-400' : 'text-slate-400'
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className={`px-3.5 sm:px-4 pb-3.5 pt-1 text-xs leading-relaxed border-t ${isDark ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'}`}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 6: VERIFIED CONTRACTS */}
          <section id="contracts" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <FileCode2 className="w-4 h-4" />
              </div>
              <h2 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                6. Verified Contract Addresses (Arbitrum One)
              </h2>
            </div>

            <div className={`p-4 sm:p-6 rounded-2xl border space-y-3.5 text-xs font-mono ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              {/* Marketplace Contract */}
              <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Marketplace Escrow Core</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(APP_CONFIG.contracts.marketplace.address, 'marketplace')}
                      className={`p-1.5 rounded-md border text-[10px] flex items-center gap-1 transition-colors cursor-pointer ${
                        copiedAddress === 'marketplace'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : isDark
                          ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                      title="Copy Address"
                    >
                      {copiedAddress === 'marketplace' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedAddress === 'marketplace' ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href={getExplorerAddressUrl(APP_CONFIG.contracts.marketplace.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>Arbiscan</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className={`font-bold break-all text-[11px] sm:text-xs select-all ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {APP_CONFIG.contracts.marketplace.address}
                </div>
              </div>

              {/* Domain NFT Contract */}
              <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Domain NFT Contract</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(APP_CONFIG.contracts.domainNft.address, 'domainNft')}
                      className={`p-1.5 rounded-md border text-[10px] flex items-center gap-1 transition-colors cursor-pointer ${
                        copiedAddress === 'domainNft'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : isDark
                          ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                      title="Copy Address"
                    >
                      {copiedAddress === 'domainNft' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedAddress === 'domainNft' ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href={getExplorerAddressUrl(APP_CONFIG.contracts.domainNft.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>Arbiscan</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className={`font-bold break-all text-[11px] sm:text-xs select-all ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {APP_CONFIG.contracts.domainNft.address}
                </div>
              </div>

              {/* USDC Contract */}
              <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">USDC Settlement Token</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(APP_CONFIG.contracts.usdc.address, 'usdc')}
                      className={`p-1.5 rounded-md border text-[10px] flex items-center gap-1 transition-colors cursor-pointer ${
                        copiedAddress === 'usdc'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : isDark
                          ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                      title="Copy Address"
                    >
                      {copiedAddress === 'usdc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedAddress === 'usdc' ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href={getExplorerAddressUrl(APP_CONFIG.contracts.usdc.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>Arbiscan</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className={`font-bold break-all text-[11px] sm:text-xs select-all ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {APP_CONFIG.contracts.usdc.address}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
