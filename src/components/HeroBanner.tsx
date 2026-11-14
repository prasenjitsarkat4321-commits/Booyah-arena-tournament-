import React from 'react';
import { Flame, ShieldCheck, Zap, Users, Trophy } from 'lucide-react';
import { translations, Language } from '../utils/translations';

interface HeroBannerProps {
  lang: Language;
  onJoinClick: () => void;
  onHostClick: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ lang, onJoinClick, onHostClick }) => {
  const t = translations[lang];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900 shadow-2xl">
      {/* High-Fidelity Esports Generated Hero Image with measured scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/ff_esports_hero_1794502052275.jpg"
          alt="Free Fire Esports Tournament Stage"
          className="w-full h-full object-cover object-center scale-105 filter brightness-75"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/60 to-transparent" />
      </div>

      {/* Content Area */}
      <div className="relative z-10 max-w-4xl px-6 py-10 sm:px-10 sm:py-14 lg:py-16">
        
        {/* Unboxed Metadata Kicker (Anti-slop zero-pill discipline) */}
        <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-amber-400 uppercase mb-3">
          <Flame className="w-4 h-4 fill-amber-400 text-amber-500" />
          <span>{t.heroBadge}</span>
          <span aria-hidden="true" className="text-zinc-500">·</span>
          <span>SEASON 14</span>
          <span aria-hidden="true" className="text-zinc-500">·</span>
          <span>DAILY CUSTOM ROOMS</span>
        </div>

        {/* Display Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-white tracking-wide leading-tight text-balance max-w-2xl mb-4">
          {t.heroHeadline}
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-zinc-300 max-w-xl leading-relaxed mb-8">
          {t.heroSubhead}
        </p>

        {/* Primary & Secondary Action CTAs */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8">
          <button
            onClick={onJoinClick}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-heading font-bold text-base tracking-wide shadow-lg shadow-orange-500/25 hover:from-amber-400 hover:to-orange-400 active:scale-95 transition-all whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <Trophy className="w-5 h-5 text-zinc-950" />
            <span>{t.joinScrimNow}</span>
          </button>

          <button
            onClick={onHostClick}
            className="px-5 py-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 font-heading font-bold text-base tracking-wide hover:text-amber-400 active:scale-95 transition-all whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>{t.hostCustomRoom}</span>
          </button>
        </div>

        {/* Proof & Esports Feature Matrix (Claim-to-Proof Adjacency) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-zinc-800/80">
          <div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums">
              ₹50,000+
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Daily Prize Pool
            </div>
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-amber-400 tabular-nums">
              15 Mins
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Room ID & Pass Delivery
            </div>
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400 tabular-nums">
              100%
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Anti-Cheat & Mobile Only
            </div>
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-400 tabular-nums">
              &lt; 5 Mins
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Instant UPI Payouts
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
