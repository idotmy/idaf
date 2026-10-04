import React, { useState, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, lightTheme, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from './config/chains.ts';
import { useOnchainMarketplace } from './hooks/useOnchainMarketplace.ts';
import { Navbar } from './components/Navbar.tsx';
import { TxModal } from './components/TxModal.tsx';
import { DomainDetailModal } from './components/DomainDetailModal.tsx';
import { MarketplaceView } from './pages/MarketplaceView.tsx';
import { CreateListingView } from './pages/CreateListingView.tsx';
import { PortfolioView } from './pages/PortfolioView.tsx';
import { DocsView } from './pages/DocsView.tsx';
import { DomainListing } from './types/domain.ts';
import { Globe, Twitter, Linkedin, Github } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function MarketplaceApp({
  theme,
  onToggleTheme,
}: {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}) {
  const [activeTab, setActiveTab] = useState<string>('explore');
  const [selectedListing, setSelectedListing] = useState<DomainListing | null>(null);

  const isDark = theme === 'dark';

  // Always scroll to top when changing page tabs
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  const {
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
    account,
  } = useOnchainMarketplace();

  // If a selected listing exists, update its reference if list changes
  const currentSelectedListing = selectedListing
    ? listings.find((l) => l.listingId === selectedListing.listingId) || selectedListing
    : null;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${isDark
      ? 'bg-[#030712] text-slate-100 selection:bg-cyan-500 selection:text-black'
      : 'bg-slate-50 text-slate-900 selection:bg-cyan-200 selection:text-slate-900'
      }`}>
      {/* Top Bar with Pure RainbowKit Connect Button */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        usdcBalance={usdcBalance}
        isConnected={isConnected}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'explore' && (
          <MarketplaceView
            listings={listings}
            isLoading={isLoading}
            onSelectListing={(listing) => setSelectedListing(listing)}
            onNavigateCreate={() => setActiveTab('list')}
            onRefresh={refreshData}
            theme={theme}
          />
        )}

        {activeTab === 'list' && (
          <CreateListingView
            account={account}
            isConnected={isConnected}
            userOwnedDomains={userOwnedDomains}
            isScanningDomains={isScanningDomains}
            onCreateListing={createListing}
            onApproveNFT={approveNFT}
            checkDomainAvailability={checkDomainAvailability}
            onRefresh={refreshData}
            onNavigateMarketplace={() => setActiveTab('explore')}
            theme={theme}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioView
            account={account}
            isConnected={isConnected}
            listings={listings}
            userPositions={userPositions}
            onSelectListing={(listing) => setSelectedListing(listing)}
            onClaimSalePayout={claimSalePayout}
            onClaimRefund={claimRefund}
            onCancelListing={cancelListing}
            onRefresh={refreshData}
            isLoading={isLoading}
            theme={theme}
          />
        )}

        {activeTab === 'docs' && (
          <DocsView
            theme={theme}
            onNavigateMarket={() => setActiveTab('explore')}
            onNavigateList={() => setActiveTab('list')}
          />
        )}
      </main>

      {/* Trading Terminal / Domain Detail Modal */}
      {currentSelectedListing && (
        <DomainDetailModal
          listing={currentSelectedListing}
          position={userPositions[currentSelectedListing.listingId]}
          account={account}
          usdcBalance={usdcBalance}
          usdcAllowance={usdcAllowance}
          onClose={() => setSelectedListing(null)}
          onApproveUSDC={approveUSDC}
          onBuyTokens={buyTokens}
          onRedeemTokens={redeemTokens}
          onBuyoutDomain={buyoutDomain}
          onCancelListing={cancelListing}
          onFinalizeExpired={finalizeExpiredListing}
          onClaimSalePayout={claimSalePayout}
          onClaimRefund={claimRefund}
          theme={theme}
        />
      )}

      {/* Transaction Broadcast Modal */}
      <TxModal
        status={txStatus}
        onClose={() => setTxStatus({ state: 'idle' })}
        theme={theme}
      />


      {/* Footer */}
      <footer className={`shrink-0 py-5 px-3 sm:px-6 lg:px-8 text-xs border-t transition-colors z-10 ${
        isDark ? 'border-slate-800 bg-[#030712] text-slate-400' : 'border-slate-200 bg-white text-slate-600'
      }`}>
        <div className="max-w-[112rem] mx-auto">
          {/* Main Footer Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* 1. Brand & Copyright: Left */}
            <div className="order-2 sm:order-1 flex items-center gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-cyan-500 text-slate-950 font-mono font-bold text-xs shadow-xs">
                .i
              </span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                <strong className={`font-bold tracking-tight mr-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>IDAF</strong>
                © {new Date().getFullYear()}
              </span>
              <a
                href="https://doti.my/"
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-1.5 text-xs transition-colors border-l pl-2.5 ml-1 ${
                  isDark ? 'border-slate-800 text-slate-400 hover:text-cyan-400' : 'border-slate-200 text-slate-500 hover:text-cyan-600'
                }`}
              >
                <span className="opacity-70">Powered by</span>
                <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>Doti</span>
              </a>
            </div>

            {/* 2. Social Icons: Right */}
            <div className="order-1 sm:order-2 flex items-center gap-2">
              <a
                href="https://doti.my"
                target="_blank"
                rel="noreferrer"
                aria-label="Web"
                className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                  isDark
                    ? 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-cyan-400 hover:border-slate-700 hover:bg-slate-800'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-cyan-600 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://x.com/idotmy"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter / X"
                className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                  isDark
                    ? 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-cyan-400 hover:border-slate-700 hover:bg-slate-800'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-cyan-600 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Twitter className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://www.linkedin.com/company/idotmy/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                  isDark
                    ? 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-cyan-400 hover:border-slate-700 hover:bg-slate-800'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-cyan-600 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Linkedin className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://github.com/idotmy/"
                target="_blank"
                rel="noreferrer"
                aria-label="Github"
                className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                  isDark
                    ? 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-cyan-400 hover:border-slate-700 hover:bg-slate-800'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-cyan-600 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Github className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ThemeAwareApp() {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('domainfraction_theme');
      return (saved === 'dark' || saved === 'light') ? saved : 'light';
    }
    return 'light';
  });

  const toggleTheme = () => {
    setCurrentTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('domainfraction_theme', next);
      return next;
    });
  };

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('domainfraction_theme');
      if (saved === 'dark' || saved === 'light') {
        setCurrentTheme(saved);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isDark = currentTheme === 'dark';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [currentTheme]);

  return (
    <RainbowKitProvider
      modalSize="compact"
      theme={
        isDark
          ? darkTheme({
            accentColor: '#06b6d4',
            accentColorForeground: '#030712',
            borderRadius: 'medium',
            fontStack: 'system',
          })
          : lightTheme({
            accentColor: '#0891b2',
            accentColorForeground: '#ffffff',
            borderRadius: 'medium',
            fontStack: 'system',
          })
      }
    >
      <MarketplaceApp theme={currentTheme} onToggleTheme={toggleTheme} />
    </RainbowKitProvider>
  );
}

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeAwareApp />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
