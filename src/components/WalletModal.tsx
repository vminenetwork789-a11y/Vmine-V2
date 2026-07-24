import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet, X, Smartphone, Globe, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { isWeb3Installed } from '../lib/web3';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletType: string, customAddress?: string) => void;
  title: string;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onConnect, title }) => {
  const [hasWeb3, setHasWeb3] = useState<boolean>(false);
  const [customAddress, setCustomAddress] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setHasWeb3(isWeb3Installed());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const walletOptions = [
    {
      name: 'MetaMask',
      isWeb3Native: true,
      icon: (
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
          <Globe className="h-6 w-6 text-orange-500" />
        </div>
      ),
      description: hasWeb3 ? 'Detected In-Browser Web3 Extension' : 'Desktop browser extension & mobile app'
    },
    {
      name: 'Trust Wallet',
      isWeb3Native: true,
      icon: (
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
          <ShieldCheck className="h-6 w-6 text-blue-500" />
        </div>
      ),
      description: 'The premier secure mobile multi-chain wallet'
    },
    {
      name: 'TokenPocket (TP)',
      isWeb3Native: true,
      icon: (
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Smartphone className="h-6 w-6 text-emerald-500" />
        </div>
      ),
      description: 'Popular decentralized multi-network wallet'
    },
    {
      name: 'WalletConnect',
      isWeb3Native: false,
      icon: (
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20">
          <Wallet className="h-6 w-6 text-sky-500" />
        </div>
      ),
      description: 'Connect with any supported mobile wallet'
    }
  ];

  const handleManualConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAddress.trim()) return;
    onConnect('Manual / Custom Address', customAddress.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/30 bg-slate-900 shadow-[0_0_50px_rgba(245,158,11,0.15)]"
      >
        {/* Glow accent */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-amber-500" />
            <h3 className="font-display text-lg font-bold text-white">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Browser Extension Detection Banner */}
        <div className="px-5 pt-4 pb-1">
          {hasWeb3 ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>ตรวจพบ Web3 Wallet ในเบราว์เซอร์ของคุณแล้ว (พร้อมเชื่อมต่อจริง)</span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>ไม่พบ Extension (สามารถใช้โหมดจำลอง/ระบุ Address)</span>
              </div>
            </div>
          )}
        </div>

        {/* Wallet List */}
        <div className="p-5 flex flex-col gap-3">
          {walletOptions.map((opt) => (
            <button
              key={opt.name}
              onClick={() => onConnect(opt.name)}
              className="flex w-full items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-3.5 text-left hover:border-amber-500/50 hover:bg-slate-800/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all group cursor-pointer"
            >
              {opt.icon}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-white group-hover:text-amber-400 transition-colors">
                    {opt.name}
                  </span>
                  {hasWeb3 && opt.isWeb3Native && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Live Web3
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{opt.description}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </button>
          ))}

          {/* Manual Address Input Option */}
          <div className="mt-1 pt-3 border-t border-slate-800">
            {!showManualInput ? (
              <button
                type="button"
                onClick={() => setShowManualInput(true)}
                className="w-full text-center text-xs text-amber-400/90 hover:text-amber-300 hover:underline py-1"
              >
                + หรือระบุ Wallet Address ด้วยตนเอง
              </button>
            ) : (
              <form onSubmit={handleManualConnect} className="flex flex-col gap-2">
                <label className="text-xs text-slate-300 font-medium">กรอก Wallet Address (0x...):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    placeholder="0x1234...5678"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                  >
                    เชื่อมต่อ
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Note info */}
        <div className="bg-slate-950/80 p-4 text-center text-[11px] text-slate-500 border-t border-slate-800">
          By connecting your wallet, you agree to our Terms of Service and Decentralized Matrix Protocols.
        </div>
      </motion.div>
    </div>
  );
};
