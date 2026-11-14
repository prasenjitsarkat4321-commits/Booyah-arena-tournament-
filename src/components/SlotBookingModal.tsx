import React, { useState, useEffect } from 'react';
import { X, Users, Shield, CheckCircle, AlertTriangle, Wallet, Plus, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Tournament, UserProfile } from '../types/tournament';
import { translations, Language } from '../utils/translations';

interface SlotBookingModalProps {
  tournament: Tournament | null;
  initialSlot?: number;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  user: UserProfile;
  onConfirmBooking: (
    tournamentId: string,
    slotNumber: number,
    teamName: string,
    players: { ign: string; uid: string }[],
    entryFee: number,
    currency: 'INR' | 'COINS'
  ) => Promise<void>;
  onOpenWallet: () => void;
  onGoToMyMatches?: () => void;
}

export const SlotBookingModal: React.FC<SlotBookingModalProps> = ({
  tournament,
  initialSlot,
  isOpen,
  onClose,
  lang,
  user,
  onConfirmBooking,
  onOpenWallet,
  onGoToMyMatches,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [teamName, setTeamName] = useState<string>('');
  const [player1Ign, setPlayer1Ign] = useState<string>('');
  const [player1Uid, setPlayer1Uid] = useState<string>('');
  const [player2Ign, setPlayer2Ign] = useState<string>('');
  const [player2Uid, setPlayer2Uid] = useState<string>('');
  const [player3Ign, setPlayer3Ign] = useState<string>('');
  const [player3Uid, setPlayer3Uid] = useState<string>('');
  const [player4Ign, setPlayer4Ign] = useState<string>('');
  const [player4Uid, setPlayer4Uid] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && tournament) {
      // Find first vacant slot or use initialSlot
      const vacantSlot = tournament.slots.find((s) => !s.isLocked && s.players.length === 0);
      setSelectedSlot(initialSlot || (vacantSlot ? vacantSlot.slotNumber : 1));
      setPlayer1Ign(user.ign);
      setPlayer1Uid(user.ffUid);
      setTeamName(`${user.ign}'s Squad`);
      setError('');
      setIsSuccess(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tournament?.id, initialSlot]);

  if (!isOpen || !tournament) return null;

  const t = translations[lang];
  const requiredBalance = tournament.entryFee;
  const currentBalance = tournament.currency === 'INR' ? user.walletBalance : user.coinsBalance;
  const hasSufficientFunds = currentBalance >= requiredBalance;

  const handleBooking = async () => {
    setError('');

    if (!player1Ign.trim() || !player1Uid.trim()) {
      setError('Please provide Player 1 In-Game Name and UID');
      return;
    }

    if (tournament.mode === 'DUO' && (!player2Ign.trim() || !player2Uid.trim())) {
      setError('Please enter Duo teammate details (IGN and UID)');
      return;
    }

    if (tournament.mode === 'SQUAD') {
      if (!player2Ign.trim() || !player3Ign.trim() || !player4Ign.trim()) {
        setError('Please enter all 4 Squad players details');
        return;
      }
    }

    if (!hasSufficientFunds) {
      setError(`Insufficient ${tournament.currency === 'INR' ? 'wallet' : 'coins'} balance. Please top up.`);
      return;
    }

    const players = [{ ign: player1Ign, uid: player1Uid }];
    if (tournament.mode === 'DUO' || tournament.mode === 'SQUAD' || tournament.mode === 'CLASH_SQUAD') {
      players.push({ ign: player2Ign || `${player1Ign}_2`, uid: player2Uid || '19203810' });
    }
    if (tournament.mode === 'SQUAD' || tournament.mode === 'CLASH_SQUAD') {
      players.push({ ign: player3Ign || `${player1Ign}_3`, uid: player3Uid || '19203811' });
      players.push({ ign: player4Ign || `${player1Ign}_4`, uid: player4Uid || '19203812' });
    }

    setIsSubmitting(true);
    try {
      await onConfirmBooking(
        tournament.id,
        selectedSlot,
        teamName || `${user.ign} Team`,
        players,
        tournament.entryFee,
        tournament.currency
      );

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#f97316', '#10b981', '#38bdf8'],
      });

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book slot. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div>
            <div className="text-xs font-mono text-amber-400 font-bold uppercase">
              Slot Registration · {tournament.mode}
            </div>
            <h3 className="text-lg font-heading font-bold text-white line-clamp-1">
              {lang === 'hi' ? tournament.titleHi : tournament.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {isSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xl font-heading font-extrabold text-white">
                  Slot #{selectedSlot} Confirmed!
                </h4>
                <p className="text-xs text-zinc-300 max-w-xs mx-auto leading-relaxed">
                  {tournament.entryFee > 0
                    ? `${tournament.currency === 'INR' ? `₹${tournament.entryFee}` : `💎 ${tournament.entryFee}`} deducted from your wallet. Room ID & Password unlock 15 minutes before match start in My Matches.`
                    : 'Free slot confirmed! Room ID & Password unlock 15 minutes before match start in My Matches.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-heading font-bold"
                >
                  Close
                </button>
                {onGoToMyMatches && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onGoToMyMatches();
                    }}
                    className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-heading font-bold shadow-md shadow-amber-500/20"
                  >
                    Go to My Matches →
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Slot Selector */}
              <div>
                <label className="text-xs font-mono font-semibold text-zinc-300 block mb-2">
                  {t.selectSlot}
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {tournament.slots.map((slot) => {
                    const isOccupied = slot.isLocked || slot.players.length > 0;
                    const isSelected = selectedSlot === slot.slotNumber;
                    return (
                      <button
                        key={slot.slotNumber}
                        type="button"
                        disabled={isOccupied}
                        onClick={() => setSelectedSlot(slot.slotNumber)}
                        className={`py-2 px-1 rounded-lg text-xs font-mono font-bold transition-all ${
                          isOccupied
                            ? 'bg-zinc-950 text-zinc-600 border border-zinc-800/60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400'
                            : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700'
                        }`}
                      >
                        #{slot.slotNumber}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Team Name (if squad or duo) */}
              {(tournament.mode === 'SQUAD' || tournament.mode === 'DUO' || tournament.mode === 'CLASH_SQUAD') && (
                <div>
                  <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1">
                    Team / Clan Name
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Phoenix Kings"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Player 1 Details */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono font-semibold text-amber-400">
                  <span>Player 1 (Team Leader)</span>
                  <span className="text-[10px] text-emerald-400">Verified</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">In-Game Name (IGN)</label>
                    <input
                      type="text"
                      value={player1Ign}
                      onChange={(e) => setPlayer1Ign(e.target.value)}
                      placeholder="Free Fire IGN"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Free Fire UID</label>
                    <input
                      type="text"
                      value={player1Uid}
                      onChange={(e) => setPlayer1Uid(e.target.value)}
                      placeholder="e.g. 284910284"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Duo/Squad Teammates */}
              {(tournament.mode === 'DUO' || tournament.mode === 'SQUAD' || tournament.mode === 'CLASH_SQUAD') && (
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="text-xs font-mono font-semibold text-zinc-300">
                    Teammate 2
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={player2Ign}
                      onChange={(e) => setPlayer2Ign(e.target.value)}
                      placeholder="Teammate 2 IGN"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      value={player2Uid}
                      onChange={(e) => setPlayer2Uid(e.target.value)}
                      placeholder="Teammate 2 UID"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {(tournament.mode === 'SQUAD' || tournament.mode === 'CLASH_SQUAD') && (
                <>
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="text-xs font-mono font-semibold text-zinc-300">
                      Teammate 3 & 4
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={player3Ign}
                        onChange={(e) => setPlayer3Ign(e.target.value)}
                        placeholder="Teammate 3 IGN"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                      <input
                        type="text"
                        value={player4Ign}
                        onChange={(e) => setPlayer4Ign(e.target.value)}
                        placeholder="Teammate 4 IGN"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Wallet Deduction Summary */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400">Entry Fee:</span>
                  <span className="font-bold text-white tabular-nums">
                    {tournament.entryFee === 0
                      ? 'FREE'
                      : tournament.currency === 'INR'
                        ? `₹${tournament.entryFee}`
                        : `💎 ${tournament.entryFee}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400">
                    {tournament.currency === 'INR' ? 'Available Wallet:' : 'Available Coins:'}
                  </span>
                  <span className={`font-bold tabular-nums ${hasSufficientFunds ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tournament.currency === 'INR' ? `₹${user.walletBalance}` : `💎 ${user.coinsBalance}`}
                  </span>
                </div>
                {!hasSufficientFunds && (
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-red-400">Low Balance</span>
                    <button
                      type="button"
                      onClick={onOpenWallet}
                      className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Money Instantly</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isSuccess && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-heading font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!hasSufficientFunds || isSubmitting}
              onClick={handleBooking}
              className={`py-2.5 px-6 rounded-xl text-xs font-heading font-bold tracking-wide transition-all shadow-md ${
                hasSufficientFunds && !isSubmitting
                  ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20 active:scale-95'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Booking Slot...' : `Confirm Slot #${selectedSlot}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
