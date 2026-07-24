import React from 'react';
import { motion } from 'motion/react';
import { Lock, HelpCircle } from 'lucide-react';

interface MatrixPlanProps {
  id: string; // '1', '2', ..., '12'
  name: string; // 'Rank 1', 'Rank 2', etc.
  cost: number;
  active: boolean;
  buyable: boolean;
  matrix: boolean[]; // 4 elements
  rebornSlots?: boolean[]; // 4 elements indicating if slot was filled by a Reborn ID
  onBuy: () => void;
  lang: string;
}

export const MatrixPlan: React.FC<MatrixPlanProps> = ({
  id,
  cost,
  active,
  buyable,
  matrix = [false, false, false, false],
  rebornSlots = [false, false, false, false],
  onBuy,
  lang
}) => {
  const formattedCost = cost.toLocaleString();
  const nextId = (Number(id) + 1).toString();
  const nextCost = (cost * 2).toLocaleString();
  const halfCost = (cost / 2).toLocaleString();
  const rebornCount = Math.pow(2, Number(id) - 1);

  // Helper to get translated labels
  const getLabel = (key: string) => {
    const labels: Record<string, Record<string, string>> = {
      reborn: {
        TH: 'Reborn TO Rank 1',
        EN: 'Reborn TO Rank 1',
      },
      rebornDesc: {
        TH: `${rebornCount} ID`,
        EN: `${rebornCount} ID`,
      },
      autoUp: {
        TH: 'AUTO UP',
        EN: 'AUTO UP',
      },
      autoUpRank: {
        TH: `Rank ${nextId}`,
        EN: `Rank ${nextId}`,
      },
      earned: {
        TH: `รับ ${halfCost}+${halfCost} = ${cost}$`,
        EN: `Get ${halfCost}+${halfCost} = ${cost}$`,
      },
      locked: {
        TH: 'ล็อกอยู่',
        EN: 'Locked',
      },
      unlock: {
        TH: 'ปลดล็อก',
        EN: 'Unlock',
      }
    };
    return labels[key]?.[lang] || labels[key]?.['EN'] || '';
  };

  const filledCount = active ? matrix.filter(Boolean).length : 0;
  const activeRebornCount = active ? rebornSlots.filter((r, idx) => matrix[idx] && r).length : 0;

  return (
    <div
      id={`plan-card-${id}`}
      className={`relative rounded-3xl border-2 p-2.5 sm:p-3.5 overflow-hidden transition-all duration-500 select-none ${
        active
          ? 'border-indigo-500/40 bg-gradient-to-b from-slate-950 via-[#0b0e22] to-slate-950 shadow-[0_0_30px_rgba(99,102,241,0.2)]'
          : 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700/80'
      }`}
    >
      {/* Background Subtle Tech Grid Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-20 pointer-events-none" />

      {/* Main Container - Side-by-Side Flex Layout (Rank badge on left, tree diagram on right) */}
      <div className="flex flex-row items-stretch gap-2 sm:gap-3 relative z-10 min-h-[195px]">
        
        {/* LEFT COLUMN: Small Compact Rank Badge */}
        <div className="flex flex-col justify-center items-center shrink-0 my-auto">
          <div
            className={`py-2 px-2.5 rounded-xl flex flex-col items-center justify-center text-center shadow-md border transform hover:scale-105 transition-all duration-300 ${
              id === '1'
                ? 'bg-gradient-to-b from-[#f5bf00] via-[#e5a900] to-[#b88000] border-[#ffe885] text-slate-950 font-black shadow-[0_2px_8px_rgba(229,169,0,0.3)]'
                : 'bg-gradient-to-b from-[#009b2e] via-[#008024] to-[#005a18] border-[#00e043] text-white font-black shadow-[0_2px_8px_rgba(0,128,36,0.3)]'
            }`}
          >
            <span className="text-[8.5px] sm:text-[9px] uppercase tracking-wider font-extrabold leading-none">
              Rank {id}
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-mono font-black mt-1 drop-shadow-sm leading-none whitespace-nowrap">
              {formattedCost} USDT
            </span>
          </div>

          {/* Small Level Indicator */}
          <span className="text-[7.5px] font-mono text-slate-500 mt-1 font-bold">
            LVL {id}
          </span>
        </div>

        {/* RIGHT COLUMN: The Interactive Tree Diagram */}
        <div className="flex-1 relative flex flex-col justify-between min-w-0 overflow-hidden">
          
          {/* Dynamic SVG Connection Lines & Brackets & Arrows */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <marker id={`arrow-${id}`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
              </marker>
              <marker id={`down-arrow-${id}`} viewBox="0 0 10 10" refX="5" refY="6" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 1 0 L 5 10 L 9 0 z" fill="#eab308" />
              </marker>
            </defs>

            {/* Direct Connection Lines from YOU to slots 1, 2, 3, 4 */}
            <line x1="50%" y1="20" x2="18%" y2="58" stroke="#c084fc" strokeWidth="1.5" />
            <line x1="50%" y1="20" x2="39%" y2="58" stroke="#c084fc" strokeWidth="1.5" />
            <line x1="50%" y1="20" x2="61%" y2="58" stroke="#c084fc" strokeWidth="1.5" />
            <line x1="50%" y1="20" x2="82%" y2="58" stroke="#c084fc" strokeWidth="1.5" />

            {/* Red bracket line under Slots 1 & 2 */}
            <path d="M 18% 78 L 18% 86 L 39% 86 L 39% 78 M 28.5% 86 L 28.5% 96" stroke="#f43f5e" strokeWidth="1.5" fill="none" />
            
            {/* Orange bracket line under Slots 3 & 4 */}
            <path d="M 61% 78 L 61% 86 L 82% 86 L 82% 78 M 71.5% 86 L 71.5% 96" stroke="#f97316" strokeWidth="1.5" fill="none" />

            {/* Blue Arrow pointing from Reborn bracket (under Slot 1&2) looping to left */}
            <path d="M 28.5% 96 C 5% 96, -8% 88, -8% 45 C -8% 25, 0% 25, 2% 25" stroke="#3b82f6" strokeWidth="1.5" fill="none" markerEnd={`url(#arrow-${id})`} />
          </svg>

          {/* TOP ROW: Legend & YOU Node & Blue Earnings Pill */}
          <div className="w-full relative flex items-center justify-between px-0.5 z-10 h-10">
            
            {/* Slot Indicator Legend */}
            <div className="flex items-center gap-1 text-[7.5px] font-semibold text-slate-300 bg-slate-900/90 px-1.5 py-0.5 rounded-full border border-slate-800 shrink-0 shadow-sm">
              <span className="flex items-center gap-0.5" title={lang === 'TH' ? 'สมาชิกปกติ' : 'Regular Referral'}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block border border-amber-200" />
                <span className="text-[7.5px] text-amber-200">{lang === 'TH' ? 'ปกติ' : 'Direct'}</span>
              </span>
              <span className="flex items-center gap-0.5 text-cyan-300 font-bold ml-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block border border-cyan-200 animate-pulse" />
                <span className="text-[7.5px] text-cyan-200">{lang === 'TH' ? 'เกิดใหม่' : 'Reborn'}</span>
              </span>
            </div>

            {/* YOU Node (Purple styled circle) ABSOLUTELY CENTERED */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-20">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-fuchsia-600 bg-white flex items-center justify-center shadow-md">
                <span className="text-[9.5px] sm:text-[10px] font-black text-fuchsia-700 tracking-wider">YOU</span>
              </div>
            </div>

            {/* Blue Earnings Pill on the right of YOU */}
            <div className="bg-[#0044ff] text-white font-extrabold text-[8px] sm:text-[8.5px] px-1.5 py-0.5 rounded shadow-[1px_1px_0px_#001ba0] border border-[#3b77ff] whitespace-nowrap shrink-0">
              {getLabel('earned')}
            </div>

          </div>

          {/* MIDDLE ROW: Slots 1, 2, 3, 4 with 50% and 100% Labels */}
          <div className="w-full flex justify-between items-center px-0.5 relative z-10 h-10">
            
            {/* Left 50% Indicator */}
            <div className="text-[#00c93c] text-[10px] sm:text-xs font-black tracking-wider shrink-0 w-[8%] text-left">
              50%
            </div>

            {/* Slots 1 to 4 Container */}
            <div className="w-[84%] flex justify-around items-center">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = active && matrix[idx];
                const isReborn = isFilled && Boolean(rebornSlots?.[idx]);

                return (
                  <div key={idx} className="flex flex-col items-center relative group">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 shadow-sm relative ${
                        isFilled
                          ? isReborn
                            ? 'bg-gradient-to-b from-cyan-300 via-sky-400 to-blue-600 border-cyan-100 shadow-[0_0_12px_rgba(6,182,212,0.9)] scale-105'
                            : 'bg-gradient-to-b from-yellow-300 to-amber-500 border-yellow-100 shadow-[0_0_10px_rgba(251,191,36,0.8)] scale-105'
                          : 'bg-white border-[#3b82f6] text-[#3b82f6]'
                      }`}
                    >
                      <span
                        className={`text-[11px] sm:text-xs font-black font-sans ${
                          isFilled
                            ? isReborn
                              ? 'text-white drop-shadow-sm font-extrabold'
                              : 'text-slate-950 font-black'
                            : 'text-fuchsia-600 font-black'
                        }`}
                      >
                        {idx + 1}
                      </span>

                      {/* Small visual badge indicator overlay */}
                      {isFilled && (
                        <span
                          title={
                            isReborn
                              ? lang === 'TH'
                                ? 'สล็อตนี้เติมโดยรหัสเกิดใหม่ (Reborn ID)'
                                : 'Filled by Reborn ID'
                              : lang === 'TH'
                              ? 'สล็อตนี้เติมโดยสมาชิกปกติ (Regular Referral)'
                              : 'Filled by Regular Referral'
                          }
                          className={`absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black shadow-md border ${
                            isReborn
                              ? 'bg-cyan-950 border-cyan-300 text-cyan-200 ring-2 ring-cyan-400/50 animate-pulse'
                              : 'bg-amber-950 border-amber-300 text-amber-200'
                          }`}
                        >
                          {isReborn ? '♻️' : '👤'}
                        </span>
                      )}
                    </div>

                    {/* Hover tooltip for quick feedback */}
                    {isFilled && (
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/95 border border-slate-700 text-[8px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap z-30 pointer-events-none text-slate-200 shadow-xl">
                        {isReborn
                          ? lang === 'TH'
                            ? '♻️ Reborn ID (รหัสเกิดใหม่)'
                            : '♻️ Reborn ID'
                          : lang === 'TH'
                          ? '👤 สมาชิกปกติ'
                          : '👤 Regular Referral'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right 100% Indicator */}
            <div className="text-[#00c93c] text-[10px] sm:text-xs font-black tracking-wider shrink-0 w-[8%] text-right">
              100%
            </div>

          </div>

          {/* BOTTOM ROW: Reborn Label (under 1&2) and AUTO UP (under 3&4) */}
          <div className="w-full flex justify-between items-start px-0.5 relative z-10 pt-3 h-14 text-center">
            
            {/* Left Box: Reborn */}
            <div className="w-[48%] flex flex-col items-center">
              <span className="text-[#f43f5e] font-black text-[8.5px] sm:text-[9px] uppercase tracking-wider leading-none">
                {getLabel('reborn')}
              </span>
              <span className="text-[#f43f5e] font-extrabold text-[7.5px] sm:text-[8px] leading-tight mt-0.5 max-w-[90px] break-words">
                {getLabel('rebornDesc')}
              </span>
            </div>

            {/* Right Box: Auto Up */}
            <div className="w-[48%] flex flex-col items-center">
              {Number(id) < 12 ? (
                <>
                  <span className="text-[#f97316] font-black text-[8.5px] sm:text-[9px] uppercase tracking-wider leading-none">
                    {getLabel('autoUp')}
                  </span>
                  <span className="text-[#f97316] font-extrabold text-[7.5px] sm:text-[8px] leading-tight mt-0.5">
                    {getLabel('autoUpRank')} ({nextCost}$)
                  </span>
                  {/* Downward yellow arrow marker */}
                  <svg className="w-2.5 h-2.5 mt-0.5" viewBox="0 0 10 10">
                    <line x1="5" y1="0" x2="5" y2="8" stroke="#eab308" strokeWidth="2" markerEnd={`url(#down-arrow-${id})`} />
                  </svg>
                </>
              ) : (
                <span className="text-amber-400 font-bold text-[8px] uppercase tracking-widest leading-none mt-2">
                  MAX RANK
                </span>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Progress Bar Section */}
      {active && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 relative z-10 px-1">
          <div className="flex items-center justify-between text-[10px] font-bold mb-1">
            <span className="text-slate-300 flex items-center gap-1">
              <span>{lang === 'TH' ? 'ความคืบหน้า Matrix' : 'Matrix Completion'}</span>
              <span className="text-slate-500 font-mono">({filledCount}/4)</span>
            </span>
            <span
              className={`font-black font-mono ${
                filledCount === 4 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {Math.round((filledCount / 4) * 100)}%
            </span>
          </div>

          {/* Segmented Progress Bar Track */}
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5 flex gap-1">
            {[0, 1, 2, 3].map((slotIdx) => {
              const isFilled = matrix[slotIdx];
              const isReborn = isFilled && Boolean(rebornSlots?.[slotIdx]);

              return (
                <div
                  key={slotIdx}
                  title={
                    isFilled
                      ? isReborn
                        ? lang === 'TH'
                          ? `สล็อตที่ ${slotIdx + 1}: Reborn ID`
                          : `Slot ${slotIdx + 1}: Reborn ID`
                        : lang === 'TH'
                        ? `สล็อตที่ ${slotIdx + 1}: สมาชิกปกติ`
                        : `Slot ${slotIdx + 1}: Direct Referral`
                      : lang === 'TH'
                      ? `สล็อตที่ ${slotIdx + 1}: ว่าง`
                      : `Slot ${slotIdx + 1}: Empty`
                  }
                  className={`flex-1 h-full rounded-full transition-all duration-500 ${
                    !isFilled
                      ? 'bg-slate-800/60'
                      : isReborn
                      ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                      : 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                  }`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1.5 font-medium">
            <span className="flex items-center gap-1">
              <span className="text-slate-500">{lang === 'TH' ? 'สถานะ:' : 'Status:'}</span>
              <span className={filledCount === 4 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                {filledCount === 4
                  ? lang === 'TH'
                    ? '✨ ครบสล็อตแล้ว! พร้อม Cycle'
                    : '✨ Matrix Completed!'
                  : lang === 'TH'
                  ? `เหลืออีก ${4 - filledCount} สล็อต`
                  : `${4 - filledCount} slots remaining`}
              </span>
            </span>
            {activeRebornCount > 0 && (
              <span className="text-cyan-300 font-bold flex items-center gap-0.5">
                <span>♻️</span>
                <span>{activeRebornCount} Reborn</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Lock Overlay with Glassmorphism */}
      {!active && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-[3px] transition-all duration-300">
          <motion.div
            className="flex flex-col items-center justify-center text-center p-4"
          >
            <div className={`p-3 rounded-full mb-2.5 ${
              buyable
                ? 'bg-amber-500/10 border-2 border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                : 'bg-slate-900 text-slate-600 border-2 border-slate-800'
            }`}>
              <Lock className="h-6 w-6" />
            </div>

            {/* Auto Unlock Locked Badge */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="px-4 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-black tracking-wider text-amber-400 uppercase">
                  {lang === 'TH' ? 'ล็อก' : 'Locked'} ({formattedCost} USDT)
                </span>
              </div>
              
              <span className="text-[10px] font-mono text-slate-400 font-medium">
                {lang === 'TH' ? '⚡ ระบบจะปลดล็อกให้อัตโนมัติ' : '⚡ System will unlock automatically'}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
