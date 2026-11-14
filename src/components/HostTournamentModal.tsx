import React, { useState } from 'react';
import { X, Trophy, PlusCircle, Shield, Check, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Tournament, GameMode, MapType, UserProfile } from '../types/tournament';
import { translations, Language } from '../utils/translations';

interface HostTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  user: UserProfile;
  isAdminMode?: boolean;
  onCreateTournament: (tournament: Tournament) => void;
}

const toLocalDatetimeInputValue = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

export const HostTournamentModal: React.FC<HostTournamentModalProps> = ({
  isOpen,
  onClose,
  lang,
  user,
  isAdminMode = false,
  onCreateTournament,
}) => {
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<GameMode>('SQUAD');
  const [map, setMap] = useState<MapType>('Bermuda');
  const [entryFee, setEntryFee] = useState<number>(25);
  const [prizePool, setPrizePool] = useState<number>(2000);
  const [perKillPrize, setPerKillPrize] = useState<number>(15);
  const [matchTime, setMatchTime] = useState(() =>
    toLocalDatetimeInputValue(new Date(Date.now() + 60 * 60 * 1000))
  );
  const [roomId, setRoomId] = useState('FF-482019');
  const [roomPassword, setRoomPassword] = useState('619');
  const [gunAttributes, setGunAttributes] = useState(false);

  if (!isOpen) return null;

  const t = translations[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const bannerImageMap: Record<MapType, string> = {
      Bermuda: '/src/assets/images/ff_bermuda_map_1794502067753.jpg',
      Kalahari: '/src/assets/images/ff_kalahari_desert_1794502099254.jpg',
      Purgatory: '/src/assets/images/ff_esports_hero_1794502052275.jpg',
      Alpine: '/src/assets/images/ff_clash_squad_1794502081121.jpg',
      NexTerra: '/src/assets/images/ff_clash_squad_1794502081121.jpg',
    };

    const totalSlots = mode === 'SOLO' ? 48 : mode === 'DUO' ? 24 : mode === 'CLASH_SQUAD' ? 8 : 12;

    const newTournament: Tournament = {
      id: `custom-scrim-${Date.now()}`,
      title: (title || `${user.ign}'s Custom Free Fire Scrim`).slice(0, 120),
      titleHi: (title || `${user.ign} का कस्टम फ्री फायर स्क्रिम`).slice(0, 120),
      mode,
      map,
      bannerImage: bannerImageMap[map],
      prizePool,
      currency: 'INR',
      entryFee,
      perKillPrize,
      firstPlacePrize: Math.round(prizePool * 0.5),
      secondPlacePrize: Math.round(prizePool * 0.25),
      thirdPlacePrize: Math.round(prizePool * 0.12),
      totalSlots,
      filledSlots: isAdminMode ? 0 : 1,
      startTime: matchTime,
      roomId: roomId.trim() || undefined,
      roomPassword: roomPassword.trim() || undefined,
      roomUnlocksAt: '15 mins before match',
      status: 'UPCOMING',
      organizer: isAdminMode ? 'BooyahArena Official' : user.ign,
      isVerified: isAdminMode,
      deviceType: 'MOBILE_ONLY',
      gunAttributes,
      rules: [
        'Organized custom match.',
        'No emulators or iPads. Mobile phones only.',
        gunAttributes ? 'Gun skins attributes allowed.' : 'Gun attributes kept OFF.',
        'Upload final Booyah screenshot in Leaderboard tab after match.',
      ],
      slots: Array.from({ length: totalSlots }, (_, i) => {
        if (!isAdminMode && i === 0) {
          return {
            slotNumber: i + 1,
            teamName: `${user.ign}'s Clan`,
            isLocked: true,
            players: [{ ign: user.ign, uid: user.ffUid }],
          };
        }
        return {
          slotNumber: i + 1,
          isLocked: false,
          players: [],
        };
      }),
    };

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#f97316', '#10b981'],
    });

    onCreateTournament(newTournament);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-heading font-bold text-white">
                {t.createTournamentTitle}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">Set prizes, map, slots & custom room credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Title */}
          <div>
            <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1">
              {t.matchTitle}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Free Fire Midnight Battle Royale"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Mode & Map selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1">
                {t.mode}
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as GameMode)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
              >
                <option value="SQUAD">Squad (12 Teams / 48 P)</option>
                <option value="SOLO">Solo (48 Players)</option>
                <option value="DUO">Duo (24 Teams)</option>
                <option value="CLASH_SQUAD">Clash Squad (4v4)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1">
                {t.mapName}
              </label>
              <select
                value={map}
                onChange={(e) => setMap(e.target.value as MapType)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
              >
                <option value="Bermuda">Bermuda</option>
                <option value="Kalahari">Kalahari</option>
                <option value="Purgatory">Purgatory</option>
                <option value="Alpine">Alpine</option>
                <option value="NexTerra">NexTerra</option>
              </select>
            </div>
          </div>

          {/* Pricing & Prizes */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">Entry Fee (₹)</label>
              <input
                type="number"
                min="0"
                value={entryFee}
                onChange={(e) => setEntryFee(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">Total Prize (₹)</label>
              <input
                type="number"
                min="100"
                value={prizePool}
                onChange={(e) => setPrizePool(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">Per Kill (₹)</label>
              <input
                type="number"
                min="0"
                value={perKillPrize}
                onChange={(e) => setPerKillPrize(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Schedule & Room Credentials */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-[11px] font-mono text-zinc-400">
                  Match Start Time (Room auto-unlocks 15 mins prior)
                </label>
                <div className="flex items-center gap-1">
                  {[
                    { label: '+10m', mins: 10 },
                    { label: '+20m', mins: 20 },
                    { label: '+1h', mins: 60 },
                    { label: '+2h', mins: 120 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        setMatchTime(
                          toLocalDatetimeInputValue(new Date(Date.now() + preset.mins * 60 * 1000))
                        )
                      }
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-amber-500/20 hover:text-amber-300 text-[10px] font-mono text-zinc-300 border border-zinc-700 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="datetime-local"
                required
                value={matchTime}
                onChange={(e) => setMatchTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Custom Room ID</label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="FF-XXXXXX"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Password</label>
                <input
                  type="text"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  placeholder="123"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Gun attributes toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <div>
              <span className="text-xs font-mono font-semibold text-white block">Gun Skins Extra Attributes</span>
              <span className="text-[10px] text-zinc-400">Competitive esports scrims keep this OFF</span>
            </div>
            <button
              type="button"
              onClick={() => setGunAttributes(!gunAttributes)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                gunAttributes ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {gunAttributes ? 'ON' : 'OFF (Esports)'}
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-heading font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Flame className="w-4 h-4 fill-zinc-950" />
            <span>{t.createButton}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
