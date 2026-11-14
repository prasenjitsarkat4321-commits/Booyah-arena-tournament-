import React from 'react';
import { Trophy, Award, Flame, Crosshair, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MatchResult } from '../types/tournament';
import { translations, Language } from '../utils/translations';

interface LeaderboardViewProps {
  results: MatchResult[];
  lang: Language;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ results, lang }) => {
  const t = translations[lang];
  const activeResult = results[0];

  const triggerBooyahCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#f97316', '#eab308', '#ffffff'],
    });
  };

  if (!activeResult) return null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold mb-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>OFFICIAL ESPORTS RESULTS</span>
            <span aria-hidden="true">·</span>
            <span>GARENA SCORING SYSTEM</span>
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-white">
            {activeResult.tournamentTitle}
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Match concluded on {activeResult.date} · Verified by Anti-Cheat
          </p>
        </div>

        <button
          onClick={triggerBooyahCelebration}
          className="self-start sm:self-auto py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-heading font-bold text-xs tracking-wide shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-zinc-950" />
          <span>Celebrate Booyah!</span>
        </button>
      </div>

      {/* Top Fragger & Booyah MVP Showcase */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Booyah Champion */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950 border border-amber-500/30 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>BOOYAH CHAMPION</span>
            </div>
            <div className="text-xl font-heading font-extrabold text-white">
              {activeResult.winningTeam}
            </div>
            <div className="text-xs text-zinc-400 font-mono">
              Roster: {activeResult.winningPlayers.join(', ')}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 text-xl font-bold font-mono">
            👑
          </div>
        </div>

        {/* Top Fragger */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-red-500/10 via-zinc-900 to-zinc-950 border border-red-500/30 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-400 uppercase">
              <Crosshair className="w-4 h-4 text-red-400" />
              <span>MVP TOP FRAGGER</span>
            </div>
            <div className="text-xl font-heading font-extrabold text-white">
              {activeResult.topFragger.ign}
            </div>
            <div className="text-xs text-zinc-400 font-mono">
              Total Frags: <strong className="text-red-400 font-bold">{activeResult.topFragger.kills} Kills</strong> in 1 Match
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/40 text-xl font-bold font-mono">
            🎯
          </div>
        </div>
      </div>

      {/* Points Table (Tabular Data Discipline) */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-xl">
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <span className="font-heading font-bold text-base text-white">
            {t.pointsTable} (Place Points + Kill Points)
          </span>
          <span className="text-xs text-zinc-400 font-mono">
            Placement: 12-9-8-7-6-5-4-3-2-1 · 1 Kill = 1 Point
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-950/60 uppercase">
                <th className="py-3 px-4 font-semibold text-center w-16">{t.rank}</th>
                <th className="py-3 px-4 font-semibold">{t.team}</th>
                <th className="py-3 px-4 font-semibold text-center">{t.placePts}</th>
                <th className="py-3 px-4 font-semibold text-center">{t.killPts}</th>
                <th className="py-3 px-4 font-semibold text-center text-amber-400">{t.totalPts}</th>
                <th className="py-3 px-4 font-semibold text-right text-emerald-400">{t.prizeWon}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {activeResult.leaderboard.map((row) => (
                <tr
                  key={row.rank}
                  className={`hover:bg-zinc-800/40 transition-colors ${
                    row.rank === 1 ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 text-center">
                    {row.rank === 1 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-zinc-950 font-bold text-xs shadow-md">
                        1
                      </span>
                    ) : row.rank === 2 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-300 text-zinc-950 font-bold text-xs">
                        2
                      </span>
                    ) : row.rank === 3 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-bold text-xs">
                        3
                      </span>
                    ) : (
                      <span className="text-zinc-400 tabular-nums font-semibold">#{row.rank}</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-heading font-bold text-sm text-white">
                      {row.teamName}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate max-w-xs mt-0.5">
                      {row.players.join(' · ')}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center text-zinc-300 tabular-nums">
                    {row.placementPoints}
                  </td>

                  <td className="py-3.5 px-4 text-center text-zinc-300 tabular-nums font-semibold">
                    {row.killPoints}
                  </td>

                  <td className="py-3.5 px-4 text-center text-amber-400 tabular-nums font-bold text-sm">
                    {row.totalPoints}
                  </td>

                  <td className="py-3.5 px-4 text-right text-emerald-400 tabular-nums font-bold text-sm">
                    {row.prizeWon > 0 ? `₹${row.prizeWon}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
