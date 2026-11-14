export type GameMode = 'SOLO' | 'DUO' | 'SQUAD' | 'CLASH_SQUAD';
export type TournamentStatus = 'UPCOMING' | 'ROOM_OPEN' | 'LIVE' | 'COMPLETED';
export type MapType = 'Bermuda' | 'Purgatory' | 'Kalahari' | 'Alpine' | 'NexTerra';

export interface TournamentSlot {
  slotNumber: number;
  teamName?: string;
  isLocked: boolean;
  players: {
    ign: string;
    uid: string;
    avatar?: string;
  }[];
}

export interface Tournament {
  id: string;
  title: string;
  titleHi: string;
  mode: GameMode;
  map: MapType;
  bannerImage: string;
  prizePool: number;
  currency: 'INR' | 'COINS';
  entryFee: number;
  perKillPrize: number;
  firstPlacePrize: number;
  secondPlacePrize: number;
  thirdPlacePrize: number;
  totalSlots: number;
  filledSlots: number;
  startTime: string; // ISO or readable
  roomId?: string;
  roomPassword?: string;
  roomUnlocksAt: string; // 15 mins before
  status: TournamentStatus;
  organizer: string;
  isVerified: boolean;
  isFeatured?: boolean;
  deviceType: 'MOBILE_ONLY' | 'ALL_DEVICES';
  gunAttributes: boolean;
  visibility?: 'PUBLIC';
  slots: TournamentSlot[];
  rules: string[];
  createdByUid?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  name: string;
  username?: string;
  mobileNumber?: string;
  referralCode?: string;
  myReferralCode?: string;
  referredByCode?: string;
  referredByUid?: string;
  referralRewardClaimed?: boolean;
  referralCount?: number;
  referralEarningsCoins?: number;
  referralEarningsCash?: number;
  ign: string;
  ffUid: string;
  walletBalance: number; // in INR
  coinsBalance: number; // Booyah diamonds/coins
  matchesPlayed: number;
  totalKills: number;
  booyahs: number;
  joinedTournamentIds: string[];
  claimedDailyRewardDate?: string;
  isBanned?: boolean;
  role?: 'player' | 'admin';
}

export interface ReferralRecord {
  id: string;
  referrerUid: string;
  referrerIgn: string;
  referrerCode: string;
  referredUid: string;
  referredIgn: string;
  referrerBonusCoins: number;
  referrerBonusCash: number;
  referredBonusCoins: number;
  referredBonusCash: number;
  status: 'CREDITED';
  createdAtLabel?: string;
}

export interface Transaction {
  id: string;
  userId?: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'ENTRY_FEE' | 'PRIZE_WON' | 'DAILY_BONUS' | 'REFERRAL_BONUS';
  amount: number;
  currency: 'INR' | 'COINS';
  description: string;
  descriptionHi: string;
  date: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  referenceId?: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userIgn: string;
  amount: number;
  upiTransactionId: string;
  payerUpiId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string;
  reviewedBy?: string;
  createdAtLabel?: string;
}

export interface WithdrawRequest {
  id: string;
  userId: string;
  userName: string;
  userIgn: string;
  amount: number;
  upiId: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  payoutRef?: string;
  createdAtLabel?: string;
}

export interface PaymentSettings {
  upiId: string;
  merchantName: string;
  instructions: string;
  qrImageUrl?: string;
}

export interface MatchResult {
  tournamentId: string;
  tournamentTitle: string;
  date: string;
  winningTeam: string;
  winningPlayers: string[];
  totalKills: number;
  topFragger: {
    ign: string;
    kills: number;
  };
  leaderboard: {
    rank: number;
    teamName: string;
    players: string[];
    placementPoints: number;
    killPoints: number;
    totalPoints: number;
    prizeWon: number;
  }[];
}

export interface AppNotification {
  id: string;
  tournamentId: string;
  type: 'ROOM_RELEASED' | 'SLOT_CONFIRMED' | 'MATCH_STARTING' | 'PRIZE_WON';
  title: string;
  titleHi: string;
  message: string;
  messageHi: string;
  roomId?: string;
  roomPassword?: string;
  timestamp: string;
  isRead: boolean;
}
