import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Key,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  PlusCircle,
  Trash2,
  Send,
  Lock,
  FileCheck,
  QrCode,
  AlertTriangle,
  LogIn,
  Sparkles,
  Save,
  Upload,
  Wallet,
  Search,
  Plus,
  Minus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Tournament,
  UserProfile,
  DepositRequest,
  WithdrawRequest,
  PaymentSettings,
} from '../types/tournament';
import { Language, pickLocalized } from '../utils/translations';
import { ADMIN_EMAIL } from '../firebase';

interface PendingProof {
  id: string;
  tournamentId: string;
  tournamentTitle: string;
  playerIgn: string;
  playerUid: string;
  kills: number;
  perKillPrize: number;
  totalPrize: number;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface AdminPanelProps {
  tournaments: Tournament[];
  lang: Language;
  user: UserProfile;
  isFirebaseAdmin: boolean;
  firebaseEmail?: string | null;
  onSignInFirebaseAdmin: () => void;
  depositRequests: DepositRequest[];
  withdrawRequests: WithdrawRequest[];
  allUsers: UserProfile[];
  paymentSettings: PaymentSettings;
  onSavePaymentSettings: (settings: PaymentSettings) => Promise<void>;
  onApproveDeposit: (req: DepositRequest) => Promise<void>;
  onRejectDeposit: (req: DepositRequest, reason: string) => Promise<void>;
  onApproveWithdraw: (req: WithdrawRequest) => Promise<void>;
  onRejectWithdraw: (req: WithdrawRequest) => Promise<void>;
  onToggleUserBan: (targetUser: UserProfile) => Promise<void>;
  onAdjustUserWallet: (
    targetUser: UserProfile,
    currency: 'INR' | 'COINS',
    action: 'ADD' | 'DEDUCT',
    amount: number,
    note?: string
  ) => Promise<void>;
  onSeedStarterTournaments: () => Promise<void>;
  onUpdateTournament: (updated: Tournament) => void;
  onDeleteTournament: (id: string) => void;
  onOpenCreateTournament: () => void;
  onReleaseRoomCredentials: (tournament: Tournament, roomId: string, pass: string) => void;
  onDisbursePrize: (amount: number, reason: string) => void;
  onClose: () => void;
  onLogoutAdmin: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  tournaments,
  lang,
  isFirebaseAdmin,
  firebaseEmail,
  onSignInFirebaseAdmin,
  depositRequests,
  withdrawRequests,
  allUsers,
  paymentSettings,
  onSavePaymentSettings,
  onApproveDeposit,
  onRejectDeposit,
  onApproveWithdraw,
  onRejectWithdraw,
  onToggleUserBan,
  onAdjustUserWallet,
  onSeedStarterTournaments,
  onUpdateTournament,
  onDeleteTournament,
  onOpenCreateTournament,
  onReleaseRoomCredentials,
  onDisbursePrize,
  onClose,
  onLogoutAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<
    'tournaments' | 'deposits' | 'withdrawals' | 'wallet-manager' | 'proofs' | 'players'
  >('tournaments');
  const [selectedTourneyForRoom, setSelectedTourneyForRoom] = useState<Tournament | null>(null);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Manage Wallet / Give Coins state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [walletCurrency, setWalletCurrency] = useState<'COINS' | 'INR'>('COINS');
  const [walletAmountInput, setWalletAmountInput] = useState<string>('100');
  const [walletAdminNote, setWalletAdminNote] = useState<string>('');
  const [isAdjustingWallet, setIsAdjustingWallet] = useState(false);

  // Payment QR settings editor state
  const [qrUpiId, setQrUpiId] = useState(paymentSettings.upiId);
  const [qrMerchantName, setQrMerchantName] = useState(paymentSettings.merchantName);
  const [qrInstructions, setQrInstructions] = useState(paymentSettings.instructions);
  const [qrImageUrl, setQrImageUrl] = useState(paymentSettings.qrImageUrl || '');

  useEffect(() => {
    setQrUpiId(paymentSettings.upiId);
    setQrMerchantName(paymentSettings.merchantName);
    setQrInstructions(paymentSettings.instructions);
    setQrImageUrl(paymentSettings.qrImageUrl || '');
  }, [paymentSettings]);

  // Sample proofs review state
  const [pendingProofs, setPendingProofs] = useState<PendingProof[]>([
    {
      id: 'proof_01',
      tournamentId: 'tourney-01',
      tournamentTitle: 'Bermuda Championship Mega Squad',
      playerIgn: 'THUNDER_OP',
      playerUid: '284910284',
      kills: 6,
      perKillPrize: 25,
      totalPrize: 150,
      submittedAt: '10 mins ago',
      status: 'PENDING',
    },
  ]);

  const totalSlotsFilled = tournaments.reduce((acc, t) => acc + t.filledSlots, 0);
  const totalPrizePools = tournaments.reduce((acc, t) => acc + t.prizePool, 0);
  const totalEntryFees = tournaments.reduce((acc, t) => acc + t.entryFee * t.filledSlots, 0);
  const platformRevenue = Math.round(totalEntryFees * 0.15);

  const pendingDepositsCount = depositRequests.filter((d) => d.status === 'PENDING').length;
  const pendingWithdrawsCount = withdrawRequests.filter((w) => w.status === 'PENDING').length;

  const showTempStatus = (msg: string) => {
    setErrorMessage('');
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const showTempError = (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 6000);
  };

  const handleOpenRoomReleaseModal = (tourney: Tournament) => {
    setSelectedTourneyForRoom(tourney);
    setRoomIdInput(tourney.roomId || `FF-${Math.floor(100000 + Math.random() * 900000)}`);
    setPasswordInput(tourney.roomPassword || `${Math.floor(100 + Math.random() * 900)}`);
  };

  const handleConfirmRoomRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTourneyForRoom) return;

    onReleaseRoomCredentials(selectedTourneyForRoom, roomIdInput, passwordInput);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#f97316', '#f59e0b', '#10b981'],
    });
    showTempStatus(
      `Broadcasted Room ID ${roomIdInput} & Pass ${passwordInput} to all ${selectedTourneyForRoom.filledSlots} registered players!`
    );
    setSelectedTourneyForRoom(null);
  };

  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 420;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        setQrImageUrl(compressed);
        showTempStatus('QR image loaded! Click "Save UPI QR" to publish it to all players.');
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveQrSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingId('qr_settings');
    try {
      await onSavePaymentSettings({
        upiId: qrUpiId.trim(),
        merchantName: qrMerchantName.trim(),
        instructions: qrInstructions.trim(),
        ...(qrImageUrl.trim() ? { qrImageUrl: qrImageUrl.trim() } : {}),
      });
      showTempStatus('Updated live UPI QR merchant settings for all players!');
    } catch (err) {
      showTempError(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveDepositClick = async (req: DepositRequest) => {
    setProcessingId(req.id);
    try {
      await onApproveDeposit(req);
      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b'],
      });
      showTempStatus(
        `Approved ₹${req.amount} (UTR: ${req.upiTransactionId}) and credited ${req.userIgn}'s wallet!`
      );
    } catch (err) {
      showTempError(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectDepositClick = async (req: DepositRequest) => {
    setProcessingId(req.id);
    try {
      await onRejectDeposit(req, 'Transaction ID could not be verified');
      showTempStatus(`Rejected deposit request UTR: ${req.upiTransactionId}.`);
    } catch (err) {
      showTempError(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveWithdrawClick = async (req: WithdrawRequest) => {
    setProcessingId(req.id);
    try {
      await onApproveWithdraw(req);
      showTempStatus(`Marked withdrawal ₹${req.amount} to ${req.upiId} as PAID!`);
    } catch (err) {
      showTempError(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectWithdrawClick = async (req: WithdrawRequest) => {
    setProcessingId(req.id);
    try {
      await onRejectWithdraw(req);
      showTempStatus(`Rejected withdrawal request and refunded ₹${req.amount} to ${req.userIgn}.`);
    } catch (err) {
      showTempError(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveProof = (proof: PendingProof) => {
    setPendingProofs((prev) =>
      prev.map((p) => (p.id === proof.id ? { ...p, status: 'APPROVED' } : p))
    );
    onDisbursePrize(proof.totalPrize, `Prize approved for ${proof.kills} kills in ${proof.tournamentTitle}`);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    showTempStatus(`Approved ₹${proof.totalPrize} prize for ${proof.playerIgn}!`);
  };

  const handleRejectProof = (proofId: string) => {
    setPendingProofs((prev) =>
      prev.map((p) => (p.id === proofId ? { ...p, status: 'REJECTED' } : p))
    );
    showTempStatus('Rejected result proof.');
  };

  const filteredUsers = allUsers.filter((u) => {
    const q = userSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.username || '').toLowerCase().includes(q) ||
      u.ign.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      u.ffUid.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  const selectedUserForWallet =
    allUsers.find((u) => u.id === selectedUserId) || filteredUsers[0] || allUsers[0] || null;

  const handleWalletAdjustment = async (action: 'ADD' | 'DEDUCT') => {
    if (!selectedUserForWallet) {
      showTempError('Please select a registered user first.');
      return;
    }

    const parsedAmount = Number(walletAmountInput);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      showTempError('Please enter a valid amount greater than 0.');
      return;
    }

    setIsAdjustingWallet(true);
    try {
      await onAdjustUserWallet(
        selectedUserForWallet,
        walletCurrency,
        action,
        parsedAmount,
        walletAdminNote.trim() || undefined
      );
      if (action === 'ADD') {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.65 },
          colors: ['#10b981', '#f59e0b'],
        });
      }
      const unitText = walletCurrency === 'INR' ? `₹${Math.round(parsedAmount)}` : `💎 ${Math.round(parsedAmount)} Coins`;
      showTempStatus(
        `${action === 'ADD' ? 'Added' : 'Deducted'} ${unitText} ${
          action === 'ADD' ? 'to' : 'from'
        } ${selectedUserForWallet.ign} (${selectedUserForWallet.email || selectedUserForWallet.ffUid})!`
      );
      setWalletAdminNote('');
    } catch (err) {
      showTempError(err);
    } finally {
      setIsAdjustingWallet(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Firebase Admin Auth Check Warning Banner */}
      {!isFirebaseAdmin && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-heading font-bold text-amber-300 text-sm">
                {pickLocalized(
                  lang,
                  'Firebase Admin Sign-In Required for Live Database Writes',
                  'Firebase Admin साइन-इन आवश्यक है',
                  'লাইভ ডেটাবেস আপডেটের জন্য Firebase অ্যাডমিন সাইন-ইন প্রয়োজন'
                )}
              </div>
              <p className="text-zinc-300">
                {firebaseEmail
                  ? `Currently signed in as ${firebaseEmail}. Firestore security rules only allow ${ADMIN_EMAIL} to create/delete tournaments or approve UPI deposits.`
                  : `Sign in with Google using ${ADMIN_EMAIL} to enable live Firestore admin writes.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignInFirebaseAdmin}
            className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-heading font-bold text-xs flex items-center gap-1.5 shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign in as {ADMIN_EMAIL}</span>
          </button>
        </div>
      )}

      {/* Admin Top Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-orange-500/40 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center font-bold text-xl shadow-lg shadow-orange-500/10">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-widest">
                  SUPER ADMIN CONSOLE
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                  FIRESTORE LIVE
                </span>
              </div>
              <h2 className="text-2xl font-heading font-extrabold text-white">
                Free Fire Tournament Admin Panel
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenCreateTournament}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-heading font-bold text-xs tracking-wide shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-zinc-950" />
              <span>Create Tournament</span>
            </button>

            <button
              onClick={onClose}
              className="py-2.5 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-heading font-bold text-xs transition-colors"
            >
              Exit Admin
            </button>

            <button
              onClick={onLogoutAdmin}
              className="py-2.5 px-3.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-heading font-bold text-xs flex items-center gap-1.5 transition-colors"
              title="Lock & Logout Admin Session"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Session</span>
            </button>
          </div>
        </div>

        {/* Platform Metrics KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-zinc-800/80">
          <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
            <div className="text-[11px] font-mono text-zinc-400">Live Matches</div>
            <div className="text-xl font-mono font-bold text-white tabular-nums mt-0.5">
              {tournaments.length} Matches
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
            <div className="text-[11px] font-mono text-zinc-400">Pending UPI Deposits</div>
            <div className="text-xl font-mono font-bold text-emerald-400 tabular-nums mt-0.5">
              {pendingDepositsCount} Requests
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
            <div className="text-[11px] font-mono text-zinc-400">Slots Filled / Pools</div>
            <div className="text-xl font-mono font-bold text-amber-400 tabular-nums mt-0.5">
              {totalSlotsFilled} · ₹{totalPrizePools.toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
            <div className="text-[11px] font-mono text-zinc-400">Est. Organizer Fee</div>
            <div className="text-xl font-mono font-bold text-cyan-400 tabular-nums mt-0.5">
              ₹{platformRevenue.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Tickers */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2 font-mono">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2 font-mono">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-x-auto text-xs font-heading font-bold">
        <button
          onClick={() => setActiveTab('tournaments')}
          className={`py-2 px-4 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'tournaments' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
          }`}
        >
          🏆 Tournaments ({tournaments.length})
        </button>

        <button
          onClick={() => setActiveTab('deposits')}
          className={`py-2 px-4 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'deposits' ? 'bg-emerald-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>UPI Deposits ({pendingDepositsCount} Pending)</span>
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`py-2 px-4 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'withdrawals' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>UPI Payouts ({pendingWithdrawsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('wallet-manager')}
          className={`py-2 px-4 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'wallet-manager'
              ? 'bg-emerald-500 text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Manage Wallet / Give Coins</span>
        </button>

        <button
          onClick={() => setActiveTab('proofs')}
          className={`py-2 px-4 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'proofs' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Booyah Proofs ({pendingProofs.filter((p) => p.status === 'PENDING').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('players')}
          className={`py-2 px-4 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'players' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Players ({allUsers.length})</span>
        </button>
      </div>

      {/* TAB 1: MANAGE TOURNAMENTS */}
      {activeTab === 'tournaments' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 font-mono">
            <span>Created tournaments instantly sync to every user&apos;s home screen in real time:</span>
            <div className="flex items-center gap-3">
              {tournaments.length === 0 && (
                <button
                  onClick={onSeedStarterTournaments}
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Starter Scrims</span>
                </button>
              )}
              <button
                onClick={onOpenCreateTournament}
                className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Live Match</span>
              </button>
            </div>
          </div>

          {tournaments.length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-3">
              <p className="text-sm text-zinc-400 font-mono">No tournaments in Firestore yet.</p>
              <button
                onClick={onSeedStarterTournaments}
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-heading font-bold text-xs inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Seed 4 Starter Tournaments</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tournaments.map((tourney) => (
                <div
                  key={tourney.id}
                  className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="font-bold text-amber-400">{tourney.mode}</span>
                      <span className="text-zinc-500">·</span>
                      <span className="text-zinc-300">{tourney.map}</span>
                      <span className="text-zinc-500">·</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tourney.status === 'ROOM_OPEN'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {tourney.status}
                      </span>
                    </div>

                    <h4 className="font-heading font-extrabold text-base sm:text-lg text-white">
                      {tourney.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400">
                      <span>Prize: <strong className="text-white">₹{tourney.prizePool}</strong></span>
                      <span>Entry: <strong className="text-white">{tourney.entryFee === 0 ? 'FREE' : `₹${tourney.entryFee}`}</strong></span>
                      <span>Slots: <strong className="text-amber-400">{tourney.filledSlots}/{tourney.totalSlots}</strong></span>
                      <span>Time: <strong className="text-zinc-300">{tourney.startTime}</strong></span>
                    </div>

                    {tourney.roomId && (
                      <div className="flex items-center gap-3 text-xs font-mono pt-1 text-zinc-300">
                        <span className="text-zinc-500">Active Room:</span>
                        <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-white font-bold">
                          ID: {tourney.roomId}
                        </span>
                        <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-amber-400 font-bold">
                          Pass: {tourney.roomPassword}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <button
                      onClick={() => handleOpenRoomReleaseModal(tourney)}
                      className="py-2 px-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-heading font-bold text-xs tracking-wide shadow-md flex items-center gap-1.5 transition-all"
                    >
                      <Key className="w-3.5 h-3.5 text-zinc-950" />
                      <span>Release Room ID & Pass</span>
                    </button>

                    <button
                      onClick={() => {
                        onUpdateTournament({
                          ...tourney,
                          status: tourney.status === 'COMPLETED' ? 'UPCOMING' : 'COMPLETED',
                        });
                        showTempStatus(`Updated status of "${tourney.title}"`);
                      }}
                      className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-heading font-bold text-xs transition-colors"
                    >
                      {tourney.status === 'COMPLETED' ? 'Reopen' : 'Mark Finished'}
                    </button>

                    <button
                      onClick={() => {
                        onDeleteTournament(tourney.id);
                        showTempStatus(`Deleted "${tourney.title}".`);
                      }}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                      title="Delete tournament"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANUAL UPI DEPOSIT APPROVALS & QR SETTINGS */}
      {activeTab === 'deposits' && (
        <div className="space-y-6">
          {/* Merchant UPI QR Config Card */}
          <form
            onSubmit={handleSaveQrSettings}
            className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <h3 className="font-heading font-bold text-sm text-white">
                  Merchant UPI QR Settings (Shown to Users on Add Money)
                </h3>
              </div>
              <button
                type="submit"
                disabled={processingId === 'qr_settings'}
                className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-heading font-bold text-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save UPI QR</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Admin UPI ID (VPA)</label>
                <input
                  type="text"
                  required
                  value={qrUpiId}
                  onChange={(e) => setQrUpiId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Merchant / Receiver Name</label>
                <input
                  type="text"
                  required
                  value={qrMerchantName}
                  onChange={(e) => setQrMerchantName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Payment Instructions</label>
                <input
                  type="text"
                  required
                  value={qrInstructions}
                  onChange={(e) => setQrInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Personal UPI QR Code Image Upload / URL */}
            <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-[11px] font-mono text-zinc-400 block">
                  Personal UPI QR Code Image (FamApp QR active by default — upload to replace)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-heading font-bold flex items-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Upload QR Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrImageUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setQrUpiId('9612352811@fam');
                      setQrMerchantName('Subham Das');
                      setQrInstructions(
                        'Scan the FamApp QR code or pay to 9612352811@fam, then enter your 12-digit UTR / Transaction ID below.'
                      );
                      setQrImageUrl(
                        '/assets/aistudio/Screenshot_2026-11-13-08-48-19-19_ba41e9a642e6e0e2b03656bfbbffd6e4_3f41749b.jpg'
                      );
                      showTempStatus('Loaded Subham Das FamApp QR preset! Click "Save UPI QR" to publish.');
                    }}
                    className="py-1.5 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-mono"
                  >
                    Use Subham Das FamApp QR
                  </button>
                  {qrImageUrl && (
                    <button
                      type="button"
                      onClick={() => setQrImageUrl('')}
                      className="py-1.5 px-3 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-mono"
                    >
                      Remove Custom QR
                    </button>
                  )}
                </div>
              </div>
              {qrImageUrl && (
                <div className="p-1.5 rounded-xl bg-white w-20 h-20 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={qrImageUrl}
                    alt="Personal UPI QR Preview"
                    className="w-full h-full object-contain rounded"
                  />
                </div>
              )}
            </div>
          </form>

          {/* Deposit Requests Queue */}
          <div className="space-y-3">
            <div className="text-xs font-mono text-zinc-400">
              Verify UTR / UPI Transaction IDs in your bank/UPI app before approving:
            </div>

            {depositRequests.length === 0 ? (
              <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-xs font-mono text-zinc-500">
                No manual UPI deposit requests submitted yet.
              </div>
            ) : (
              depositRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="font-bold text-amber-400">{req.userIgn}</span>
                      <span className="text-zinc-500">·</span>
                      <span className="text-zinc-300">{req.userName}</span>
                      <span className="text-zinc-500">·</span>
                      <span className="text-zinc-400">{req.userEmail}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-lg font-mono font-bold text-emerald-400">
                        ₹{req.amount}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-white">
                        UTR: <strong className="text-cyan-400">{req.upiTransactionId}</strong>
                      </span>
                      {req.payerUpiId && (
                        <span className="text-[11px] font-mono text-zinc-400">
                          From: {req.payerUpiId}
                        </span>
                      )}
                    </div>

                    {req.createdAtLabel && (
                      <div className="text-[10px] font-mono text-zinc-500">
                        Submitted: {req.createdAtLabel}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === 'PENDING' ? (
                      <>
                        <button
                          type="button"
                          disabled={processingId === req.id}
                          onClick={() => handleApproveDepositClick(req)}
                          className="py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-heading font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-zinc-950" />
                          <span>Approve & Credit ₹{req.amount}</span>
                        </button>
                        <button
                          type="button"
                          disabled={processingId === req.id}
                          onClick={() => handleRejectDepositClick(req)}
                          className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 font-heading font-bold text-xs transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {req.status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: WITHDRAWAL REQUESTS */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="text-xs text-zinc-400 font-mono">
            Player cash withdrawal requests pending UPI transfer:
          </div>

          {withdrawRequests.length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-xs font-mono text-zinc-500">
              No withdrawal requests yet.
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawRequests.map((wd) => (
                <div
                  key={wd.id}
                  className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="font-bold text-white">{wd.userIgn}</span>
                      <span className="text-zinc-500">·</span>
                      <span className="text-zinc-400">{wd.userName}</span>
                    </div>

                    <div className="text-base font-mono font-bold text-emerald-400">
                      Amount: ₹{wd.amount}
                    </div>

                    <div className="text-xs font-mono text-zinc-300">
                      Target UPI ID: <strong className="text-amber-400">{wd.upiId}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {wd.status === 'PENDING' ? (
                      <>
                        <button
                          disabled={processingId === wd.id}
                          onClick={() => handleApproveWithdrawClick(wd)}
                          className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-heading font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-zinc-950" />
                          <span>Mark Paid ₹{wd.amount}</span>
                        </button>
                        <button
                          disabled={processingId === wd.id}
                          onClick={() => handleRejectWithdrawClick(wd)}
                          className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 font-heading font-bold text-xs transition-colors"
                        >
                          Reject & Refund
                        </button>
                      </>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border ${
                          wd.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}
                      >
                        {wd.status === 'COMPLETED' ? 'PAID VIA UPI' : 'REJECTED & REFUNDED'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3B: MANAGE WALLET / GIVE COINS */}
      {activeTab === 'wallet-manager' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>Manage Player Wallet &amp; Give Coins</span>
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Search any registered player by username, IGN, Free Fire UID, or email to add or deduct coins/balance instantly.
              </p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search username, FF UID, IGN or email..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Registered Users List */}
            <div className="lg:col-span-7 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
                <span>
                  Registered Players ({filteredUsers.length}
                  {userSearchQuery.trim() ? ` matching "${userSearchQuery.trim()}"` : ''})
                </span>
                <span>Click a player to manage wallet</span>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-xs font-mono text-zinc-500">
                  {allUsers.length === 0
                    ? 'No registered players loaded yet.'
                    : 'No registered user matched your search query.'}
                </div>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {filteredUsers.map((player) => {
                    const isSelected = selectedUserForWallet?.id === player.id;
                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => setSelectedUserId(player.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/60 shadow-lg shadow-emerald-500/5'
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                            <span className="font-bold text-white text-sm truncate">
                              {player.ign}
                            </span>
                            {player.username && (
                              <span className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-cyan-400 text-[10px]">
                                @{player.username}
                              </span>
                            )}
                            <span className="text-zinc-500">·</span>
                            <span className="text-zinc-400">UID: {player.ffUid}</span>
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono truncate">
                            {player.name}
                            {player.email ? ` · ${player.email}` : ''}
                          </div>
                        </div>

                        <div className="text-right shrink-0 font-mono space-y-0.5">
                          <div className="text-xs font-bold text-emerald-400 tabular-nums">
                            ₹{player.walletBalance}
                          </div>
                          <div className="text-xs font-bold text-amber-400 tabular-nums">
                            💎 {player.coinsBalance}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Add Coins / Deduct Action Panel */}
            <div className="lg:col-span-5">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 sticky top-20">
                {selectedUserForWallet ? (
                  <>
                    <div className="pb-3 border-b border-zinc-800 space-y-2">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                        Selected Player Account
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-heading font-bold text-lg text-white truncate">
                            {selectedUserForWallet.ign}
                          </div>
                          <div className="text-xs font-mono text-zinc-400 truncate">
                            {selectedUserForWallet.username ? `@${selectedUserForWallet.username} · ` : ''}
                            UID: {selectedUserForWallet.ffUid}
                          </div>
                          {selectedUserForWallet.email && (
                            <div className="text-[11px] font-mono text-zinc-500 truncate">
                              {selectedUserForWallet.email}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                          <div className="text-[10px] font-mono text-zinc-400">Booyah Coins</div>
                          <div className="text-lg font-mono font-bold text-amber-400 tabular-nums">
                            💎 {selectedUserForWallet.coinsBalance}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                          <div className="text-[10px] font-mono text-zinc-400">Real Cash (INR)</div>
                          <div className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
                            ₹{selectedUserForWallet.walletBalance}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Currency Type Selector */}
                    <div>
                      <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1.5">
                        1. Select Balance Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setWalletCurrency('COINS')}
                          className={`py-2 px-3 rounded-xl text-xs font-heading font-bold border transition-all ${
                            walletCurrency === 'COINS'
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          💎 Booyah Coins
                        </button>
                        <button
                          type="button"
                          onClick={() => setWalletCurrency('INR')}
                          className={`py-2 px-3 rounded-xl text-xs font-heading font-bold border transition-all ${
                            walletCurrency === 'INR'
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          ₹ Cash Wallet (INR)
                        </button>
                      </div>
                    </div>

                    {/* Amount Input + Quick Presets */}
                    <div>
                      <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1.5">
                        2. Enter {walletCurrency === 'COINS' ? 'Coins' : 'Cash (₹)'} Amount
                      </label>
                      <div className="grid grid-cols-5 gap-1.5 mb-2">
                        {[50, 100, 250, 500, 1000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setWalletAmountInput(String(amt))}
                            className={`py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-colors ${
                              walletAmountInput === String(amt)
                                ? 'bg-amber-500 text-zinc-950 border-amber-400'
                                : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                            }`}
                          >
                            {amt}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={1000000}
                        value={walletAmountInput}
                        onChange={(e) => setWalletAmountInput(e.target.value)}
                        placeholder="Enter amount (e.g. 200)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Optional Passbook Note */}
                    <div>
                      <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                        3. Reason / Passbook Note (Optional)
                      </label>
                      <input
                        type="text"
                        maxLength={120}
                        value={walletAdminNote}
                        onChange={(e) => setWalletAdminNote(e.target.value)}
                        placeholder={
                          walletCurrency === 'COINS'
                            ? 'e.g. Giveaway / Tournament Bonus'
                            : 'e.g. Manual Top-up / Prize Credit'
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Add Coins / Deduct Action Buttons */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        disabled={isAdjustingWallet}
                        onClick={() => handleWalletAdjustment('ADD')}
                        className="py-3 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 text-zinc-950 font-heading font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>
                          {isAdjustingWallet
                            ? 'Updating...'
                            : walletCurrency === 'COINS'
                              ? 'Add Coins'
                              : 'Add Balance'}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={isAdjustingWallet}
                        onClick={() => handleWalletAdjustment('DEDUCT')}
                        className="py-3 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 active:scale-95 disabled:opacity-50 text-red-400 font-heading font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5"
                      >
                        <Minus className="w-4 h-4" />
                        <span>Deduct</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-10 text-center text-xs font-mono text-zinc-500">
                    Select a registered user from the list to manage their wallet balance or give coins.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REVIEW BOOYAH PROOFS */}
      {activeTab === 'proofs' && (
        <div className="space-y-4">
          <div className="text-xs text-zinc-400 font-mono">
            Review screenshots submitted by players and disburse kill rewards:
          </div>

          <div className="space-y-3">
            {pendingProofs.map((proof) => (
              <div
                key={proof.id}
                className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="font-bold text-amber-400">{proof.playerIgn}</span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-zinc-400">UID: {proof.playerUid}</span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-zinc-500">{proof.submittedAt}</span>
                  </div>

                  <h4 className="font-heading font-bold text-white text-base">
                    {proof.tournamentTitle}
                  </h4>

                  <div className="text-xs font-mono text-zinc-300">
                    Claimed Kills: <strong className="text-red-400 font-bold">{proof.kills} Kills</strong> (Rate: ₹{proof.perKillPrize}/kill)
                    <span className="ml-3 font-bold text-emerald-400">Payable: ₹{proof.totalPrize}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {proof.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleApproveProof(proof)}
                        className="py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-heading font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-zinc-950" />
                        <span>Approve & Pay ₹{proof.totalPrize}</span>
                      </button>

                      <button
                        onClick={() => handleRejectProof(proof.id)}
                        className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 font-heading font-bold text-xs transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${
                        proof.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {proof.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PLAYERS DIRECTORY */}
      {activeTab === 'players' && (
        <div className="space-y-4">
          <div className="text-xs text-zinc-400 font-mono">
            Registered Firebase players directory, quick wallet access &amp; anti-cheat ban enforcement:
          </div>

          {allUsers.length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-xs font-mono text-zinc-500">
              No registered users loaded yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {allUsers.map((player) => (
                <div
                  key={player.id}
                  className="p-3.5 sm:p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                      <strong className="text-white text-sm">{player.ign}</strong>
                      {player.username && (
                        <span className="text-cyan-400">@{player.username}</span>
                      )}
                      <span className="text-zinc-500">·</span>
                      <span className="text-zinc-400">UID: {player.ffUid}</span>
                      {player.email && (
                        <>
                          <span className="text-zinc-500">·</span>
                          <span className="text-zinc-400">{player.email}</span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      Balance: <strong className="text-emerald-400">₹{player.walletBalance}</strong>
                      <span className="ml-3 text-amber-400">Coins: 💎{player.coinsBalance}</span>
                      <span className="ml-3">Matches: {player.matchesPlayed}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUserId(player.id);
                        setActiveTab('wallet-manager');
                      }}
                      className="py-1.5 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Manage Wallet</span>
                    </button>

                    <button
                      onClick={() => onToggleUserBan(player)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all ${
                        player.isBanned
                          ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                      }`}
                    >
                      {player.isBanned ? 'Unban Player' : 'Ban Player'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RELEASE ROOM ID & PASS MODAL */}
      {selectedTourneyForRoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedTourneyForRoom(null)}
        >
          <div
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-orange-400 font-bold uppercase">
                  Broadcast Room Credentials
                </span>
                <h3 className="font-heading font-bold text-base text-white">
                  {selectedTourneyForRoom.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTourneyForRoom(null)}
                className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmRoomRelease} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-300 block mb-1">
                  Custom Room ID (Free Fire)
                </label>
                <input
                  type="text"
                  required
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  placeholder="e.g. FF-882019"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-300 block mb-1">
                  Custom Room Password
                </label>
                <input
                  type="text"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="e.g. 772"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300 leading-relaxed">
                ⚡ Clicking broadcast updates Firestore in real time and sends a live notification to all participants.
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-heading font-bold text-sm tracking-wide shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4 text-zinc-950" />
                <span>Broadcast Live Push Alert</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
