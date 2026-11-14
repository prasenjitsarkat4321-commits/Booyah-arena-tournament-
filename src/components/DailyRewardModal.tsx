import React, { useState } from 'react';
import { X, Sparkles, Gift, Check, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { translations, Language } from '../utils/translations';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onClaim: (coins: number) => void;
  alreadyClaimed: boolean;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  isOpen,
  onClose,
  lang,
  onClaim,
  alreadyClaimed,
}) => {
  const [claimed, setClaimed] = useState(alreadyClaimed);

  if (!isOpen) return null;

  const t = translations[lang];

  const handleClaim = () => {
    if (claimed) return;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#f97316', '#38bdf8'],
    });
    setClaimed(true);
    onClaim(50);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-center space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
          <Gift className="w-8 h-8" />
        </div>

        <div>
          <div className="text-xs font-mono font-bold text-amber-400 uppercase">
            Free Fire Daily Supply Drop
          </div>
          <h3 className="font-heading font-extrabold text-2xl text-white mt-1">
            +50 Booyah Coins
          </h3>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            Claim daily coins to enter free tournaments and earn cash prizes!
          </p>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300">
          🔥 Streak Bonus: Check in 7 days for 500 bonus coins.
        </div>

        <button
          type="button"
          disabled={claimed}
          onClick={handleClaim}
          className={`w-full py-3 rounded-xl font-heading font-bold text-sm tracking-wide transition-all shadow-md ${
            claimed
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 shadow-amber-500/20 active:scale-95'
          }`}
        >
          {claimed ? (
            <span className="flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{t.claimedToday}</span>
            </span>
          ) : (
            <span>{t.claimBonus}</span>
          )}
        </button>
      </div>
    </div>
  );
};
