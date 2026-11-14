import React, { useState, useEffect } from 'react';
import { Ticket, Key, Copy, Check, Clock, Upload, Lock, Timer } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Tournament, UserProfile } from '../types/tournament';
import { translations, Language, pickLocalized } from '../utils/translations';
import {
  getRoomRevealState,
  formatCountdown,
  formatMatchStartDisplay,
} from '../utils/matchSchedule';

interface MyMatchesViewProps {
  joinedTournaments: Tournament[];
  lang: Language;
  user: UserProfile;
  onExploreTournaments: () => void;
  onSubmitResultProof: (tournamentId: string, kills: number, proofName: string) => void;
  onSimulateRoomAlert?: (tournament: Tournament) => void;
}

export const MyMatchesView: React.FC<MyMatchesViewProps> = ({
  joinedTournaments,
  lang,
  user,
  onExploreTournaments,
  onSubmitResultProof,
  onSimulateRoomAlert,
}) => {
  const t = translations[lang];
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPass, setCopiedPass] = useState<string | null>(null);
  const [copiedHint, setCopiedHint] = useState<{ tourneyId: string; label: string } | null>(null);
  const [proofModalTourney, setProofModalTourney] = useState<Tournament | null>(null);
  const [killCount, setKillCount] = useState<number>(5);
  const [proofSubmitted, setProofSubmitted] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const triggerCopyHaptic = () => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([18, 25, 30]);
      } catch {
        // Ignore if blocked by browser policy
      }
    }
  };

  const handleCopy = async (text: string, type: 'id' | 'pass', tourneyId: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      try {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      } catch {
        // Silent fallback
      }
    }

    triggerCopyHaptic();

    if (type === 'id') {
      setCopiedId(tourneyId);
      setCopiedHint({
        tourneyId,
        label: pickLocalized(
          lang,
          'Room ID copied! Paste it in Free Fire Custom Room.',
          'रूम ID कॉपी हो गया! अब Free Fire Custom में पेस्ट करें।',
          'রুম ID কপি হয়েছে! এখন Free Fire Custom-এ পেস্ট করুন।'
        ),
      });
      setTimeout(() => setCopiedId((prev) => (prev === tourneyId ? null : prev)), 2000);
    } else {
      setCopiedPass(tourneyId);
      setCopiedHint({
        tourneyId,
        label: pickLocalized(
          lang,
          'Password copied! Ready to enter custom match.',
          'पासवर्ड कॉपी हो गया! कस्टम मैच में प्रवेश करें।',
          'পাসওয়ার্ড কপি হয়েছে! কাস্টম ম্যাচে প্রবেশ করুন।'
        ),
      });
      setTimeout(() => setCopiedPass((prev) => (prev === tourneyId ? null : prev)), 2000);
    }

    setTimeout(
      () =>
        setCopiedHint((prev) => (prev && prev.tourneyId === tourneyId ? null : prev)),
      2200
    );
  };

  const handleProofSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (proofModalTourney) {
      onSubmitResultProof(proofModalTourney.id, killCount, 'booyah_victory_proof.jpg');
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
      setProofSubmitted(true);
      setTimeout(() => {
        setProofSubmitted(false);
        setProofModalTourney(null);
      }, 1800);
    }
  };

  if (joinedTournaments.length === 0) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
          <Ticket className="w-8 h-8" />
        </div>
        <h3 className="font-heading font-bold text-xl text-white">
          {pickLocalized(
            lang,
            'No Joined Matches Yet',
            'कोई मैच जॉइन नहीं किया',
            'এখনো কোনো ম্যাচে যোগ দেননি'
          )}
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {t.noJoinedMatches}
        </p>
        <button
          onClick={onExploreTournaments}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-heading font-bold text-xs tracking-wide shadow-md shadow-amber-500/20 transition-all"
        >
          {t.joinScrimNow}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-white">
            {t.myTickets} ({joinedTournaments.length})
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Your match passes, allotted slots, and live custom room credentials
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {joinedTournaments.map((tourney) => {
          // Find user's slot in this tournament
          const userSlot =
            tourney.slots.find((s) =>
              s.players.some((p) => p.ign === user.ign || p.uid === user.ffUid)
            ) ||
            tourney.slots.find((s) => s.isLocked || s.players.length > 0) ||
            tourney.slots[0];

          const revealState = getRoomRevealState(tourney, nowMs);
          const displayStartTime = formatMatchStartDisplay(tourney.startTime);

          return (
            <div
              key={tourney.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/90 overflow-hidden shadow-xl flex flex-col justify-between"
            >
              {/* Ticket Top Strip */}
              <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-950 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold mb-1">
                    <span>{tourney.mode}</span>
                    <span aria-hidden="true">·</span>
                    <span>{tourney.map}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-400">
                      {pickLocalized(lang, 'TICKET CONFIRMED', 'टिकट कन्फर्म', 'টিকিট নিশ্চিত')}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-white">
                    {lang === 'hi' ? tourney.titleHi : tourney.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{displayStartTime}</span>
                  </div>
                </div>

                <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center shrink-0">
                  <div className="text-[10px] font-mono text-amber-400 font-semibold uppercase">
                    {pickLocalized(lang, 'Allotted', 'अलॉटेड', 'বরাদ্দ')}
                  </div>
                  <div className="text-base font-mono font-bold text-white">
                    Slot #{userSlot?.slotNumber || 1}
                  </div>
                </div>
              </div>

              {/* Ticket Body: Room Credentials Box with 15-min Auto-Reveal */}
              <div className="p-4 sm:p-5 space-y-4 flex-1">
                <div
                  className={`p-4 rounded-xl bg-zinc-950 border space-y-3 ${
                    revealState.isUnlocked ? 'border-emerald-500/40' : 'border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                      {revealState.isUnlocked ? (
                        <Key className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-amber-400" />
                      )}
                      <span>{t.roomCredentials}</span>
                    </div>

                    {revealState.isUnlocked ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {revealState.isMatchStarted
                          ? pickLocalized(lang, 'MATCH LIVE', 'मैच लाइव', 'ম্যাচ লাইভ')
                          : pickLocalized(
                              lang,
                              'UNLOCKED (15M WINDOW)',
                              'अनलॉक (15 मिनट पहले)',
                              'আনলক হয়েছে (১৫ মিনিট উইন্ডো)'
                            )}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        <span>
                          {pickLocalized(lang, 'UNLOCKS IN', 'अनलॉक होने में', 'আনলক হবে')}{' '}
                          {formatCountdown(revealState.msUntilUnlock)}
                        </span>
                      </span>
                    )}
                  </div>

                  {revealState.isUnlocked ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Room ID - Full Tactile Tap-to-Copy Tile */}
                        <button
                          type="button"
                          onClick={() => handleCopy(tourney.roomId || 'FF-8849201', 'id', tourney.id)}
                          aria-label={t.copyRoomId}
                          className={`group relative overflow-hidden min-h-[64px] w-full text-left p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer select-none transition-all duration-150 ease-out active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                            copiedId === tourney.id
                              ? 'bg-emerald-500/15 border-emerald-400/70 shadow-lg shadow-emerald-500/10 scale-[1.01]'
                              : 'bg-zinc-900 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800/80'
                          }`}
                        >
                          {copiedId === tourney.id && (
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 rounded-xl border-2 border-emerald-400/60 animate-[ping_0.45s_ease-out_1] motion-reduce:hidden"
                            />
                          )}
                          <div className="min-w-0 relative z-10">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                                Room ID
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold transition-opacity duration-150 ${
                                  copiedId === tourney.id
                                    ? 'text-emerald-400 opacity-100'
                                    : 'text-amber-400/80 opacity-90 group-hover:text-amber-300'
                                }`}
                              >
                                ·{' '}
                                {copiedId === tourney.id
                                  ? pickLocalized(lang, 'Copied!', 'कॉपी हो गया!', 'কপি হয়েছে!')
                                  : pickLocalized(lang, 'Tap to copy', 'टैप कर कॉपी करें', 'ট্যাপ করে কপি করুন')}
                              </span>
                            </div>
                            <div className="text-sm sm:text-base font-mono font-bold text-white truncate tabular-nums mt-0.5">
                              {tourney.roomId || 'FF-8849201'}
                            </div>
                          </div>
                          <div
                            className={`relative z-10 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-150 ${
                              copiedId === tourney.id
                                ? 'bg-emerald-500 text-zinc-950 scale-110'
                                : 'bg-zinc-800 text-amber-400 group-hover:scale-105 group-active:scale-90'
                            }`}
                          >
                            {copiedId === tourney.id ? (
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </div>
                        </button>

                        {/* Room Password - Full Tactile Tap-to-Copy Tile */}
                        <button
                          type="button"
                          onClick={() => handleCopy(tourney.roomPassword || '772', 'pass', tourney.id)}
                          aria-label={t.copyPassword}
                          className={`group relative overflow-hidden min-h-[64px] w-full text-left p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer select-none transition-all duration-150 ease-out active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                            copiedPass === tourney.id
                              ? 'bg-emerald-500/15 border-emerald-400/70 shadow-lg shadow-emerald-500/10 scale-[1.01]'
                              : 'bg-zinc-900 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800/80'
                          }`}
                        >
                          {copiedPass === tourney.id && (
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 rounded-xl border-2 border-emerald-400/60 animate-[ping_0.45s_ease-out_1] motion-reduce:hidden"
                            />
                          )}
                          <div className="min-w-0 relative z-10">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                                Password
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold transition-opacity duration-150 ${
                                  copiedPass === tourney.id
                                    ? 'text-emerald-400 opacity-100'
                                    : 'text-amber-400/80 opacity-90 group-hover:text-amber-300'
                                }`}
                              >
                                ·{' '}
                                {copiedPass === tourney.id
                                  ? pickLocalized(lang, 'Copied!', 'कॉपी हो गया!', 'কপি হয়েছে!')
                                  : pickLocalized(lang, 'Tap to copy', 'टैप कर कॉपी करें', 'ট্যাপ করে কপি করুন')}
                              </span>
                            </div>
                            <div className="text-sm sm:text-base font-mono font-bold text-amber-400 truncate tabular-nums mt-0.5">
                              {tourney.roomPassword || '772'}
                            </div>
                          </div>
                          <div
                            className={`relative z-10 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-150 ${
                              copiedPass === tourney.id
                                ? 'bg-emerald-500 text-zinc-950 scale-110'
                                : 'bg-zinc-800 text-amber-400 group-hover:scale-105 group-active:scale-90'
                            }`}
                          >
                            {copiedPass === tourney.id ? (
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </div>
                        </button>
                      </div>

                      {copiedHint?.tourneyId === tourney.id && (
                        <div className="px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-xs font-mono font-semibold text-emerald-300 flex items-center gap-2 transition-all duration-150">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{copiedHint.label}</span>
                        </div>
                      )}

                      <div className="text-[11px] text-zinc-400 leading-snug flex flex-wrap items-center justify-between gap-2">
                        <span>
                          👉{' '}
                          {pickLocalized(
                            lang,
                            `Go to Free Fire > Custom > Enter Room ID & Password > Sit only in Slot #${userSlot?.slotNumber || 1}.`,
                            `Free Fire > Custom में जाकर Room ID व Password डालें और केवल Slot #${userSlot?.slotNumber || 1} में बैठें।`,
                            `Free Fire > Custom-এ গিয়ে Room ID ও পাসওয়ার্ড দিন এবং শুধুমাত্র Slot #${userSlot?.slotNumber || 1}-এ বসুন।`
                          )}
                        </span>
                        {!revealState.isMatchStarted && revealState.msUntilStart > 0 && (
                          <span className="font-mono text-[10px] text-emerald-400 font-bold tabular-nums">
                            {pickLocalized(lang, 'Starts in', 'शुरू होने में', 'শুরু হতে বাকি')}{' '}
                            {formatCountdown(revealState.msUntilStart)}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2 text-center">
                      <div className="text-xs font-mono font-bold text-amber-300 tabular-nums">
                        {pickLocalized(
                          lang,
                          `Auto-Revealing in ${formatCountdown(revealState.msUntilUnlock)}`,
                          `${formatCountdown(revealState.msUntilUnlock)} में अपने आप दिखेगा`,
                          `${formatCountdown(revealState.msUntilUnlock)} পর স্বয়ংক্রিয়ভাবে দেখা যাবে`
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 text-left">
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80">
                          <div className="text-[9px] font-mono text-zinc-500 uppercase">Room ID</div>
                          <div className="text-xs font-mono font-bold text-zinc-500 tracking-widest">
                            ••••••••
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80">
                          <div className="text-[9px] font-mono text-zinc-500 uppercase">Password</div>
                          <div className="text-xs font-mono font-bold text-zinc-500 tracking-widest">
                            ••••
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        {pickLocalized(
                          lang,
                          'For anti-cheat security, Room ID & Password unlock automatically 15 minutes before match start.',
                          'सुरक्षा के लिए रूम ID और पासवर्ड मैच से 15 मिनट पहले अपने आप अनलॉक होंगे।',
                          'নিরাপত্তার জন্য ম্যাচ শুরুর ১৫ মিনিট আগে রুম আইডি ও পাসওয়ার্ড স্বয়ংক্রিয়ভাবে আনলক হবে।'
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Team Roster Snapshot */}
                <div className="text-xs font-mono">
                  <span className="text-zinc-500 block mb-1.5">Registered Roster:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(userSlot?.players || []).map((p, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 text-[11px]"
                      >
                        {p.ign} ({p.uid})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer: Screenshot Proof Submission & Push Alert Trigger */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-zinc-400 font-mono">
                  Prize: ₹{tourney.prizePool}
                </span>

                <div className="flex items-center gap-2">
                  {onSimulateRoomAlert && (
                    <button
                      onClick={() => onSimulateRoomAlert(tourney)}
                      title={pickLocalized(
                        lang,
                        'Test Room ID Push Alert',
                        'रूम ID रिलीज का पुश अलर्ट टेस्ट करें',
                        'রুম আইডি পুশ অ্যালার্ট টেস্ট করুন'
                      )}
                      className="py-2 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <span>
                        🔔 {pickLocalized(lang, 'Alert Test', 'अलर्ट टेस्ट', 'অ্যালার্ট টেস্ট')}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => setProofModalTourney(tourney)}
                    className="py-2 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-heading font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Submit Result Proof</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Screenshot Proof Modal */}
      {proofModalTourney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-heading font-bold text-base text-white">Submit Match Result Proof</h3>
                <p className="text-xs text-zinc-400 font-mono">{proofModalTourney.title}</p>
              </div>
              <button
                onClick={() => setProofModalTourney(null)}
                className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white"
              >
                ✕
              </button>
            </div>

            {proofSubmitted ? (
              <div className="text-center py-6 space-y-2">
                <Check className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-heading font-bold text-white text-base">Proof Submitted!</h4>
                <p className="text-xs text-zinc-400">
                  Organizer is verifying your kills. Points & cash will be credited shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleProofSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-zinc-300 block mb-1">
                    Your Total Kills in Match
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={killCount}
                    onChange={(e) => setKillCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-zinc-300 block mb-1">
                    Upload Booyah / Kill Scorecard Screenshot
                  </label>
                  <div className="p-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-950 text-center space-y-2">
                    <Upload className="w-6 h-6 text-amber-500 mx-auto" />
                    <div className="text-xs text-zinc-300">
                      Click to browse or drop match screenshot
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono block">PNG, JPG up to 10MB</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-heading font-bold text-xs tracking-wide shadow-md transition-all"
                >
                  Confirm & Submit Proof
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
