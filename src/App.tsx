import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Trophy,
  Search,
  Flame,
  ShieldCheck,
  Ticket,
  BarChart3,
  Wallet,
  ChevronRight,
  ShieldAlert,
  Lock,
  X,
  Radio,
  User,
  Gift,
} from 'lucide-react';
import {
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  runTransaction,
  writeBatch,
  increment,
  Timestamp,
} from 'firebase/firestore';

import {
  auth,
  db,
  googleProvider,
  ADMIN_EMAIL,
  OperationType,
  handleFirestoreError,
} from './firebase';

import {
  Tournament,
  UserProfile,
  Transaction,
  MatchResult,
  AppNotification,
  DepositRequest,
  WithdrawRequest,
  PaymentSettings,
  ReferralRecord,
} from './types/tournament';
import { MOCK_TOURNAMENTS, MOCK_LEADERBOARDS } from './data/mockTournaments';
import { translations, Language, pickLocalized } from './utils/translations';
import {
  captureUrlBootIntent,
  clearSavedIncomingReferralCode,
  generateUniqueReferralCode,
  getSavedIncomingReferralCode,
  REFERRAL_REWARD_CASH,
  REFERRAL_REWARD_COINS,
} from './utils/appLinks';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { TournamentCard } from './components/TournamentCard';
import { TournamentDetailsModal } from './components/TournamentDetailsModal';
import { SlotBookingModal } from './components/SlotBookingModal';
import { WalletModal } from './components/WalletModal';
import { HostTournamentModal } from './components/HostTournamentModal';
import { MyMatchesView } from './components/MyMatchesView';
import { LeaderboardView } from './components/LeaderboardView';
import { DailyRewardModal } from './components/DailyRewardModal';
import { RulesModal } from './components/RulesModal';
import { NotificationToast } from './components/NotificationToast';
import { NotificationCenter } from './components/NotificationCenter';
import { AdminPanel } from './components/AdminPanel';
import { AdminAuthModal } from './components/AdminAuthModal';
import { AuthModal } from './components/AuthModal';
import { AuthLandingView } from './components/AuthLandingView';
import { PublishModal } from './components/PublishModal';
import { UserProfileView } from './components/UserProfileView';
import { WalletPageView } from './components/WalletPageView';
import { RulesPageView } from './components/RulesPageView';
import { ReferAndEarnView } from './components/ReferAndEarnView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { playRoomReleasedSound } from './utils/audio';

const GUEST_USER: UserProfile = {
  id: 'guest',
  name: 'Guest Player',
  ign: 'Guest_Player',
  ffUid: '00000000',
  walletBalance: 0,
  coinsBalance: 50,
  matchesPlayed: 0,
  totalKills: 0,
  booyahs: 0,
  joinedTournamentIds: [],
  claimedDailyRewardDate: '',
  role: 'player',
  isBanned: false,
};

export const DEFAULT_FAMAPP_QR_PATH =
  '/assets/aistudio/Screenshot_2026-11-13-08-48-19-19_ba41e9a642e6e0e2b03656bfbbffd6e4_3f41749b.jpg';

const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  upiId: '9612352811@fam',
  merchantName: 'Subham Das',
  instructions:
    'Scan the FamApp QR code or pay to 9612352811@fam, then enter your 12-digit UTR / Transaction ID below.',
  qrImageUrl: DEFAULT_FAMAPP_QR_PATH,
};

const INITIAL_NOTIFICATIONS: AppNotification[] = [];

function formatTimestampLabel(ts: unknown): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toLocaleString();
  }
  return 'Just now';
}

function sanitizeTournamentForFirestore(
  tourney: Tournament,
  createdByUid: string,
  isCreate: boolean
) {
  const cleanSlots = tourney.slots.map((s) => ({
    slotNumber: s.slotNumber,
    ...(s.teamName ? { teamName: s.teamName } : {}),
    isLocked: Boolean(s.isLocked),
    players: s.players.map((p) => ({
      ign: p.ign,
      uid: p.uid,
      ...(p.avatar ? { avatar: p.avatar } : {}),
    })),
  }));

  return {
    id: tourney.id,
    title: tourney.title.slice(0, 120),
    titleHi: tourney.titleHi.slice(0, 120),
    mode: tourney.mode,
    map: tourney.map,
    bannerImage: tourney.bannerImage,
    prizePool: tourney.prizePool,
    currency: tourney.currency,
    entryFee: tourney.entryFee,
    perKillPrize: tourney.perKillPrize,
    firstPlacePrize: tourney.firstPlacePrize,
    secondPlacePrize: tourney.secondPlacePrize,
    thirdPlacePrize: tourney.thirdPlacePrize,
    totalSlots: tourney.totalSlots,
    filledSlots: tourney.filledSlots,
    startTime: tourney.startTime,
    ...(tourney.roomId ? { roomId: tourney.roomId } : {}),
    ...(tourney.roomPassword ? { roomPassword: tourney.roomPassword } : {}),
    roomUnlocksAt: tourney.roomUnlocksAt,
    status: tourney.status,
    organizer: tourney.organizer.slice(0, 80),
    createdByUid: tourney.createdByUid || createdByUid,
    isVerified: Boolean(tourney.isVerified),
    ...(tourney.isFeatured !== undefined ? { isFeatured: Boolean(tourney.isFeatured) } : {}),
    deviceType: tourney.deviceType,
    gunAttributes: Boolean(tourney.gunAttributes),
    visibility: 'PUBLIC' as const,
    slots: cleanSlots,
    rules: tourney.rules.slice(0, 20),
    ...(isCreate ? { createdAt: serverTimestamp() } : {}),
    updatedAt: serverTimestamp(),
  };
}

export default function App() {
  const [bootIntent] = useState(() => captureUrlBootIntent());
  const [lang, setLang] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<
    'tournaments' | 'my-matches' | 'leaderboard' | 'wallet' | 'rules' | 'refer' | 'admin' | 'profile'
  >(bootIntent.targetTab || 'tournaments');

  // Firebase Auth State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Live Firestore State
  const [user, setUser] = useState<UserProfile>(GUEST_USER);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentsLoaded, setTournamentsLoaded] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [adminDepositRequests, setAdminDepositRequests] = useState<DepositRequest[]>([]);
  const [adminWithdrawRequests, setAdminWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [adminAllUsers, setAdminAllUsers] = useState<UserProfile[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [leaderboards] = useState<MatchResult[]>(MOCK_LEADERBOARDS);

  // Notifications (local alert feed for live room releases)
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const previousRoomStatesRef = useRef<Record<string, string | undefined>>({});

  // Filters
  const [filterMode, setFilterMode] = useState<'ALL' | 'SQUAD' | 'SOLO' | 'DUO' | 'FREE' | 'MEGA'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Alert States
  const [selectedTourneyForDetails, setSelectedTourneyForDetails] = useState<Tournament | null>(null);
  const [selectedTourneyForBooking, setSelectedTourneyForBooking] = useState<Tournament | null>(null);
  const [preselectedSlotNumber, setPreselectedSlotNumber] = useState<number | undefined>(undefined);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isHostOpen, setIsHostOpen] = useState(false);
  const [isDailyBonusOpen, setIsDailyBonusOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPublishOpen, setIsPublishOpen] = useState(bootIntent.openApkModal);

  // Admin Security & Access Control
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('booyah_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [adminAccessError, setAdminAccessError] = useState('');

  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const isVerifiedSignedIn = Boolean(firebaseUser && (firebaseUser.emailVerified || isEmailVerified));
  const isFirebaseAdmin = Boolean(
    isVerifiedSignedIn &&
      firebaseUser?.email?.toLowerCase() === ADMIN_EMAIL.trim().toLowerCase()
  );

  const ensureReferralCodeIndex = async (uid: string, ign: string, code: string) => {
    try {
      const codeRef = doc(db, 'referralCodes', code);
      const codeSnap = await getDoc(codeRef);
      if (!codeSnap.exists()) {
        await setDoc(codeRef, {
          code,
          ownerUid: uid,
          ownerIgn: ign.slice(0, 40),
          totalUses: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch {
      // Non-fatal if already claimed/created concurrently
    }
  };

  const redeemReferralCodeInternal = async (
    currentUid: string,
    currentIgn: string,
    rawCode: string,
    options?: { silentIfInvalid?: boolean }
  ): Promise<boolean> => {
    const cleanCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanCode || cleanCode.length < 4) {
      if (options?.silentIfInvalid) return false;
      throw new Error('Please enter a valid referral code.');
    }

    // BOOYAH100 is the default fallback promo code (no specific friend referrer)
    if (cleanCode === 'BOOYAH100') {
      if (options?.silentIfInvalid) return false;
      throw new Error('BOOYAH100 is a starter code. Enter a friend\'s personal referral code (e.g., BYH...) to claim the two-way bonus.');
    }

    const codeRef = doc(db, 'referralCodes', cleanCode);
    const codeSnap = await getDoc(codeRef);
    if (!codeSnap.exists()) {
      if (options?.silentIfInvalid) return false;
      throw new Error('Referral code not found. Please verify the code with your friend.');
    }

    const codeData = codeSnap.data();
    const referrerUid = String(codeData.ownerUid || '');
    const referrerIgn = String(codeData.ownerIgn || 'Friend');

    if (!referrerUid || referrerUid === currentUid) {
      if (options?.silentIfInvalid) return false;
      throw new Error('You cannot redeem your own referral code.');
    }

    const referralDocRef = doc(db, 'referrals', currentUid);
    const existingRefSnap = await getDoc(referralDocRef);
    if (existingRefSnap.exists()) {
      if (options?.silentIfInvalid) return false;
      throw new Error('You have already claimed your referral welcome bonus.');
    }

    const currentUserRef = doc(db, 'users', currentUid);
    const currentUserSnap = await getDoc(currentUserRef);
    if (currentUserSnap.exists() && currentUserSnap.data().referralRewardClaimed === true) {
      if (options?.silentIfInvalid) return false;
      throw new Error('Referral welcome bonus has already been claimed on this account.');
    }

    const ts = Date.now();
    const nowLabel = new Date().toLocaleString();
    const batch = writeBatch(db);

    batch.set(referralDocRef, {
      id: currentUid,
      referrerUid,
      referrerIgn: referrerIgn.slice(0, 40),
      referrerCode: cleanCode,
      referredUid: currentUid,
      referredIgn: currentIgn.slice(0, 40),
      referrerBonusCoins: REFERRAL_REWARD_COINS,
      referrerBonusCash: REFERRAL_REWARD_CASH,
      referredBonusCoins: REFERRAL_REWARD_COINS,
      referredBonusCash: REFERRAL_REWARD_CASH,
      status: 'CREDITED',
      createdAt: serverTimestamp(),
    });

    batch.update(codeRef, {
      totalUses: increment(1),
      updatedAt: serverTimestamp(),
    });

    batch.update(currentUserRef, {
      walletBalance: increment(REFERRAL_REWARD_CASH),
      coinsBalance: increment(REFERRAL_REWARD_COINS),
      referredByCode: cleanCode,
      referredByUid: referrerUid,
      referralRewardClaimed: true,
      updatedAt: serverTimestamp(),
    });

    batch.update(doc(db, 'users', referrerUid), {
      walletBalance: increment(REFERRAL_REWARD_CASH),
      coinsBalance: increment(REFERRAL_REWARD_COINS),
      referralCount: increment(1),
      referralEarningsCoins: increment(REFERRAL_REWARD_COINS),
      referralEarningsCash: increment(REFERRAL_REWARD_CASH),
      updatedAt: serverTimestamp(),
    });

    // Passbook entries for both referred user and referrer
    batch.set(doc(db, 'transactions', `tx_${ts}_ref_u_inr`), {
      id: `tx_${ts}_ref_u_inr`,
      userId: currentUid,
      type: 'REFERRAL_BONUS',
      amount: REFERRAL_REWARD_CASH,
      currency: 'INR',
      description: `Referral Welcome Bonus (Code: ${cleanCode})`,
      descriptionHi: `रेफरल वेलकम बोनस (कोड: ${cleanCode})`,
      date: nowLabel,
      status: 'SUCCESS',
      referenceId: cleanCode,
      createdAt: serverTimestamp(),
    });

    batch.set(doc(db, 'transactions', `tx_${ts}_ref_u_cns`), {
      id: `tx_${ts}_ref_u_cns`,
      userId: currentUid,
      type: 'REFERRAL_BONUS',
      amount: REFERRAL_REWARD_COINS,
      currency: 'COINS',
      description: `Referral Welcome Coins (Code: ${cleanCode})`,
      descriptionHi: `रेफरल वेलकम कॉइन्स (कोड: ${cleanCode})`,
      date: nowLabel,
      status: 'SUCCESS',
      referenceId: cleanCode,
      createdAt: serverTimestamp(),
    });

    batch.set(doc(db, 'transactions', `tx_${ts}_ref_r_inr`), {
      id: `tx_${ts}_ref_r_inr`,
      userId: referrerUid,
      type: 'REFERRAL_BONUS',
      amount: REFERRAL_REWARD_CASH,
      currency: 'INR',
      description: `Referral Reward: ${currentIgn} joined with your link`,
      descriptionHi: `रेफरल इनाम: ${currentIgn} आपके लिंक से जुड़े`,
      date: nowLabel,
      status: 'SUCCESS',
      referenceId: currentUid,
      createdAt: serverTimestamp(),
    });

    batch.set(doc(db, 'transactions', `tx_${ts}_ref_r_cns`), {
      id: `tx_${ts}_ref_r_cns`,
      userId: referrerUid,
      type: 'REFERRAL_BONUS',
      amount: REFERRAL_REWARD_COINS,
      currency: 'COINS',
      description: `Referral Bonus Coins: ${currentIgn} joined`,
      descriptionHi: `रेफरल बोनस कॉइन्स: ${currentIgn} जुड़े`,
      date: nowLabel,
      status: 'SUCCESS',
      referenceId: currentUid,
      createdAt: serverTimestamp(),
    });

    try {
      await batch.commit();
      clearSavedIncomingReferralCode();
      try {
        localStorage.setItem(
          `booyah_referral_claimed_${currentUid}`,
          JSON.stringify({ code: cleanCode, referrerIgn, creditedAt: nowLabel })
        );
      } catch {}
      return true;
    } catch (err) {
      if (options?.silentIfInvalid) return false;
      handleFirestoreError(err, OperationType.WRITE, `referrals/${currentUid}`);
      return false;
    }
  };

  const ensureUserProfileExists = async (fbUser: FirebaseUser) => {
    const userDocRef = doc(db, 'users', fbUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        let pendingData: {
          name?: string;
          username?: string;
          ign?: string;
          ffUid?: string;
          mobileNumber?: string;
          referralCode?: string;
        } = {};
        try {
          const raw = localStorage.getItem(`booyah_pending_profile_${fbUser.uid}`);
          if (raw) {
            pendingData = JSON.parse(raw);
            localStorage.removeItem(`booyah_pending_profile_${fbUser.uid}`);
          }
        } catch {}

        const fallbackName =
          pendingData.name ||
          pendingData.username ||
          fbUser.displayName ||
          fbUser.email?.split('@')[0] ||
          'Player';
        const fallbackUsername = (
          pendingData.username ||
          fallbackName.toLowerCase().replace(/[^a-z0-9_]/g, '_') ||
          'player'
        ).slice(0, 40);
        const fallbackIgn = (
          pendingData.ign ||
          fallbackName.replace(/[^a-zA-Z0-9_]/g, '_') ||
          'BOOYAH_OP'
        ).slice(0, 40);
        const fallbackUid =
          pendingData.ffUid || `${Math.floor(10000000 + Math.random() * 90000000)}`;
        const myCode = generateUniqueReferralCode(fallbackIgn, fbUser.uid);
        const incomingRefCode = (
          pendingData.referralCode || getSavedIncomingReferralCode() || ''
        )
          .trim()
          .toUpperCase();

        await setDoc(userDocRef, {
          uid: fbUser.uid,
          email: fbUser.email || '',
          name: fallbackName.slice(0, 80),
          username: fallbackUsername,
          ...(pendingData.mobileNumber ? { mobileNumber: pendingData.mobileNumber } : {}),
          ...(incomingRefCode ? { referralCode: incomingRefCode } : {}),
          myReferralCode: myCode,
          referralRewardClaimed: false,
          referralCount: 0,
          referralEarningsCoins: 0,
          referralEarningsCash: 0,
          ign: fallbackIgn,
          ffUid: fallbackUid,
          walletBalance: 0,
          coinsBalance: 50,
          matchesPlayed: 0,
          totalKills: 0,
          booyahs: 0,
          joinedTournamentIds: [],
          isBanned: false,
          role: 'player',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        try {
          localStorage.setItem(`booyah_my_ref_code_${fbUser.uid}`, myCode);
        } catch {}

        await ensureReferralCodeIndex(fbUser.uid, fallbackIgn, myCode);

        if (incomingRefCode && incomingRefCode !== 'BOOYAH100') {
          await redeemReferralCodeInternal(fbUser.uid, fallbackIgn, incomingRefCode, {
            silentIfInvalid: true,
          });
        }
      } else {
        const existingData = snap.data();
        const existingIgn = String(existingData.ign || 'Player');
        let myCode = existingData.myReferralCode as string | undefined;

        if (!myCode) {
          myCode = generateUniqueReferralCode(existingIgn, fbUser.uid);
          await updateDoc(userDocRef, {
            myReferralCode: myCode,
            referralCount: Number(existingData.referralCount || 0),
            referralEarningsCoins: Number(existingData.referralEarningsCoins || 0),
            referralEarningsCash: Number(existingData.referralEarningsCash || 0),
            referralRewardClaimed: Boolean(existingData.referralRewardClaimed),
            updatedAt: serverTimestamp(),
          });
        }

        try {
          localStorage.setItem(`booyah_my_ref_code_${fbUser.uid}`, myCode);
        } catch {}

        await ensureReferralCodeIndex(fbUser.uid, existingIgn, myCode);

        const incomingRefCode = getSavedIncomingReferralCode();
        if (incomingRefCode && !existingData.referralRewardClaimed) {
          await redeemReferralCodeInternal(fbUser.uid, existingIgn, incomingRefCode, {
            silentIfInvalid: true,
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}`);
    }
  };

  // 1. Firebase Auth Listener & User Profile Provisioning
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      setIsEmailVerified(Boolean(fbUser?.emailVerified));
      setAuthReady(true);

      if (!fbUser) {
        setUser(GUEST_USER);
        setTransactions([]);
        setReferrals([]);
        setDepositRequests([]);
        setWithdrawRequests([]);
        setLang('en');
        return;
      }

      if (!fbUser.emailVerified) {
        setLang('en');
        return;
      }

      try {
        const saved = localStorage.getItem(`booyah_lang_${fbUser.uid}`);
        if (saved === 'en' || saved === 'hi' || saved === 'bn') {
          setLang(saved);
        } else {
          setLang('en');
        }
      } catch {
        setLang('en');
      }

      await ensureUserProfileExists(fbUser);
    });

    return () => unsubAuth();
  }, []);

  const handleChangeLanguage = (nextLang: Language) => {
    setLang(nextLang);
    if (firebaseUser?.uid) {
      try {
        localStorage.setItem(`booyah_lang_${firebaseUser.uid}`, nextLang);
      } catch {}
    }
  };

  const handleVerificationRefreshed = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    const refreshed = auth.currentUser;
    setIsEmailVerified(Boolean(refreshed.emailVerified));
    if (refreshed.emailVerified) {
      await ensureUserProfileExists(refreshed);
    }
  };

  // 2. Real-time Firestore listener for User Profile, Transactions & Deposit Requests
  useEffect(() => {
    if (!authReady || !firebaseUser || !isVerifiedSignedIn) return;

    const uid = firebaseUser.uid;

    const unsubUser = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setUser({
            id: uid,
            email: d.email || firebaseUser.email || '',
            name: d.name || 'Player',
            username: d.username || undefined,
            mobileNumber: d.mobileNumber || undefined,
            referralCode: d.referralCode || undefined,
            myReferralCode:
              d.myReferralCode || generateUniqueReferralCode(d.ign || d.name || 'PLY', uid),
            referredByCode: d.referredByCode || undefined,
            referredByUid: d.referredByUid || undefined,
            referralRewardClaimed: Boolean(d.referralRewardClaimed),
            referralCount: typeof d.referralCount === 'number' ? d.referralCount : 0,
            referralEarningsCoins:
              typeof d.referralEarningsCoins === 'number' ? d.referralEarningsCoins : 0,
            referralEarningsCash:
              typeof d.referralEarningsCash === 'number' ? d.referralEarningsCash : 0,
            ign: d.ign || 'Player',
            ffUid: d.ffUid || '00000000',
            walletBalance: typeof d.walletBalance === 'number' ? d.walletBalance : 0,
            coinsBalance: typeof d.coinsBalance === 'number' ? d.coinsBalance : 0,
            matchesPlayed: typeof d.matchesPlayed === 'number' ? d.matchesPlayed : 0,
            totalKills: typeof d.totalKills === 'number' ? d.totalKills : 0,
            booyahs: typeof d.booyahs === 'number' ? d.booyahs : 0,
            joinedTournamentIds: Array.isArray(d.joinedTournamentIds) ? d.joinedTournamentIds : [],
            claimedDailyRewardDate: d.claimedDailyRewardDate || '',
            isBanned: Boolean(d.isBanned),
            role: d.role === 'admin' ? 'admin' : 'player',
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
    );

    const refQuery = query(collection(db, 'referrals'), where('referrerUid', '==', uid));
    const unsubReferrals = onSnapshot(
      refQuery,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => {
            const data = d.data();
            const createdMs =
              data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0;
            return {
              createdMs,
              record: {
                id: data.id || d.id,
                referrerUid: data.referrerUid,
                referrerIgn: data.referrerIgn,
                referrerCode: data.referrerCode,
                referredUid: data.referredUid,
                referredIgn: data.referredIgn,
                referrerBonusCoins: data.referrerBonusCoins || REFERRAL_REWARD_COINS,
                referrerBonusCash: data.referrerBonusCash || REFERRAL_REWARD_CASH,
                referredBonusCoins: data.referredBonusCoins || REFERRAL_REWARD_COINS,
                referredBonusCash: data.referredBonusCash || REFERRAL_REWARD_CASH,
                status: 'CREDITED' as const,
                createdAtLabel: formatTimestampLabel(data.createdAt),
              } as ReferralRecord,
            };
          })
          .sort((a, b) => b.createdMs - a.createdMs)
          .map((item) => item.record);
        setReferrals(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'referrals')
    );

    const txQuery = query(collection(db, 'transactions'), where('userId', '==', uid));
    const unsubTx = onSnapshot(
      txQuery,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => {
            const data = d.data();
            const createdMs =
              data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0;
            return {
              createdMs,
              tx: {
                id: data.id || d.id,
                userId: data.userId,
                type: data.type,
                amount: data.amount,
                currency: data.currency,
                description: data.description,
                descriptionHi: data.descriptionHi,
                date: data.date || formatTimestampLabel(data.createdAt),
                status: data.status,
                referenceId: data.referenceId,
              } as Transaction,
            };
          })
          .sort((a, b) => b.createdMs - a.createdMs)
          .map((item) => item.tx);
        setTransactions(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'transactions')
    );

    const depQuery = query(collection(db, 'depositRequests'), where('userId', '==', uid));
    const unsubDep = onSnapshot(
      depQuery,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => {
            const data = d.data();
            const createdMs =
              data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0;
            return {
              createdMs,
              req: {
                id: data.id || d.id,
                userId: data.userId,
                userEmail: data.userEmail,
                userName: data.userName,
                userIgn: data.userIgn,
                amount: data.amount,
                upiTransactionId: data.upiTransactionId,
                payerUpiId: data.payerUpiId,
                status: data.status,
                adminNote: data.adminNote,
                reviewedBy: data.reviewedBy,
                createdAtLabel: formatTimestampLabel(data.createdAt),
              } as DepositRequest,
            };
          })
          .sort((a, b) => b.createdMs - a.createdMs)
          .map((item) => item.req);
        setDepositRequests(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'depositRequests')
    );

    const wdQuery = query(collection(db, 'withdrawRequests'), where('userId', '==', uid));
    const unsubWd = onSnapshot(
      wdQuery,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => {
            const data = d.data();
            const createdMs =
              data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0;
            return {
              createdMs,
              req: {
                id: data.id || d.id,
                userId: data.userId,
                userName: data.userName,
                userIgn: data.userIgn,
                amount: data.amount,
                upiId: data.upiId,
                status: data.status,
                payoutRef: data.payoutRef,
                createdAtLabel: formatTimestampLabel(data.createdAt),
              } as WithdrawRequest,
            };
          })
          .sort((a, b) => b.createdMs - a.createdMs)
          .map((item) => item.req);
        setWithdrawRequests(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'withdrawRequests')
    );

    return () => {
      unsubUser();
      unsubReferrals();
      unsubTx();
      unsubDep();
      unsubWd();
    };
  }, [authReady, firebaseUser]);

  // 2b. Real-time Firestore listener for Merchant UPI QR Settings
  useEffect(() => {
    if (!authReady || !isVerifiedSignedIn) return;
    const unsubPayConfig = onSnapshot(
      doc(db, 'platformConfig', 'paymentSettings'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const isLegacyPlaceholder =
            !data.upiId || data.upiId === 'booyaharena@okhdfcbank';
          setPaymentSettings({
            upiId: isLegacyPlaceholder ? DEFAULT_PAYMENT_SETTINGS.upiId : data.upiId,
            merchantName: isLegacyPlaceholder
              ? DEFAULT_PAYMENT_SETTINGS.merchantName
              : data.merchantName || DEFAULT_PAYMENT_SETTINGS.merchantName,
            instructions: isLegacyPlaceholder
              ? DEFAULT_PAYMENT_SETTINGS.instructions
              : data.instructions || DEFAULT_PAYMENT_SETTINGS.instructions,
            qrImageUrl: data.qrImageUrl || DEFAULT_PAYMENT_SETTINGS.qrImageUrl,
          });
        }
      },
      () => {
        // Fallback to default settings if not configured yet
      }
    );
    return () => unsubPayConfig();
  }, [authReady, isVerifiedSignedIn]);

  // 3. Real-time Firestore listener for ALL Tournaments (syncs Admin creations instantly to every user)
  useEffect(() => {
    if (!authReady || !isVerifiedSignedIn) return;

    const q = query(collection(db, 'tournaments'), where('visibility', '==', 'PUBLIC'));
    const unsubTournaments = onSnapshot(
      q,
      (snapshot) => {
        const liveList: Tournament[] = snapshot.docs
          .map((d) => {
            const data = d.data();
            const createdMs =
              data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0;
            return {
              createdMs,
              tourney: {
                id: data.id || d.id,
                title: data.title,
                titleHi: data.titleHi,
                mode: data.mode,
                map: data.map,
                bannerImage: data.bannerImage,
                prizePool: data.prizePool,
                currency: data.currency,
                entryFee: data.entryFee,
                perKillPrize: data.perKillPrize,
                firstPlacePrize: data.firstPlacePrize,
                secondPlacePrize: data.secondPlacePrize,
                thirdPlacePrize: data.thirdPlacePrize,
                totalSlots: data.totalSlots,
                filledSlots: data.filledSlots,
                startTime: data.startTime,
                roomId: data.roomId,
                roomPassword: data.roomPassword,
                roomUnlocksAt: data.roomUnlocksAt,
                status: data.status,
                organizer: data.organizer,
                createdByUid: data.createdByUid,
                isVerified: Boolean(data.isVerified),
                isFeatured: data.isFeatured,
                deviceType: data.deviceType,
                gunAttributes: Boolean(data.gunAttributes),
                visibility: 'PUBLIC' as const,
                slots: Array.isArray(data.slots) ? data.slots : [],
                rules: Array.isArray(data.rules) ? data.rules : [],
              } as Tournament,
            };
          })
          .sort((a, b) => b.createdMs - a.createdMs)
          .map((item) => item.tourney);

        // Detect live room credential releases on joined tournaments
        liveList.forEach((tourney) => {
          const prevStatus = previousRoomStatesRef.current[tourney.id];
          if (
            prevStatus &&
            prevStatus !== 'ROOM_OPEN' &&
            tourney.status === 'ROOM_OPEN' &&
            tourney.roomId &&
            user.joinedTournamentIds.includes(tourney.id)
          ) {
            const newNotif: AppNotification = {
              id: `notif-${tourney.id}-${Date.now()}`,
              tournamentId: tourney.id,
              type: 'ROOM_RELEASED',
              title: 'Room ID & Password Released!',
              titleHi: 'रूम ID और पासवर्ड जारी हो गया!',
              message: `${tourney.title}: Room ID: ${tourney.roomId} | Pass: ${tourney.roomPassword}. Join inside Free Fire now!`,
              messageHi: `${tourney.titleHi || tourney.title}: रूम ID: ${tourney.roomId} | पासवर्ड: ${tourney.roomPassword}। तुरंत फ्री फायर में जॉइन करें!`,
              roomId: tourney.roomId,
              roomPassword: tourney.roomPassword,
              timestamp: 'Just now',
              isRead: false,
            };
            setNotifications((prev) => [newNotif, ...prev]);
            setActiveToast(newNotif);
            if (soundEnabled) playRoomReleasedSound();
          }
          previousRoomStatesRef.current[tourney.id] = tourney.status;
        });

        setTournaments(liveList);
        setTournamentsLoaded(true);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'tournaments')
    );

    return () => unsubTournaments();
  }, [authReady, isVerifiedSignedIn, user.joinedTournamentIds, soundEnabled]);

  // 4. Admin-only real-time listeners (all deposits, withdrawals, users)
  useEffect(() => {
    if (!authReady || !isAdminAuthenticated || !isFirebaseAdmin) return;

    const unsubAllDeposits = onSnapshot(
      collection(db, 'depositRequests'),
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => {
            const data = d.data();
            const createdMs =
              data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0;
            return {
              createdMs,
              req: {
                id: data.id || d.id,
                userId: data.userId,
                userEmail: data.userEmail,
                userName: data.userName,
                userIgn: data.userIgn,
                amount: data.amount,
                upiTransactionId: data.upiTransactionId,
                payerUpiId: data.payerUpiId,
                status: data.status,
                adminNote: data.adminNote,
                reviewedBy: data.reviewedBy,
                createdAtLabel: formatTimestampLabel(data.createdAt),
              } as DepositRequest,
            };
          })
          .sort((a, b) => {
            if (a.req.status === 'PENDING' && b.req.status !== 'PENDING') return -1;
            if (a.req.status !== 'PENDING' && b.req.status === 'PENDING') return 1;
            return b.createdMs - a.createdMs;
          })
          .map((item) => item.req);
        setAdminDepositRequests(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'depositRequests')
    );

    const unsubAllWithdraws = onSnapshot(
      collection(db, 'withdrawRequests'),
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => {
            const data = d.data();
            const createdMs =
              data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0;
            return {
              createdMs,
              req: {
                id: data.id || d.id,
                userId: data.userId,
                userName: data.userName,
                userIgn: data.userIgn,
                amount: data.amount,
                upiId: data.upiId,
                status: data.status,
                payoutRef: data.payoutRef,
                createdAtLabel: formatTimestampLabel(data.createdAt),
              } as WithdrawRequest,
            };
          })
          .sort((a, b) => {
            if (a.req.status === 'PENDING' && b.req.status !== 'PENDING') return -1;
            if (a.req.status !== 'PENDING' && b.req.status === 'PENDING') return 1;
            return b.createdMs - a.createdMs;
          })
          .map((item) => item.req);
        setAdminWithdrawRequests(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'withdrawRequests')
    );

    const unsubAllUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: UserProfile[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: data.uid || d.id,
            email: data.email || '',
            name: data.name || 'Player',
            username: data.username || undefined,
            mobileNumber: data.mobileNumber || undefined,
            ign: data.ign || 'Player',
            ffUid: data.ffUid || '',
            walletBalance: data.walletBalance || 0,
            coinsBalance: data.coinsBalance || 0,
            matchesPlayed: data.matchesPlayed || 0,
            totalKills: data.totalKills || 0,
            booyahs: data.booyahs || 0,
            joinedTournamentIds: Array.isArray(data.joinedTournamentIds) ? data.joinedTournamentIds : [],
            isBanned: Boolean(data.isBanned),
            role: data.role === 'admin' ? 'admin' : 'player',
          };
        });
        setAdminAllUsers(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users')
    );

    return () => {
      unsubAllDeposits();
      unsubAllWithdraws();
      unsubAllUsers();
    };
  }, [authReady, isAdminAuthenticated, isFirebaseAdmin]);

  // 5. Auto-seed starter tournaments on very first Admin sign-in if database is empty
  const hasAttemptedAutoSeed = useRef(false);
  useEffect(() => {
    if (
      tournamentsLoaded &&
      tournaments.length === 0 &&
      isFirebaseAdmin &&
      firebaseUser &&
      !hasAttemptedAutoSeed.current
    ) {
      hasAttemptedAutoSeed.current = true;
      handleSeedStarterTournaments().catch(() => {});
    }
  }, [tournamentsLoaded, tournaments.length, isFirebaseAdmin, firebaseUser]);

  // 6. Admin URL & State Guards
  useEffect(() => {
    const checkAdminRouteAttempt = () => {
      const params = new URLSearchParams(window.location.search);
      const isTryingAdminUrl =
        params.has('admin') ||
        window.location.hash.toLowerCase() === '#admin' ||
        window.location.pathname.toLowerCase().endsWith('/admin');

      if (isTryingAdminUrl) {
        if (isAdminAuthenticated) {
          setActiveTab('admin');
        } else {
          window.history.replaceState(null, '', window.location.pathname);
          setActiveTab('tournaments');
          setAdminAccessError(
            pickLocalized(
              lang,
              'Unauthorized Access Blocked: The Admin Panel is restricted to authorized organizers. You have been redirected to the home screen.',
              'अनधिकृत प्रवेश अवरुद्ध: एडमिन पैनल केवल अधिकृत ऑर्गनाइजर के लिए है। आपको होम स्क्रीन पर रीडायरेक्ट कर दिया गया है।',
              'অননুমোদিত প্রবেশ আটকানো হয়েছে: অ্যাডমিন প্যানেল শুধুমাত্র অনুমোদিত অর্গানাইজারদের জন্য। আপনাকে হোম স্ক্রিনে ফিরিয়ে নেওয়া হয়েছে।'
            )
          );
          setIsAdminAuthOpen(true);
        }
      }
    };

    checkAdminRouteAttempt();
    window.addEventListener('hashchange', checkAdminRouteAttempt);
    return () => window.removeEventListener('hashchange', checkAdminRouteAttempt);
  }, [isAdminAuthenticated, lang]);

  useEffect(() => {
    if (activeTab === 'admin' && !isAdminAuthenticated) {
      setActiveTab('tournaments');
      setAdminAccessError(
        pickLocalized(
          lang,
          'Access Denied: Please verify authorized organizer credentials to access the Admin Panel.',
          'प्रवेश अस्वीकृत: एडमिन पैनल खोलने के लिए कृपया ऑर्गनाइजर क्रेडेंशियल्स सत्यापित करें।',
          'প্রবেশ অস্বীকৃত: অ্যাডমিন প্যানেল খুলতে অনুগ্রহ করে অনুমোদিত অর্গানাইজার তথ্য যাচাই করুন।'
        )
      );
      setIsAdminAuthOpen(true);
    }
  }, [activeTab, isAdminAuthenticated, lang]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (isAdminAuthenticated) {
          setActiveTab('admin');
        } else {
          setAdminAccessError('');
          setIsAdminAuthOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminAuthenticated]);

  const t = translations[lang];

  // Display live Firestore tournaments; if brand-new unseeded database has 0 docs and guest visits, show starter preview gracefully
  const displayTournaments = tournaments;

  const filteredTournaments = useMemo(() => {
    return displayTournaments.filter((tourney) => {
      const matchesSearch =
        tourney.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tourney.titleHi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tourney.map.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterMode === 'ALL') return true;
      if (filterMode === 'SQUAD') return tourney.mode === 'SQUAD' || tourney.mode === 'CLASH_SQUAD';
      if (filterMode === 'SOLO') return tourney.mode === 'SOLO';
      if (filterMode === 'DUO') return tourney.mode === 'DUO';
      if (filterMode === 'FREE') return tourney.entryFee === 0;
      if (filterMode === 'MEGA') return tourney.prizePool >= 3000;
      return true;
    });
  }, [displayTournaments, searchQuery, filterMode]);

  const joinedTournamentsList = useMemo(() => {
    return displayTournaments.filter((tourney) => user.joinedTournamentIds.includes(tourney.id));
  }, [displayTournaments, user.joinedTournamentIds]);

  const requireVerifiedAuth = (): boolean => {
    if (!firebaseUser || !firebaseUser.emailVerified) {
      setIsAuthModalOpen(true);
      return false;
    }
    return true;
  };

  // Seed Starter Tournaments (Admin)
  const handleSeedStarterTournaments = async () => {
    if (!firebaseUser || !isFirebaseAdmin) return;
    try {
      const batch = writeBatch(db);
      MOCK_TOURNAMENTS.forEach((tItem) => {
        const ref = doc(db, 'tournaments', tItem.id);
        batch.set(ref, sanitizeTournamentForFirestore(tItem, firebaseUser.uid, true));
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'tournaments');
    }
  };

  // Slot Booking (Firestore Atomic Transaction)
  const handleConfirmBooking = async (
    tournamentId: string,
    slotNumber: number,
    teamName: string,
    players: { ign: string; uid: string }[],
    entryFee: number,
    currency: 'INR' | 'COINS'
  ): Promise<void> => {
    if (!requireVerifiedAuth() || !firebaseUser) {
      throw new Error('Please sign in first.');
    }

    const tourneyRef = doc(db, 'tournaments', tournamentId);
    const userRef = doc(db, 'users', firebaseUser.uid);

    let bookedTitle = '';
    let bookedTitleHi = '';

    try {
      await runTransaction(db, async (tx) => {
        const tourneySnap = await tx.get(tourneyRef);
        if (!tourneySnap.exists()) {
          throw new Error('Tournament no longer exists.');
        }

        const userSnap = await tx.get(userRef);
        if (!userSnap.exists()) {
          throw new Error('Player profile not found.');
        }

        const tData = tourneySnap.data();
        const uData = userSnap.data();

        bookedTitle = tData.title || 'Tournament';
        bookedTitleHi = tData.titleHi || bookedTitle;

        const currentFilled = Number(tData.filledSlots || 0);
        const totalSlots = Number(tData.totalSlots || 0);
        if (currentFilled >= totalSlots) {
          throw new Error('This match is already full.');
        }

        const existingJoined: string[] = Array.isArray(uData.joinedTournamentIds)
          ? uData.joinedTournamentIds
          : [];
        if (existingJoined.includes(tournamentId)) {
          throw new Error('You have already booked a slot in this tournament.');
        }

        const liveWallet = Number(uData.walletBalance || 0);
        const liveCoins = Number(uData.coinsBalance || 0);
        const fee = Number(tData.entryFee ?? entryFee);
        const feeCurrency: 'INR' | 'COINS' = tData.currency === 'COINS' ? 'COINS' : currency;

        if (feeCurrency === 'INR' && liveWallet < fee) {
          throw new Error(`Insufficient wallet balance. Available: ₹${liveWallet}`);
        }
        if (feeCurrency === 'COINS' && liveCoins < fee) {
          throw new Error(`Insufficient Booyah Coins. Available: 💎 ${liveCoins}`);
        }

        const rawSlots = Array.isArray(tData.slots) ? tData.slots : [];
        let targetFound = false;
        const updatedSlots = rawSlots.map((s: Record<string, unknown>) => {
          if (Number(s.slotNumber) === slotNumber) {
            targetFound = true;
            if (Boolean(s.isLocked) || (Array.isArray(s.players) && s.players.length > 0)) {
              throw new Error(`Slot #${slotNumber} was just booked by another player. Please choose another vacant slot.`);
            }
            return {
              slotNumber: Number(s.slotNumber),
              teamName,
              isLocked: true,
              players: players.map((p) => ({ ign: p.ign, uid: p.uid })),
            };
          }
          return {
            slotNumber: Number(s.slotNumber),
            ...(s.teamName ? { teamName: String(s.teamName) } : {}),
            isLocked: Boolean(s.isLocked),
            players: Array.isArray(s.players)
              ? s.players.map((p: Record<string, unknown>) => ({
                  ign: String(p.ign || ''),
                  uid: String(p.uid || ''),
                  ...(p.avatar ? { avatar: String(p.avatar) } : {}),
                }))
              : [],
          };
        });

        if (!targetFound) {
          throw new Error(`Slot #${slotNumber} does not exist in this match.`);
        }

        tx.update(tourneyRef, {
          filledSlots: currentFilled + 1,
          slots: updatedSlots,
          updatedAt: serverTimestamp(),
        });

        tx.update(userRef, {
          walletBalance: feeCurrency === 'INR' ? liveWallet - fee : liveWallet,
          coinsBalance: feeCurrency === 'COINS' ? liveCoins - fee : liveCoins,
          joinedTournamentIds: [...existingJoined, tournamentId],
          matchesPlayed: Number(uData.matchesPlayed || 0) + 1,
          updatedAt: serverTimestamp(),
        });

        if (fee > 0) {
          const txId = `tx_${Date.now()}`;
          tx.set(doc(db, 'transactions', txId), {
            id: txId,
            userId: firebaseUser.uid,
            type: 'ENTRY_FEE',
            amount: fee,
            currency: feeCurrency,
            description: `Entry fee for ${bookedTitle} (Slot #${slotNumber})`,
            descriptionHi: `${bookedTitleHi} (स्लॉट #${slotNumber}) एंट्री फीस`,
            date: new Date().toLocaleString(),
            status: 'SUCCESS',
            referenceId: tournamentId,
            createdAt: serverTimestamp(),
          });
        }
      });

      const slotNotif: AppNotification = {
        id: `notif_slot_${Date.now()}`,
        tournamentId,
        type: 'SLOT_CONFIRMED',
        title: 'Slot Booked Successfully!',
        titleHi: 'स्लॉट सफलतापूर्वक बुक हो गई!',
        message: `You booked Slot #${slotNumber} for ${teamName} in ${bookedTitle}. Room ID & Password unlock 15 mins before match.`,
        messageHi: `आपकी स्लॉट #${slotNumber} (${teamName}) बुक हो गई है। मैच से 15 मिनट पहले रूम आईडी और पासवर्ड मिलेगा।`,
        timestamp: 'Just now',
        isRead: false,
      };
      setNotifications((prev) => [slotNotif, ...prev]);
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes('Insufficient') ||
          err.message.includes('already') ||
          err.message.includes('booked') ||
          err.message.includes('full') ||
          err.message.includes('exist'))
      ) {
        throw err;
      }
      handleFirestoreError(err, OperationType.WRITE, `tournaments/${tournamentId}`);
    }
  };

  // Manual UPI Deposit Request Submission
  const handleSubmitDepositRequest = async (
    amount: number,
    upiTransactionId: string,
    payerUpiId?: string
  ) => {
    if (!requireVerifiedAuth() || !firebaseUser) {
      throw new Error('Please sign in first.');
    }

    const reqId = `dep_${Date.now()}`;
    const txId = `tx_${Date.now()}_dep`;

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'depositRequests', reqId), {
        id: reqId,
        userId: firebaseUser.uid,
        userEmail: user.email || firebaseUser.email || '',
        userName: user.name,
        userIgn: user.ign,
        amount,
        upiTransactionId,
        ...(payerUpiId ? { payerUpiId } : {}),
        status: 'PENDING',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.set(doc(db, 'transactions', txId), {
        id: txId,
        userId: firebaseUser.uid,
        type: 'DEPOSIT',
        amount,
        currency: 'INR',
        description: `Manual UPI Deposit Request (UTR: ${upiTransactionId})`,
        descriptionHi: `मैनुअल UPI जमा रिक्वेस्ट (UTR: ${upiTransactionId})`,
        date: new Date().toLocaleString(),
        status: 'PENDING',
        referenceId: reqId,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `depositRequests/${reqId}`);
    }
  };

  // User Withdrawal Request Submission (Atomic Firestore Transaction)
  const handleWithdraw = async (amount: number, upiId: string) => {
    if (!requireVerifiedAuth() || !firebaseUser) {
      throw new Error('Please sign in first.');
    }

    const wdId = `wd_${Date.now()}`;
    const txId = `tx_${Date.now()}_wd`;
    const userRef = doc(db, 'users', firebaseUser.uid);

    try {
      await runTransaction(db, async (tx) => {
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists()) {
          throw new Error('User profile not found.');
        }

        const uData = userSnap.data();
        const liveWallet = Number(uData.walletBalance || 0);
        if (amount < 50) {
          throw new Error('Minimum withdrawal amount is ₹50.');
        }
        if (liveWallet < amount) {
          throw new Error(`Insufficient wallet balance. Available: ₹${liveWallet}`);
        }

        tx.update(userRef, {
          walletBalance: liveWallet - amount,
          updatedAt: serverTimestamp(),
        });

        tx.set(doc(db, 'withdrawRequests', wdId), {
          id: wdId,
          userId: firebaseUser.uid,
          userName: String(uData.name || user.name),
          userIgn: String(uData.ign || user.ign),
          amount,
          upiId,
          status: 'PENDING',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        tx.set(doc(db, 'transactions', txId), {
          id: txId,
          userId: firebaseUser.uid,
          type: 'WITHDRAW',
          amount,
          currency: 'INR',
          description: `UPI Withdrawal Request to ${upiId}`,
          descriptionHi: `UPI (${upiId}) में निकासी रिक्वेस्ट`,
          date: new Date().toLocaleString(),
          status: 'PENDING',
          referenceId: wdId,
          createdAt: serverTimestamp(),
        });
      });
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes('Insufficient') ||
          err.message.includes('Minimum') ||
          err.message.includes('not found'))
      ) {
        throw err;
      }
      handleFirestoreError(err, OperationType.CREATE, `withdrawRequests/${wdId}`);
    }
  };

  // Daily Coins Claim
  const handleClaimDailyCoins = async (coins: number) => {
    if (!requireVerifiedAuth() || !firebaseUser) return;
    const today = new Date().toDateString();
    const txId = `tx_${Date.now()}_daily`;

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', firebaseUser.uid), {
        coinsBalance: user.coinsBalance + coins,
        claimedDailyRewardDate: today,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'transactions', txId), {
        id: txId,
        userId: firebaseUser.uid,
        type: 'DAILY_BONUS',
        amount: coins,
        currency: 'COINS',
        description: 'Daily Check-in Bonus claimed',
        descriptionHi: 'दैनिक चेक-इन बोनस प्राप्त किया',
        date: new Date().toLocaleString(),
        status: 'SUCCESS',
        createdAt: serverTimestamp(),
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  };

  // Create Tournament (Admin -> instantly syncs to all users' home screens via Firestore)
  const handleCreateTournament = async (newTourney: Tournament) => {
    if (!requireVerifiedAuth() || !firebaseUser) return;
    try {
      await setDoc(
        doc(db, 'tournaments', newTourney.id),
        sanitizeTournamentForFirestore(newTourney, firebaseUser.uid, true)
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `tournaments/${newTourney.id}`);
    }
  };

  const handleSubmitResultProof = (tournamentId: string, kills: number, _proofName: string) => {
    if (!requireVerifiedAuth()) return;
    const notif: AppNotification = {
      id: `notif_proof_${Date.now()}`,
      tournamentId,
      type: 'MATCH_STARTING',
      title: 'Result Proof Submitted!',
      titleHi: 'मैच स्क्रीनशॉट सबमिट हो गया!',
      message: `Submitted ${kills} kills proof for Admin verification. Prize will be credited once approved.`,
      messageHi: `${kills} किल्स का प्रूफ एडमिन वेरिफिकेशन के लिए भेजा गया है।`,
      timestamp: 'Just now',
      isRead: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleOpenBooking = (tournament: Tournament, slotNumber?: number) => {
    if (!requireVerifiedAuth()) {
      setSelectedTourneyForDetails(null);
      return;
    }
    setSelectedTourneyForDetails(null);
    setSelectedTourneyForBooking(tournament);
    setPreselectedSlotNumber(slotNumber);
  };

  const isTodayClaimed = user.claimedDailyRewardDate === new Date().toDateString();

  // Push notification and Room ID alert dispatcher
  const triggerRoomReleaseAlert = (targetTourney?: Tournament) => {
    const tourney =
      targetTourney ||
      tournaments.find((t) => user.joinedTournamentIds.includes(t.id)) ||
      tournaments[0];

    if (!tourney) return;

    const roomId = tourney.roomId || `FF-${Math.floor(100000 + Math.random() * 900000)}`;
    const roomPassword = tourney.roomPassword || `${Math.floor(100 + Math.random() * 900)}`;

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      tournamentId: tourney.id,
      type: 'ROOM_RELEASED',
      title: `Room ID & Password Released!`,
      titleHi: `रूम ID और पासवर्ड जारी हो गया!`,
      message: `${tourney.title}: Room ID: ${roomId} | Password: ${roomPassword}. Join your slot inside Free Fire now!`,
      messageHi: `${tourney.titleHi || tourney.title}: रूम ID: ${roomId} | पासवर्ड: ${roomPassword}। तुरंत फ्री फायर में अपनी स्लॉट जॉइन करें!`,
      roomId,
      roomPassword,
      timestamp: 'Just now',
      isRead: false,
    };

    if (soundEnabled) playRoomReleasedSound();

    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(`BooyahArena: Room ID Released!`, {
          body: `${tourney.title}\nRoom ID: ${roomId} | Password: ${roomPassword}`,
        });
      } catch {}
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {}
    }

    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToast(newNotif);
    setTimeout(() => {
      setActiveToast((curr) => (curr?.id === newNotif.id ? null : curr));
    }, 10000);
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleSelectNotification = (tournamentId: string) => {
    const tourney = tournaments.find((t) => t.id === tournamentId);
    if (tourney) {
      setActiveTab('my-matches');
      setNotifications((prev) =>
        prev.map((n) => (n.tournamentId === tournamentId ? { ...n, isRead: true } : n))
      );
    }
  };

  // Admin Operations Handlers (Firestore)
  const handleUpdateTournament = async (updated: Tournament) => {
    if (!firebaseUser) return;
    try {
      await updateDoc(
        doc(db, 'tournaments', updated.id),
        sanitizeTournamentForFirestore(updated, firebaseUser.uid, false)
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tournaments/${updated.id}`);
    }
  };

  const handleDeleteTournament = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tournaments', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tournaments/${id}`);
    }
  };

  const handleAdminReleaseRoom = async (tournament: Tournament, roomId: string, pass: string) => {
    const updatedTourney: Tournament = {
      ...tournament,
      roomId,
      roomPassword: pass,
      status: 'ROOM_OPEN',
    };
    await handleUpdateTournament(updatedTourney);
    triggerRoomReleaseAlert(updatedTourney);
  };

  const handleAdminDisbursePrize = async (amount: number, reason: string) => {
    if (!firebaseUser) return;
    try {
      const txId = `tx_${Date.now()}_prize`;
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', firebaseUser.uid), {
        walletBalance: user.walletBalance + amount,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'transactions', txId), {
        id: txId,
        userId: firebaseUser.uid,
        type: 'PRIZE_WON',
        amount,
        currency: 'INR',
        description: reason,
        descriptionHi: reason,
        date: new Date().toLocaleString(),
        status: 'SUCCESS',
        createdAt: serverTimestamp(),
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'transactions');
    }
  };

  // Admin Approve Manual UPI Deposit Request (Atomic Firestore Transaction)
  const handleApproveDeposit = async (req: DepositRequest) => {
    if (!firebaseUser) return;
    const reqRef = doc(db, 'depositRequests', req.id);
    const userRef = doc(db, 'users', req.userId);
    const txId = `tx_dep_${req.id}`;
    const txRef = doc(db, 'transactions', txId);

    try {
      await runTransaction(db, async (tx) => {
        const reqSnap = await tx.get(reqRef);
        if (!reqSnap.exists()) throw new Error('Deposit request no longer exists.');
        if (reqSnap.data().status !== 'PENDING') {
          throw new Error('This deposit request has already been processed.');
        }

        const userSnap = await tx.get(userRef);
        if (!userSnap.exists()) throw new Error('Target user profile not found.');

        const currentBalance = Number(userSnap.data().walletBalance || 0);

        tx.update(reqRef, {
          status: 'APPROVED',
          reviewedBy: firebaseUser.uid,
          updatedAt: serverTimestamp(),
        });

        tx.update(userRef, {
          walletBalance: currentBalance + req.amount,
          updatedAt: serverTimestamp(),
        });

        tx.set(txRef, {
          id: txId,
          userId: req.userId,
          type: 'DEPOSIT',
          amount: req.amount,
          currency: 'INR',
          description: `UPI Deposit Approved (UTR: ${req.upiTransactionId})`,
          descriptionHi: `UPI जमा स्वीकृत (UTR: ${req.upiTransactionId})`,
          date: new Date().toLocaleString(),
          status: 'SUCCESS',
          referenceId: req.id,
          createdAt: serverTimestamp(),
        });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `depositRequests/${req.id}`);
    }
  };

  const handleRejectDeposit = async (req: DepositRequest, reason: string) => {
    if (!firebaseUser) return;
    try {
      await updateDoc(doc(db, 'depositRequests', req.id), {
        status: 'REJECTED',
        adminNote: reason,
        reviewedBy: firebaseUser.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `depositRequests/${req.id}`);
    }
  };

  const handleApproveWithdraw = async (req: WithdrawRequest) => {
    try {
      await updateDoc(doc(db, 'withdrawRequests', req.id), {
        status: 'COMPLETED',
        payoutRef: `IMPS${Date.now().toString().slice(-6)}`,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `withdrawRequests/${req.id}`);
    }
  };

  const handleRejectWithdraw = async (req: WithdrawRequest) => {
    const reqRef = doc(db, 'withdrawRequests', req.id);
    const userRef = doc(db, 'users', req.userId);
    const refundTxId = `tx_ref_${req.id}`;

    try {
      await runTransaction(db, async (tx) => {
        const reqSnap = await tx.get(reqRef);
        if (!reqSnap.exists() || reqSnap.data().status !== 'PENDING') {
          throw new Error('Withdrawal already processed.');
        }
        const userSnap = await tx.get(userRef);
        if (userSnap.exists()) {
          const cur = Number(userSnap.data().walletBalance || 0);
          tx.update(userRef, {
            walletBalance: cur + req.amount,
            updatedAt: serverTimestamp(),
          });
        }
        tx.update(reqRef, {
          status: 'REJECTED',
          updatedAt: serverTimestamp(),
        });
        tx.set(doc(db, 'transactions', refundTxId), {
          id: refundTxId,
          userId: req.userId,
          type: 'DEPOSIT',
          amount: req.amount,
          currency: 'INR',
          description: `Refund for rejected withdrawal to ${req.upiId}`,
          descriptionHi: `रद्द की गई निकासी (₹${req.amount}) का रिफंड`,
          date: new Date().toLocaleString(),
          status: 'SUCCESS',
          referenceId: req.id,
          createdAt: serverTimestamp(),
        });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `withdrawRequests/${req.id}`);
    }
  };

  const handleToggleUserBan = async (targetUser: UserProfile) => {
    try {
      await updateDoc(doc(db, 'users', targetUser.id), {
        isBanned: !targetUser.isBanned,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUser.id}`);
    }
  };

  const handleAdminAdjustUserWallet = async (
    targetUser: UserProfile,
    currency: 'INR' | 'COINS',
    action: 'ADD' | 'DEDUCT',
    amount: number,
    note?: string
  ) => {
    if (!firebaseUser || !isFirebaseAdmin) {
      throw new Error(
        `Please sign in with Firebase Admin (${ADMIN_EMAIL}) to modify user wallet balances.`
      );
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Please enter a valid positive amount.');
    }

    const roundedAmount = Math.round(amount);
    const userRef = doc(db, 'users', targetUser.id);
    const txId = `tx_adm_${Date.now()}`;
    const txRef = doc(db, 'transactions', txId);

    try {
      await runTransaction(db, async (tx) => {
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists()) {
          throw new Error('Target user profile not found.');
        }

        const uData = userSnap.data();
        const currentCash = Number(uData.walletBalance || 0);
        const currentCoins = Number(uData.coinsBalance || 0);

        const nextCash =
          currency === 'INR'
            ? action === 'ADD'
              ? currentCash + roundedAmount
              : currentCash - roundedAmount
            : currentCash;
        const nextCoins =
          currency === 'COINS'
            ? action === 'ADD'
              ? currentCoins + roundedAmount
              : currentCoins - roundedAmount
            : currentCoins;

        if (nextCash < 0) {
          throw new Error(`Cannot deduct ₹${roundedAmount}. User only has ₹${currentCash}.`);
        }
        if (nextCoins < 0) {
          throw new Error(`Cannot deduct 💎${roundedAmount}. User only has 💎${currentCoins}.`);
        }
        if (nextCash > 1000000 || nextCoins > 1000000) {
          throw new Error('Maximum wallet balance limit (1,000,000) exceeded.');
        }

        tx.update(userRef, {
          walletBalance: nextCash,
          coinsBalance: nextCoins,
          updatedAt: serverTimestamp(),
        });

        const cleanNote = note?.trim();
        const unitLabel = currency === 'INR' ? `₹${roundedAmount}` : `${roundedAmount} Booyah Coins`;
        const descEn = cleanNote
          ? `${cleanNote} (${action === 'ADD' ? '+' : '-'}${unitLabel})`
          : action === 'ADD'
            ? `Admin credited ${unitLabel}`
            : `Admin deducted ${unitLabel}`;
        const descHi = cleanNote
          ? `${cleanNote} (${action === 'ADD' ? '+' : '-'}${unitLabel})`
          : action === 'ADD'
            ? `एडमिन द्वारा ${unitLabel} जोड़े गए`
            : `एडमिन द्वारा ${unitLabel} काटे गए`;

        tx.set(txRef, {
          id: txId,
          userId: targetUser.id,
          type:
            currency === 'INR'
              ? action === 'ADD'
                ? 'DEPOSIT'
                : 'WITHDRAW'
              : action === 'ADD'
                ? 'DAILY_BONUS'
                : 'ENTRY_FEE',
          amount: roundedAmount,
          currency,
          description: descEn.slice(0, 200),
          descriptionHi: descHi.slice(0, 200),
          date: new Date().toLocaleString(),
          status: 'SUCCESS',
          referenceId: `admin_${firebaseUser.uid}`.slice(0, 128),
          createdAt: serverTimestamp(),
        });
      });
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes('Cannot deduct') ||
          err.message.includes('Maximum') ||
          err.message.includes('not found') ||
          err.message.includes('valid positive'))
      ) {
        throw err;
      }
      handleFirestoreError(err, OperationType.WRITE, `users/${targetUser.id}`);
    }
  };

  const handleSavePaymentSettings = async (settings: PaymentSettings) => {
    try {
      await setDoc(doc(db, 'platformConfig', 'paymentSettings'), {
        ...settings,
        updatedAt: serverTimestamp(),
      });
      setPaymentSettings(settings);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'platformConfig/paymentSettings');
    }
  };

  const handleUpdateOwnProfile = async (
    updates: Partial<Pick<UserProfile, 'name' | 'ign' | 'ffUid'>>
  ) => {
    if (!requireVerifiedAuth() || !firebaseUser) return;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setActiveTab('tournaments');
  };

  const handleSignInFirebaseAdmin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setIsAuthModalOpen(true);
    }
  };

  const handleRedeemFriendReferralCode = async (code: string) => {
    if (!requireVerifiedAuth() || !firebaseUser) {
      throw new Error('Please sign in first.');
    }
    await redeemReferralCodeInternal(firebaseUser.uid, user.ign, code, {
      silentIfInvalid: false,
    });
  };

  const handleTabChange = (
    tab: 'tournaments' | 'my-matches' | 'leaderboard' | 'wallet' | 'rules' | 'refer' | 'admin' | 'profile'
  ) => {
    if (tab === 'admin' && !isAdminAuthenticated) {
      setActiveTab('tournaments');
      setAdminAccessError(
        pickLocalized(
          lang,
          'Access Denied: Admin Panel is restricted to authorized administrators.',
          'प्रवेश अस्वीकृत: एडमिन पैनल केवल अधिकृत एडमिन के लिए सुरक्षित है।',
          'প্রবেশাধিকার নেই: অ্যাডমিন প্যানেল শুধুমাত্র অনুমোদিত অ্যাডমিনদের জন্য সংরক্ষিত।'
        )
      );
      setIsAdminAuthOpen(true);
      return;
    }
    setAdminAccessError('');
    setActiveTab(tab);
  };

  const handleAdminAuthenticated = () => {
    try {
      sessionStorage.setItem('booyah_admin_auth', 'true');
    } catch {}
    setIsAdminAuthenticated(true);
    setIsAdminAuthOpen(false);
    setAdminAccessError('');
    setActiveTab('admin');
  };

  const handleAdminLogout = () => {
    try {
      sessionStorage.removeItem('booyah_admin_auth');
    } catch {}
    setIsAdminAuthenticated(false);
    setActiveTab('tournaments');
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-zinc-950 shadow-lg shadow-orange-500/20 animate-pulse">
          <Flame className="w-6 h-6 fill-zinc-950" />
        </div>
        <div className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
          BooyahArena · Loading Session...
        </div>
      </div>
    );
  }

  if (!isVerifiedSignedIn) {
    return (
      <AuthLandingView
        currentFirebaseUser={firebaseUser}
        onVerificationRefreshed={handleVerificationRefreshed}
        initialReferralCode={bootIntent.referralCode}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased pb-20 md:pb-8">
      {/* Top Navigation Bar */}
      <Header
        lang={lang}
        setLang={handleChangeLanguage}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        user={user}
        isAuthenticated={isVerifiedSignedIn}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenWallet={() => handleTabChange('wallet')}
        onOpenHostModal={() => {
          if (requireVerifiedAuth()) setIsHostOpen(true);
        }}
        onOpenDailyBonus={() => {
          if (requireVerifiedAuth()) setIsDailyBonusOpen(true);
        }}
        unreadNotificationsCount={notifications.filter((n) => !n.isRead).length}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        isAdminAuthenticated={isAdminAuthenticated}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Unauthorized Admin Access Error Banner */}
        {adminAccessError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 text-xs sm:text-sm text-red-300">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              <span>{adminAccessError}</span>
            </div>
            <button
              onClick={() => setAdminAccessError('')}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-300 transition-colors shrink-0"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: TOURNAMENTS DISCOVERY */}
        {activeTab === 'tournaments' && (
          <div className="space-y-8">
            <HeroBanner
              lang={lang}
              onJoinClick={() => {
                const el = document.getElementById('tournaments-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onHostClick={() => {
                if (requireVerifiedAuth()) setIsHostOpen(true);
              }}
            />

            {/* Quick Action Ticker */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div
                onClick={() => {
                  if (requireVerifiedAuth()) setIsDailyBonusOpen(true);
                }}
                className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-mono">
                    💎
                  </div>
                  <div>
                    <div className="text-xs font-heading font-bold text-white">Daily Supply Drop</div>
                    <div className="text-[11px] text-zinc-400 font-mono">Claim +50 Free Coins today</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </div>

              <div
                onClick={() => handleTabChange('rules')}
                className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono">
                    🛡️
                  </div>
                  <div>
                    <div className="text-xs font-heading font-bold text-white">Fair Play Rules</div>
                    <div className="text-[11px] text-zinc-400 font-mono">Mobile Only · No PC Hackers</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </div>

              <div
                onClick={() => {
                  if (requireVerifiedAuth()) setIsHostOpen(true);
                }}
                className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-mono">
                    ⚡
                  </div>
                  <div>
                    <div className="text-xs font-heading font-bold text-white">Host Custom Scrim</div>
                    <div className="text-[11px] text-zinc-400 font-mono">Create your own room in 1 min</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </div>

              <div
                onClick={() => setIsPublishOpen(true)}
                className="p-3.5 rounded-xl bg-zinc-900/90 border border-orange-500/40 hover:border-orange-400 cursor-pointer transition-all flex items-center justify-between shadow-lg shadow-orange-500/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center font-mono">
                    🚀
                  </div>
                  <div>
                    <div className="text-xs font-heading font-bold text-white">
                      {pickLocalized(lang, 'Android APK & Share', 'Android APK व शेयर', 'Android APK ও শেয়ার')}
                    </div>
                    <div className="text-[11px] text-orange-400 font-mono">
                      {pickLocalized(lang, 'Install app or build .apk', 'ऐप इंस्टॉल करें या .apk बनाएँ', 'অ্যাপ ইনস্টল বা .apk তৈরি করুন')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-orange-400" />
              </div>
            </div>

            {/* Dashboard Refer & Earn Promo Strip */}
            <div
              onClick={() => handleTabChange('refer')}
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-zinc-900 border border-amber-500/40 hover:border-amber-400 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/5"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm sm:text-base font-heading font-extrabold text-white">
                      {pickLocalized(
                        lang,
                        `Refer & Earn ₹${REFERRAL_REWARD_CASH} + ${REFERRAL_REWARD_COINS} Coins`,
                        `रेफर करें व पाएं ₹${REFERRAL_REWARD_CASH} + ${REFERRAL_REWARD_COINS} कॉइन्स`,
                        `রেফার করে আয় করুন ₹${REFERRAL_REWARD_CASH} + ${REFERRAL_REWARD_COINS} কয়েন`
                      )}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-950/90 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300">
                      CODE: {user.myReferralCode || 'LOADING'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-zinc-300 mt-0.5">
                    {pickLocalized(
                      lang,
                      `Invite friends via WhatsApp link — both earn rewards automatically! (${user.referralCount ?? 0} referred)`,
                      `WhatsApp लिंक से दोस्तों को बुलाएं — दोनों को ऑटोमैटिक इनाम मिलेगा! (${user.referralCount ?? 0} रेफरल)`,
                      `WhatsApp লিংকে বন্ধুদের আমন্ত্রণ জানান — দুজনেই অটো বোনাস পাবেন! (${user.referralCount ?? 0} জন)`
                    )}
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-heading font-bold self-start sm:self-center shrink-0">
                <span>{pickLocalized(lang, 'Invite & Earn', 'रेफर करें', 'আমন্ত্রণ জানান')}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Tournaments List Section */}
            <div id="tournaments-section" className="space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-heading font-extrabold text-white tracking-wide">
                      {pickLocalized(
                        lang,
                        'Live & Upcoming Free Fire Tournaments',
                        'लाइव और आगामी टूर्नामेंट्स',
                        'লাইভ ও আসন্ন ফ্রি ফায়ার টুর্নামেন্ট'
                      )}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400">
                      <Radio className="w-3 h-3 animate-pulse" />
                      LIVE SYNC
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {pickLocalized(
                      lang,
                      'Select a match, book your squad slot, and enter the battlefield',
                      'मैच चुनें, अपनी स्लॉट बुक करें और मैदान में उतरें',
                      'ম্যাচ বেছে নিন, আপনার স্কোয়াড স্লট বুক করুন এবং লড়াইয়ে নামুন'
                    )}
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={pickLocalized(
                      lang,
                      'Search map, mode or title...',
                      'मैप या टूर्नामेंट खोजें...',
                      'ম্যাপ, মোড বা টুর্নামেন্ট খুঁজুন...'
                    )}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-zinc-900/80 border border-zinc-800/80 rounded-xl overflow-x-auto">
                <button
                  onClick={() => setFilterMode('ALL')}
                  className={`px-3.5 py-1.5 text-xs font-heading font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    filterMode === 'ALL' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.filterAll}
                </button>
                <button
                  onClick={() => setFilterMode('SQUAD')}
                  className={`px-3.5 py-1.5 text-xs font-heading font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    filterMode === 'SQUAD' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.filterSquad}
                </button>
                <button
                  onClick={() => setFilterMode('SOLO')}
                  className={`px-3.5 py-1.5 text-xs font-heading font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    filterMode === 'SOLO' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.filterSolo}
                </button>
                <button
                  onClick={() => setFilterMode('DUO')}
                  className={`px-3.5 py-1.5 text-xs font-heading font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    filterMode === 'DUO' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.filterDuo}
                </button>
                <button
                  onClick={() => setFilterMode('FREE')}
                  className={`px-3.5 py-1.5 text-xs font-heading font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    filterMode === 'FREE' ? 'bg-cyan-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.filterFree}
                </button>
                <button
                  onClick={() => setFilterMode('MEGA')}
                  className={`px-3.5 py-1.5 text-xs font-heading font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    filterMode === 'MEGA' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.filterHighPrize}
                </button>
              </div>

              {/* Tournament Grid */}
              {!tournamentsLoaded ? (
                <div className="py-12 text-center text-zinc-400 font-mono text-xs">
                  {pickLocalized(
                    lang,
                    'Loading live tournaments from Firestore...',
                    'लाइव टूर्नामेंट लोड हो रहे हैं...',
                    'লাইভ টুর্নামেন্ট লোড হচ্ছে...'
                  )}
                </div>
              ) : filteredTournaments.length === 0 ? (
                <div className="py-12 text-center rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
                  <p className="text-zinc-400 font-mono text-xs">
                    {tournaments.length === 0
                      ? pickLocalized(
                          lang,
                          'No live tournaments published yet. Any tournament created by Admin will appear here in real time.',
                          'अभी कोई लाइव टूर्नामेंट नहीं है। एडमिन द्वारा नया टूर्नामेंट बनाते ही यहाँ तुरंत दिखेगा।',
                          'এখনও কোনো লাইভ টুর্নামেন্ট প্রকাশিত হয়নি। অ্যাডমিন তৈরি করলেই এখানে সাথে সাথে দেখা যাবে।'
                        )
                      : pickLocalized(
                          lang,
                          'No tournaments found matching current filter.',
                          'इस फ़िल्टर में कोई टूर्नामेंट नहीं मिला।',
                          'এই ফিল্টারে কোনো টুর্নামেন্ট পাওয়া যায়নি।'
                        )}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTournaments.map((tournament) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      lang={lang}
                      isJoined={user.joinedTournamentIds.includes(tournament.id)}
                      onSelect={(tourney) => setSelectedTourneyForDetails(tourney)}
                      onJoinDirect={(tourney) => handleOpenBooking(tourney)}
                      onViewRoomCredentials={(tourney) => setSelectedTourneyForDetails(tourney)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MY MATCHES */}
        {activeTab === 'my-matches' && (
          <MyMatchesView
            joinedTournaments={joinedTournamentsList}
            lang={lang}
            user={user}
            onExploreTournaments={() => setActiveTab('tournaments')}
            onSubmitResultProof={handleSubmitResultProof}
            onSimulateRoomAlert={triggerRoomReleaseAlert}
          />
        )}

        {/* TAB 3: LEADERBOARD */}
        {activeTab === 'leaderboard' && <LeaderboardView results={leaderboards} lang={lang} />}

        {/* TAB 4: WALLET (ADD MONEY, WITHDRAW & PAYOUT TRACKER) */}
        {activeTab === 'wallet' && (
          <WalletPageView
            lang={lang}
            user={user}
            isAuthenticated={isVerifiedSignedIn}
            onRequireAuth={() => setIsAuthModalOpen(true)}
            transactions={transactions}
            depositRequests={depositRequests}
            withdrawRequests={withdrawRequests}
            paymentSettings={paymentSettings}
            onSubmitDepositRequest={handleSubmitDepositRequest}
            onWithdraw={handleWithdraw}
          />
        )}

        {/* TAB 4B: RULES & REGULATIONS */}
        {activeTab === 'rules' && (
          <RulesPageView
            lang={lang}
            onExploreTournaments={() => handleTabChange('tournaments')}
            onOpenMyMatches={() => handleTabChange('my-matches')}
          />
        )}

        {/* TAB 4C: REFER & EARN */}
        {activeTab === 'refer' && (
          <ReferAndEarnView
            user={user}
            lang={lang}
            referrals={referrals}
            onRedeemReferralCode={handleRedeemFriendReferralCode}
            onOpenApkModal={() => setIsPublishOpen(true)}
          />
        )}

        {/* TAB 5: ADMIN & ORGANIZER PANEL (PROTECTED) */}
        {activeTab === 'admin' && isAdminAuthenticated && (
          <AdminPanel
            tournaments={tournaments}
            lang={lang}
            user={user}
            isFirebaseAdmin={isFirebaseAdmin}
            firebaseEmail={firebaseUser?.email}
            onSignInFirebaseAdmin={handleSignInFirebaseAdmin}
            depositRequests={adminDepositRequests}
            withdrawRequests={adminWithdrawRequests}
            allUsers={adminAllUsers}
            paymentSettings={paymentSettings}
            onSavePaymentSettings={handleSavePaymentSettings}
            onApproveDeposit={handleApproveDeposit}
            onRejectDeposit={handleRejectDeposit}
            onApproveWithdraw={handleApproveWithdraw}
            onRejectWithdraw={handleRejectWithdraw}
            onToggleUserBan={handleToggleUserBan}
            onAdjustUserWallet={handleAdminAdjustUserWallet}
            onSeedStarterTournaments={handleSeedStarterTournaments}
            onUpdateTournament={handleUpdateTournament}
            onDeleteTournament={handleDeleteTournament}
            onOpenCreateTournament={() => {
              if (requireVerifiedAuth()) setIsHostOpen(true);
            }}
            onReleaseRoomCredentials={handleAdminReleaseRoom}
            onDisbursePrize={handleAdminDisbursePrize}
            onClose={() => handleTabChange('tournaments')}
            onLogoutAdmin={handleAdminLogout}
          />
        )}

        {/* TAB 6: USER PROFILE & MATCH HISTORY */}
        {activeTab === 'profile' && (
          <UserProfileView
            user={user}
            isAuthenticated={isVerifiedSignedIn}
            transactions={transactions}
            matchResults={leaderboards}
            tournaments={tournaments}
            lang={lang}
            onChangeLanguage={handleChangeLanguage}
            onUpdateProfile={handleUpdateOwnProfile}
            onOpenWallet={() => handleTabChange('wallet')}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onSignOut={handleSignOut}
            onOpenApkModal={() => setIsPublishOpen(true)}
            onOpenRefer={() => handleTabChange('refer')}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800">
        <div
          className={`grid ${isAdminAuthenticated ? 'grid-cols-7' : 'grid-cols-6'} items-center h-16`}
        >
          <button
            onClick={() => handleTabChange('tournaments')}
            className={`flex flex-col items-center justify-center h-full px-0.5 transition-colors ${
              activeTab === 'tournaments' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9.5px] font-medium tracking-tight mt-1 truncate max-w-full">
              {t.navTournaments}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('my-matches')}
            className={`flex flex-col items-center justify-center h-full px-0.5 transition-colors relative ${
              activeTab === 'my-matches' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Ticket className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9.5px] font-medium tracking-tight mt-1 truncate max-w-full">
              {t.navMyMatches}
            </span>
            {user.joinedTournamentIds.length > 0 && (
              <span className="absolute top-2 right-3 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => handleTabChange('leaderboard')}
            className={`flex flex-col items-center justify-center h-full px-0.5 transition-colors ${
              activeTab === 'leaderboard' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9.5px] font-medium tracking-tight mt-1 truncate max-w-full">
              {t.navLeaderboard}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('rules')}
            className={`flex flex-col items-center justify-center h-full px-0.5 transition-colors ${
              activeTab === 'rules' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9.5px] font-medium tracking-tight mt-1 truncate max-w-full">
              {t.navRules}
            </span>
          </button>

          {isAdminAuthenticated && (
            <button
              onClick={() => handleTabChange('admin')}
              className={`flex flex-col items-center justify-center h-full px-0.5 transition-colors ${
                activeTab === 'admin' ? 'text-orange-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[9.5px] font-medium tracking-tight mt-1 truncate max-w-full">
                Admin
              </span>
            </button>
          )}

          <button
            onClick={() => handleTabChange('wallet')}
            className={`flex flex-col items-center justify-center h-full px-0.5 transition-colors ${
              activeTab === 'wallet' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            <span className="text-[9.5px] font-medium tracking-tight mt-1 font-mono text-emerald-400 truncate max-w-full">
              ₹{user.walletBalance}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('profile')}
            className={`flex flex-col items-center justify-center h-full px-0.5 transition-colors ${
              activeTab === 'profile' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9.5px] font-medium tracking-tight mt-1 truncate max-w-full">
              {t.navProfile}
            </span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900 bg-zinc-950 py-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-2 font-heading font-bold text-sm text-zinc-400">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>BOOYAH ARENA ESPORTS PLATFORM</span>
          </div>
          <p className="max-w-xl mx-auto text-[11px] text-zinc-600 leading-relaxed">
            Free Fire is a registered trademark of Garena International. BooyahArena is an independent esports tournament platform for competitive scrims. 100% fair play, zero emulators, instant UPI rewards.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                if (isAdminAuthenticated) {
                  handleTabChange('admin');
                } else {
                  setAdminAccessError('');
                  setIsAdminAuthOpen(true);
                }
              }}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <Lock className="w-3 h-3" />
              <span>
                {isAdminAuthenticated
                  ? pickLocalized(lang, 'Open Admin Panel', 'एडमिन पैनल खोलें', 'অ্যাডমিন প্যানেল খুলুন')
                  : pickLocalized(lang, 'Organizer Access', 'ऑर्गनाइजर लॉगिन', 'অর্গানাইজার লগইন')}
              </span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TournamentDetailsModal
        tournament={selectedTourneyForDetails}
        isOpen={Boolean(selectedTourneyForDetails)}
        onClose={() => setSelectedTourneyForDetails(null)}
        lang={lang}
        isJoined={
          selectedTourneyForDetails
            ? user.joinedTournamentIds.includes(selectedTourneyForDetails.id)
            : false
        }
        onOpenBooking={(tourney, slot) => handleOpenBooking(tourney, slot)}
      />

      <SlotBookingModal
        tournament={selectedTourneyForBooking}
        initialSlot={preselectedSlotNumber}
        isOpen={Boolean(selectedTourneyForBooking)}
        onClose={() => {
          setSelectedTourneyForBooking(null);
          setPreselectedSlotNumber(undefined);
        }}
        lang={lang}
        user={user}
        onConfirmBooking={handleConfirmBooking}
        onOpenWallet={() => {
          setSelectedTourneyForBooking(null);
          handleTabChange('wallet');
        }}
        onGoToMyMatches={() => handleTabChange('my-matches')}
      />

      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        lang={lang}
        user={user}
        isAuthenticated={isVerifiedSignedIn}
        onRequireAuth={() => {
          setIsWalletOpen(false);
          setIsAuthModalOpen(true);
        }}
        transactions={transactions}
        depositRequests={depositRequests}
        withdrawRequests={withdrawRequests}
        paymentSettings={paymentSettings}
        onSubmitDepositRequest={handleSubmitDepositRequest}
        onWithdraw={handleWithdraw}
      />

      <HostTournamentModal
        isOpen={isHostOpen}
        onClose={() => setIsHostOpen(false)}
        lang={lang}
        user={user}
        isAdminMode={activeTab === 'admin' && isAdminAuthenticated && isFirebaseAdmin}
        onCreateTournament={handleCreateTournament}
      />

      <DailyRewardModal
        isOpen={isDailyBonusOpen}
        onClose={() => setIsDailyBonusOpen(false)}
        lang={lang}
        onClaim={handleClaimDailyCoins}
        alreadyClaimed={isTodayClaimed}
      />

      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} lang={lang} />

      <NotificationToast
        notification={activeToast}
        lang={lang}
        onClose={() => setActiveToast(null)}
        onOpenMatch={(tourneyId) => handleSelectNotification(tourneyId)}
      />

      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        lang={lang}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onClearNotifications={handleClearNotifications}
        onSelectNotification={handleSelectNotification}
        onSimulateRelease={() => triggerRoomReleaseAlert()}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      <PublishModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        lang={lang}
      />

      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => {
          setIsAdminAuthOpen(false);
          if (activeTab === 'admin' && !isAdminAuthenticated) {
            setActiveTab('tournaments');
          }
        }}
        onAuthenticated={handleAdminAuthenticated}
        lang={lang}
        unauthorizedNotice={adminAccessError}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        lang={lang}
        currentFirebaseUser={firebaseUser}
      />

      <OfflineIndicator />
    </div>
  );
}
