import React, { useState } from 'react';
import { Settings, RefreshCw, UserPlus, PlusCircle, Sparkles, HelpCircle } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface SandboxProps {
  lang: Language;
  onAddBalance: () => void;
  onSimulateDownline: () => void;
  onResetDatabase: () => void;
  currentBalance: number;
}

export const Sandbox: React.FC<SandboxProps> = ({
  lang,
  onAddBalance,
  onSimulateDownline,
  onResetDatabase,
  currentBalance
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = translations[lang];

  return (
    <div
      id="sandbox-simulator-panel"
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end"
    >
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 p-3.5 text-slate-950 font-bold font-display shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="Open Sandbox Controls"
      >
        <Settings className={`h-5 w-5 ${isOpen ? 'animate-spin' : ''}`} />
        <span className="text-sm font-semibold pr-1">Sandbox Ctrl</span>
      </button>

      {/* Expanded Control Box */}
      {isOpen && (
        <div className="mt-3 w-80 rounded-2xl border border-amber-500/30 bg-slate-900/95 p-5 shadow-[0_10px_35px_rgba(0,0,0,0.5)] backdrop-blur-md text-white animate-in slide-in-from-bottom-5 fade-in-50 duration-200">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
            <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
            <h4 className="font-display font-bold text-white text-sm">{t.sandboxTitle}</h4>
          </div>
          
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            {t.sandboxDesc}
          </p>

          <div className="flex flex-col gap-2.5">
            {/* Wallet Balance Display */}
            <div className="flex items-center justify-between rounded-xl bg-slate-950/60 px-3.5 py-2 border border-slate-800 text-xs">
              <span className="text-slate-400">Simulated Wallet Balance:</span>
              <span className="font-mono font-bold text-amber-400">{currentBalance} USDT</span>
            </div>

            {/* Add Balance button */}
            <button
              onClick={onAddBalance}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-500/20 py-2.5 px-3 text-xs font-semibold text-white transition-all active:scale-98 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4 text-amber-400" />
              <span>{t.sandboxAddBalance}</span>
            </button>

            {/* Simulate Referral Button */}
            <button
              onClick={onSimulateDownline}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-500/20 py-2.5 px-3 text-xs font-semibold text-white transition-all active:scale-98 cursor-pointer"
            >
              <UserPlus className="h-4 w-4 text-amber-400" />
              <span>{t.sandboxAddDownline}</span>
            </button>

            {/* Reset DB Button */}
            <button
              onClick={onResetDatabase}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/30 hover:border-rose-500/50 py-2.5 px-3 text-xs font-semibold text-rose-300 transition-all active:scale-98 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4 text-rose-400" />
              <span>Reset Simulator Database</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 mt-4 text-[10px] text-slate-500">
            <HelpCircle className="h-3 w-3" />
            <span>Simulate referrals to see active matrices populate & pay commissions!</span>
          </div>
        </div>
      )}
    </div>
  );
};
