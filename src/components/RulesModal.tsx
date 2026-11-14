import React from 'react';
import { X, ShieldAlert, CheckCircle, Ban, ShieldCheck } from 'lucide-react';
import { translations, Language } from '../utils/translations';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h3 className="font-heading font-bold text-lg text-white">
              {t.rulesTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
            <Ban className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold mb-0.5">Strict Zero-Tolerance Anti-Cheat</strong>
              {t.rule1}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold mb-0.5">Fair Play Gun Attributes</strong>
              {t.rule2}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold mb-0.5">Room ID & Pass Schedule</strong>
              {t.rule4}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold mb-0.5">Screenshot Result Proof</strong>
              {t.rule3}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
            <Ban className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold mb-0.5">Anti-Teaming Enforcement</strong>
              {t.rule5}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-heading font-bold"
        >
          Understood & Accept Rules
        </button>
      </div>
    </div>
  );
};
