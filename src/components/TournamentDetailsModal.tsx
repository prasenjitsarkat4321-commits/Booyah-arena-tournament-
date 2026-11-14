import React, { useState, useEffect } from 'react';
import { X, Trophy, Users, Shield, Clock, Key, Copy, Check, AlertCircle, ChevronRight, Lock, Timer } from 'lucide-react';
import { Tournament } from '../types/tournament';
import { translations, Language, pickLocalized } from '../utils/translations';
import {
  getRoomRevealState,
  formatCountdown,
  formatMatchStartDisplay,
} from '../utils/matchSchedule';

interface TournamentDetailsModalProps {
  tournament: Tournament | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  isJoined: boolean;
  onOpenBooking: (tournament: Tournament, preselectedSlot?: number) => void;
}

export const TournamentDetailsModal: React.FC<TournamentDetailsModalProps> = ({
  tournament,
  isOpen,
  onClose,
  lang,
  isJoined,
  onOpenBooking,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'slots' | 'room' | 'rules'>('overview');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || !tournament) return null;

  const t = translations[lang];
  const revealState = getRoomRevealState(tournament, nowMs);
  const displayStartTime = formatMatchStartDisplay(tournament.startTime);

  const handleCopyId = () => {
    if (tournament.roomId) {
      navigator.clipboard.writeText(tournament.roomId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleCopyPass = () => {
    if (tournament.roomPassword) {
      navigator.clipboard.writeText(tournament.roomPassword);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Banner */}
        <div className="relative h-40 sm:h-48 w-full bg-zinc-950 shrink-0">
          <img
            src={tournament.bannerImage}
            alt={tournament.title}
            className="w-full h-full object-cover object-center filter brightness-75"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center border border-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-semibold mb-1">
              <span>{tournament.mode}</span>
              <span aria-hidden="true">·</span>
              <span>{tournament.map} MAP</span>
              <span aria-hidden="true">·</span>
              <span>{tournament.gunAttributes ? 'Gun Attributes ON' : 'Attributes OFF'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white line-clamp-1">
              {lang === 'hi' ? tournament.titleHi : tournament.title}
            </h2>
          </div>
        </div>

        {/* Modal Nav Tabs */}
        <div className="flex items-center border-b border-zinc-800 px-4 bg-zinc-900/90 text-xs font-heading font-bold shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Overview & Prizes
          </button>
          <button
            onClick={() => setActiveTab('slots')}
            className={`py-3 px-3 transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'slots'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Slot Matrix ({tournament.filledSlots}/{tournament.totalSlots})
          </button>
          <button
            onClick={() => setActiveTab('room')}
            className={`py-3 px-3 transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'room'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-500" />
            <span>Room ID & Pass</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-3 transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'rules'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Rules & Anti-Cheat
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Prize Pool Spotlight Grid */}
              <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <span className="font-heading font-bold text-base text-zinc-100">
                      Prize Distribution Breakup
                    </span>
                  </div>
                  <span className="text-sm font-mono font-bold text-amber-400">
                    Total: ₹{tournament.prizePool}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-amber-500/30">
                    <div className="text-[11px] text-amber-400 font-bold uppercase">1st Place (Booyah)</div>
                    <div className="text-lg font-mono font-extrabold text-white mt-1 tabular-nums">
                      ₹{tournament.firstPlacePrize}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400 font-bold uppercase">2nd Place</div>
                    <div className="text-lg font-mono font-extrabold text-zinc-200 mt-1 tabular-nums">
                      ₹{tournament.secondPlacePrize}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400 font-bold uppercase">3rd Place</div>
                    <div className="text-lg font-mono font-extrabold text-zinc-200 mt-1 tabular-nums">
                      ₹{tournament.thirdPlacePrize}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-emerald-500/30">
                    <div className="text-[11px] text-emerald-400 font-bold uppercase">Per Kill Prize</div>
                    <div className="text-lg font-mono font-extrabold text-emerald-400 mt-1 tabular-nums">
                      ₹{tournament.perKillPrize}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tournament Specs Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-mono">Match Time</div>
                    <div className="text-xs font-bold text-white">{displayStartTime}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-mono">Device Verification</div>
                    <div className="text-xs font-bold text-emerald-400">Mobile Only (No PC)</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center gap-3 col-span-2 sm:col-span-1">
                  <Users className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-mono">Organizer</div>
                    <div className="text-xs font-bold text-zinc-200 truncate">{tournament.organizer}</div>
                  </div>
                </div>
              </div>

              {/* Quick Info Box */}
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-400 font-semibold block mb-0.5">Important Match Notice:</strong>
                  Room ID and Password are generated and displayed in the "Room ID & Pass" tab 15 minutes before match start. Please copy and paste in Free Fire custom room promptly.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SLOT MATRIX */}
          {activeTab === 'slots' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                <span>Select a vacant slot to join directly:</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-zinc-700" />
                    <span>Occupied</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                    <span>Available</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {tournament.slots.map((slot) => {
                  const isOccupied = slot.isLocked || slot.players.length > 0;
                  return (
                    <div
                      key={slot.slotNumber}
                      onClick={() => {
                        if (!isOccupied && !isJoined) {
                          onOpenBooking(tournament, slot.slotNumber);
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isOccupied
                          ? 'bg-zinc-950/80 border-zinc-800 text-zinc-500 cursor-not-allowed'
                          : 'bg-zinc-800/80 hover:bg-zinc-800 border-amber-500/40 text-zinc-100 hover:border-amber-400 cursor-pointer hover:scale-[1.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-xs mb-1">
                        <span className="font-bold">Slot #{slot.slotNumber}</span>
                        {isOccupied ? (
                          <span className="text-[10px] text-zinc-500 font-semibold uppercase">Taken</span>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-bold uppercase">Open</span>
                        )}
                      </div>

                      {isOccupied ? (
                        <div className="text-[11px] font-semibold text-zinc-400 truncate">
                          {slot.teamName || slot.players[0]?.ign || 'Reserved Team'}
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
                          <span>Click to Book</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ROOM ID & PASSWORD */}
          {activeTab === 'room' && (
            <div className="space-y-5">
              {isJoined ? (
                revealState.isUnlocked ? (
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-emerald-500/40 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                      <div>
                        <div className="text-xs font-mono font-bold text-emerald-400 uppercase">
                          Custom Room Credentials
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          Use these credentials in Free Fire &gt; Custom &gt; Enter ID
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
                        {revealState.isMatchStarted ? 'LIVE NOW' : 'UNLOCKED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Room ID */}
                      <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-zinc-400 uppercase font-mono">Room ID</div>
                          <div className="text-lg font-mono font-bold text-white tracking-wider">
                            {tournament.roomId || 'FF-8849201'}
                          </div>
                        </div>
                        <button
                          onClick={handleCopyId}
                          className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-amber-400 font-mono flex items-center gap-1.5 transition-colors"
                        >
                          {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedId ? t.copied : 'Copy'}</span>
                        </button>
                      </div>

                      {/* Room Password */}
                      <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-zinc-400 uppercase font-mono">Room Password</div>
                          <div className="text-lg font-mono font-bold text-amber-400 tracking-wider">
                            {tournament.roomPassword || '772'}
                          </div>
                        </div>
                        <button
                          onClick={handleCopyPass}
                          className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-amber-400 font-mono flex items-center gap-1.5 transition-colors"
                        >
                          {copiedPass ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedPass ? t.copied : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Instructions on entering Free Fire */}
                    <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 space-y-1.5">
                      <span className="font-bold text-zinc-100 block">How to join inside Free Fire:</span>
                      <div>1. Open <strong>Free Fire MAX</strong> on your phone.</div>
                      <div>2. Click on the <strong>Game Mode selector</strong> &gt; click <strong>Custom</strong>.</div>
                      <div>3. Tap the <strong>Search icon</strong> at the bottom and paste the Room ID.</div>
                      <div>4. Enter the Password and join your registered team slot number!</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-zinc-950 border border-amber-500/30 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h4 className="font-heading font-bold text-base text-white">
                      {pickLocalized(
                        lang,
                        'Room ID & Password Auto-Unlock Soon',
                        'रूम ID और पासवर्ड जल्द ही अनलॉक होंगे',
                        'রুম আইডি ও পাসওয়ার্ড শীঘ্রই আনলক হবে'
                      )}
                    </h4>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-mono font-bold text-amber-300 tabular-nums">
                      <Timer className="w-4 h-4" />
                      <span>
                        {pickLocalized(lang, 'Unlocks in', 'अनलॉक होने में', 'আনলক হতে বাকি')}{' '}
                        {formatCountdown(revealState.msUntilUnlock)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                      {pickLocalized(
                        lang,
                        'Your slot is confirmed! Room credentials automatically become visible 15 minutes before the match start time inside My Matches.',
                        'आपकी स्लॉट कन्फर्म है! मैच शुरू होने से 15 मिनट पहले रूम ID और पासवर्ड My Matches में अपने आप दिख जाएंगे।',
                        'আপনার স্লট নিশ্চিত হয়েছে! ম্যাচ শুরুর ১৫ মিনিট আগে My Matches সেকশনে রুম আইডি ও পাসওয়ার্ড স্বয়ংক্রিয়ভাবে দেখা যাবে।'
                      )}
                    </p>
                  </div>
                )
              ) : (
                <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-3">
                  <Key className="w-8 h-8 text-amber-500 mx-auto" />
                  <h4 className="font-heading font-bold text-base text-white">
                    Room ID & Password are Protected
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Room credentials are only visible to players who have booked a slot in this tournament.
                  </p>
                  <button
                    onClick={() => onOpenBooking(tournament)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-heading font-bold text-xs tracking-wide shadow-md transition-all"
                  >
                    Join Match to Unlock Credentials
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 text-xs text-zinc-300">
                <div className="font-heading font-bold text-sm text-amber-400">
                  {t.rulesTitle}
                </div>
                <div className="space-y-2.5 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">1.</span>
                    <span>{t.rule1}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">2.</span>
                    <span>{t.rule2}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">3.</span>
                    <span>{t.rule3}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">4.</span>
                    <span>{t.rule4}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">5.</span>
                    <span>{t.rule5}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer CTA */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <span className="text-[11px] text-zinc-400 font-medium">Entry Fee:</span>
            <span className="text-lg font-mono font-bold text-amber-400 tabular-nums">
              {tournament.entryFee === 0 ? t.freeEntry : `₹${tournament.entryFee}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-heading font-bold transition-colors"
            >
              Close
            </button>
            {isJoined ? (
              <button
                onClick={() => setActiveTab('room')}
                className="py-2.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 text-xs font-heading font-bold tracking-wide shadow-md flex items-center gap-1.5 transition-all"
              >
                <Key className="w-4 h-4 text-zinc-950" />
                <span>Show Room ID</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenBooking(tournament)}
                className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-heading font-bold tracking-wide shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                {t.joinMatch}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
