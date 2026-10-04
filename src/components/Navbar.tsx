import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Sun, Moon, LayoutGrid, PlusCircle, PieChart, BookOpen, ChevronDown, Wallet } from 'lucide-react';
import { formatUSDC } from '../utils/format.ts';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  usdcBalance: bigint;
  isConnected: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  usdcBalance,
  isConnected,
  theme,
  onToggleTheme,
}) => {
  const isDark = theme === 'dark';

  const navItems = [
    { id: 'explore', label: 'Market', icon: LayoutGrid },
    { id: 'list', label: 'List', icon: PlusCircle },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'docs', label: 'Docs', icon: BookOpen },
  ];

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${isDark
      ? 'border-slate-800/80 bg-slate-950/85 text-slate-100'
      : 'border-slate-200/90 bg-white/90 text-slate-900 shadow-xs'
      }`}>
      <div className="max-w-[112rem] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: IDAF Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('explore')}
            className={`text-lg font-bold tracking-tight transition-colors flex items-center gap-2 cursor-pointer ${isDark ? 'text-white hover:text-cyan-400' : 'text-slate-900 hover:text-cyan-600'
              }`}
          >
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent font-black text-xl tracking-tight">
              IDAF
            </span>
          </button>
          <span className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full ${isDark
            ? 'text-cyan-400/90 border border-cyan-500/20 bg-cyan-950/40'
            : 'text-cyan-700 border border-cyan-200 bg-cyan-50 font-semibold'
            }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Arbitrum
          </span>
        </div>

        {/* Zone 2: Modern Spacious Navigation Links */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                  isActive
                    ? isDark
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10 font-bold'
                      : 'bg-cyan-50 text-cyan-800 border border-cyan-300/80 shadow-xs font-bold'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent hover:border-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? (isDark ? 'text-cyan-400' : 'text-cyan-600') : 'opacity-70'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Wallet Actions & Theme Switcher */}
        <div className="flex items-center gap-2.5">
          {isConnected && (
            <div className={`hidden sm:flex items-center text-xs font-mono px-3 py-1.5 rounded-xl border ${isDark
              ? 'bg-slate-900 border-slate-800 text-slate-300'
              : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
              <span className="mr-1.5 opacity-70">USDC:</span>
              <span className={`font-semibold tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {formatUSDC(usdcBalance)}
              </span>
            </div>
          )}

          {/* Custom Sleek RainbowKit Connect Button */}
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== 'loading';
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus || authenticationStatus === 'authenticated');

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    style: {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Connect</span>
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white transition-all cursor-pointer shadow-xs"
                        >
                          Wrong Network
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={openAccountModal}
                          type="button"
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer ${
                            isDark
                              ? 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-850'
                              : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300 shadow-xs'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          <span className={`text-[11px] sm:text-xs tracking-tight font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {account.displayName}
                          </span>
                          <ChevronDown className="w-3 h-3 opacity-60 ml-0.5 shrink-0" />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>

          {/* Theme Switcher Toggle Button */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme mode"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${isDark
              ? 'border-slate-800 bg-slate-900/80 text-amber-400 hover:bg-slate-800 hover:text-amber-300 shadow-xs'
              : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-xs'
              }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className={`flex md:hidden items-center justify-around border-t p-1.5 text-xs font-medium ${
        isDark ? 'border-slate-800/80 bg-slate-950/95 text-slate-400' : 'border-slate-200 bg-white/95 text-slate-600'
      }`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-all ${
                isActive
                  ? isDark
                    ? 'bg-cyan-950/60 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'bg-cyan-50 text-cyan-800 font-bold border border-cyan-200'
                  : isDark
                  ? 'hover:text-white'
                  : 'hover:text-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 mb-0.5 ${isActive ? (isDark ? 'text-cyan-400' : 'text-cyan-600') : 'opacity-60'}`} />
              <span className="text-[11px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
