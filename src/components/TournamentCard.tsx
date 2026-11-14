import React from 'react';
import { Users, Crosshair, Trophy, Key, Shield, Clock, MapPin, Sparkles } from 'lucide-react';
import { Tournament } from '../types/tournament';
import { translations, Language } from '../utils/translations';
import { formatMatchStartDisplay } from '../utils/matchSchedule';

interface TournamentCardProps {
  tournament: Tournament;
  lang: Language;
  isJoined: boolean;
  onSelect: (tournament: Tournament) => void;
  onJoinDirect: (tournament: Tournament) => void;
  onViewRoomCredentials: (tournament: Tournament) => void;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  lang,
  isJoined,
  onSelect,
  onJoinDirect,
  onViewRoomCredentials,
}) => {
  const t = translations[lang];
  const percentFilled = Math.min(100, Math.round((tournament.filledSlots / tournament.totalSlots) * 100));
  const isFull = tournament.filledSlots >= tournament.totalSlots;
  const isRoomOpen = tournament.status === 'ROOM_OPEN';

  const modeBadgeText = {
    SOLO: 'SOLO · 48P',
    DUO: 'DUO · 24T',
    SQUAD: 'SQUAD · 12T',
    CLASH_SQUAD: 'CLASH SQUAD · 4V4',
  }[tournament.mode];

  return (
    <div className="group relative rounded-2xl border border-zinc-800/90 bg-zinc-900/90 hover:border-amber-500/50 hover:bg-zinc-900 transition-all duration-200 overflow-hidden shadow-lg flex flex-col">
      {/* Thumbnail Banner with Gradient Scrim */}
      <div className="relative h-44 w-full overflow-hidden bg-zinc-950">
        <img
          src={tournament.bannerImage}
          alt={tournament.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        
        {/* Top Floating Tags */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950/90 border border-zinc-700/80 text-[11px] font-mono font-semibold text-amber-400 backdrop-blur-sm">
            <span>{modeBadgeText}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isRoomOpen && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-orange-500/90 text-zinc-950 font-bold text-[11px] font-mono tracking-tight shadow-md">
                <Key className="w-3.5 h-3.5" />
                <span>ROOM OPEN</span>
              </span>
            )}
            {isJoined && (
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/90 text-zinc-950 font-bold text-[11px] font-mono tracking-tight shadow-md">
                {t.joinedBadge} ✓
              </span>
            )}
          </div>
        </div>

        {/* Bottom Banner Info: Map & Time */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-zinc-300 font-mono">
          <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>{tournament.map}</span>
            <span aria-hidden="true" className="text-zinc-500">·</span>
            <span className="text-zinc-400 text-[11px]">{tournament.gunAttributes ? 'Attributes ON' : 'Attributes OFF'}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-300">
            <Clock className="w-3.5 h-3.5" />
            <span className="tabular-nums">{formatMatchStartDisplay(tournament.startTime)}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Card Title */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 
              onClick={() => onSelect(tournament)}
              className="font-heading font-bold text-lg sm:text-xl text-white group-hover:text-amber-400 transition-colors line-clamp-1 cursor-pointer"
            >
              {lang === 'hi' ? tournament.titleHi : tournament.title}
            </h3>
          </div>

          {/* Prize Matrix (Unboxed clean layout with tabular figures) */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 mb-4">
            <div className="flex flex-col">
              <span className="text-[11px] text-zinc-400 font-medium">
                {t.prizePool}
              </span>
              <span className="text-base font-mono font-bold text-amber-400 tabular-nums">
                {tournament.currency === 'INR' ? `₹${tournament.prizePool}` : `💎 ${tournament.prizePool}`}
              </span>
            </div>

            <div className="flex flex-col border-x border-zinc-800 px-2">
              <span className="text-[11px] text-zinc-400 font-medium">
                {t.perKill}
              </span>
              <span className="text-base font-mono font-bold text-emerald-400 tabular-nums">
                {tournament.currency === 'INR' ? `₹${tournament.perKillPrize}` : `💎 ${tournament.perKillPrize}`}
              </span>
            </div>

            <div className="flex flex-col text-right">
              <span className="text-[11px] text-zinc-400 font-medium">
                {t.entryFee}
              </span>
              <span className={`text-base font-mono font-bold tabular-nums ${tournament.entryFee === 0 ? 'text-cyan-400' : 'text-zinc-100'}`}>
                {tournament.entryFee === 0
                  ? t.freeEntry
                  : tournament.currency === 'INR'
                    ? `₹${tournament.entryFee}`
                    : `💎 ${tournament.entryFee}`}
              </span>
            </div>
          </div>

          {/* Slots Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-500" />
                <span>{t.slotsFilled}</span>
              </span>
              <span className="text-zinc-200 font-bold tabular-nums">
                {tournament.filledSlots}/{tournament.totalSlots} {tournament.mode === 'SQUAD' ? 'Teams' : 'Players'}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  percentFilled > 85 ? 'bg-orange-500' : 'bg-amber-400'
                }`}
                style={{ width: `${percentFilled}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={() => onSelect(tournament)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-heading font-bold tracking-wide transition-colors whitespace-nowrap text-center"
          >
            Match Details & Slots
          </button>

          {isJoined ? (
            <button
              onClick={() => onViewRoomCredentials(tournament)}
              className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 text-xs font-heading font-bold tracking-wide transition-colors flex items-center gap-1.5 shadow-md shadow-orange-500/20 whitespace-nowrap"
            >
              <Key className="w-3.5 h-3.5 text-zinc-950" />
              <span>Room ID & Pass</span>
            </button>
          ) : (
            <button
              disabled={isFull}
              onClick={() => onJoinDirect(tournament)}
              className={`py-2.5 px-4 rounded-xl text-xs font-heading font-bold tracking-wide transition-all whitespace-nowrap ${
                isFull
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 shadow-md shadow-amber-500/20'
              }`}
            >
              {isFull ? t.matchFull : t.joinMatch}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
