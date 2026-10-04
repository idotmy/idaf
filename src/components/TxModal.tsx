import React from 'react';
import { ExternalLink, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { TxStatus } from '../types/domain.ts';
import { getExplorerTxUrl } from '../utils/format.ts';
import { APP_CONFIG } from '../config/contracts.ts';

interface TxModalProps {
  status: TxStatus;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const TxModal: React.FC<TxModalProps> = ({ status, onClose, theme = 'light' }) => {
  if (status.state === 'idle') return null;
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl relative border transition-colors ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg border transition-colors ${isDark ? 'border-slate-800 text-slate-400 hover:text-white bg-slate-800/60' : 'border-slate-200 text-slate-500 hover:text-slate-900 bg-slate-100'
            }`}
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center pt-2">
          {/* Status Icons */}
          {status.state === 'waiting-wallet' && (
            <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 text-cyan-500 animate-pulse">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
          )}

          {status.state === 'pending' && (
            <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 text-cyan-500 animate-spin">
              <Loader2 className="w-7 h-7" />
            </div>
          )}

          {status.state === 'success' && (
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-500">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          )}

          {status.state === 'error' && (
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-500">
              <AlertCircle className="w-8 h-8" />
            </div>
          )}

          {/* Title */}
          <h3 className="text-lg font-bold mb-2">
            {status.title || 'Transaction'}
          </h3>

          {/* Status Message */}
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
            {status.state === 'waiting-wallet' && 'Please confirm the transaction in your Web3 wallet.'}
            {status.state === 'pending' && 'Broadcasting transaction on Arbitrum...'}
            {status.state === 'success' && 'Transaction successfully confirmed on-chain!'}
            {status.state === 'error' && (status.errorMessage || 'Transaction could not be completed.')}
          </p>

          {/* Metadata details */}
          <div className={`w-full rounded-xl p-3.5 text-xs space-y-2 mb-5 text-left font-mono border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
            <div className="flex justify-between text-slate-500">
              <span>Network:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{APP_CONFIG.networkName}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Chain ID:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{APP_CONFIG.chainId}</span>
            </div>
            {status.txHash && (
              <div className={`flex justify-between pt-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <span className="text-slate-500">Tx Hash:</span>
                <a
                  href={getExplorerTxUrl(status.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  View on Arbiscan <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Action button */}
          <button
            onClick={onClose}
            className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
          >
            {status.state === 'pending' || status.state === 'waiting-wallet' ? 'Dismiss Window' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
