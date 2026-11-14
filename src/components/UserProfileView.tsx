import React, { useState } from 'react';
import {
  User,
  Edit3,
  Check,
  X,
  Trophy,
  Crosshair,
  Flame,
  Wallet,
  ShieldCheck,
  LogOut,
  LogIn,
  Globe,
  CheckCircle2,
  Gift,
  ChevronRight,
} from 'lucide-react';
import { UserProfile, Transaction, MatchResult, Tournament } from '../types/tournament';
import {
  translations,
  Language,
  SUPPORTED_LANGUAGES,
  pickLocalized,
} from '../utils/translations';
import { MatchHistory } from './MatchHistory';
import { PWAInstallButton } from './PWAInstallButton';

interface UserProfileViewProps {
  user: UserProfile;
  isAuthenticated: boolean;
  transactions: Transaction[];
  matchResults: MatchResult[];
  tournaments: Tournament[];
  lang: Language;
  onChangeLanguage: (lang: Language) => void;
  onUpdateProfile: (updates: Partial<Pick<UserProfile, 'name' | 'ign' | 'ffUid'>>) => void;
  onOpenWallet: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenApkModal?: () => void;
  onOpenRefer?: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  isAuthenticated,
  transactions,
  matchResults,
  tournaments,
  lang,
  onChangeLanguage,
  onUpdateProfile,
  onOpenWallet,
  onOpenAuth,
  onSignOut,
  onOpenApkModal,
  onOpenRefer,
}) => {
  const t = translations[lang];
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user.name);
  const [ignInput, setIgnInput] = useState(user.ign);
  const [uidInput, setUidInput] = useState(user.ffUid);

  const initials = (user.name || user.ign || 'TG')
    .slice(0, 2)
    .toUpperCase();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ignInput.trim() || !uidInput.trim()) return;
    onUpdateProfile({
      name: nameInput.trim() || user.name,
      ign: ignInput.trim(),
      ffUid: uidInput.trim(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setNameInput(user.name);
    setIgnInput(user.ign);
    setUidInput(user.ffUid);
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      {/* Player Identity & Career Overview Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-xl font-heading font-extrabold text-zinc-950 shadow-lg shadow-orange-500/20 shrink-0">
              {initials}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.verifiedMobilePlayer}</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="text-zinc-400">UID: {user.ffUid}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-wide">
                {user.ign}
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                {user.username ? `@${user.username}` : user.name}
                {user.mobileNumber ? ` · ${user.mobileNumber}` : ''}
                {user.email ? ` · ${user.email}` : ''}
              </p>
              {user.referralCode && (
                <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-400">
                  <span>Referral: {user.referralCode}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
            <button
              type="button"
              onClick={onOpenWallet}
              className="py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-heading font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Wallet className="w-4 h-4" />
              <span>₹{user.walletBalance}</span>
            </button>

            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-heading font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t.editProfile}</span>
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="py-2 px-3.5 rounded-xl bg-zinc-800 hover:bg-red-500/20 hover:text-red-300 border border-zinc-700 text-zinc-300 text-xs font-heading font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.signOut}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-heading font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login / Sign Up</span>
              </button>
            )}
          </div>
        </div>

        {/* Inline Edit Form */}
        {isEditing && (
          <form
            onSubmit={handleSave}
            className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
          >
            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                {t.displayName}
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                {t.inGameName}
              </label>
              <input
                type="text"
                required
                value={ignInput}
                onChange={(e) => setIgnInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                  {t.freeFireUid}
                </label>
                <input
                  type="text"
                  required
                  value={uidInput}
                  onChange={(e) => setUidInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors"
                title={t.saveProfile}
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Career Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>{t.matchesPlayedLabel}</span>
              <Trophy className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-2xl font-mono font-bold text-white tabular-nums mt-1">
              {user.matchesPlayed}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>{t.booyahWinsLabel}</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-mono font-bold text-amber-400 tabular-nums mt-1">
              {user.booyahs}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>{t.totalKillsLabel}</span>
              <Crosshair className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-mono font-bold text-orange-400 tabular-nums mt-1">
              {user.totalKills}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>{t.booyahCoinsLabel}</span>
              <User className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-mono font-bold text-cyan-400 tabular-nums mt-1">
              💎 {user.coinsBalance}
            </div>
          </div>
        </div>
      </div>

      {/* App Settings: Language Switcher Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-heading font-extrabold text-white">
                {t.languageSettingsTitle}
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                {t.languageSettingsSub}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SUPPORTED_LANGUAGES.map((option) => {
            const isSelected = lang === option.code;
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => onChangeLanguage(option.code)}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm text-white">
                      {option.nativeLabel}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      ({option.label})
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                    {option.subtitle}
                  </div>
                </div>

                {isSelected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500 text-zinc-950 text-[10px] font-mono font-bold shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    {t.languageActiveBadge}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                    {pickLocalized(lang, 'Select', 'चुनें', 'বেছে নিন')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Refer & Earn Summary Card */}
      {onOpenRefer && (
        <div
          onClick={onOpenRefer}
          className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-zinc-900/90 to-zinc-900/90 p-5 sm:p-6 cursor-pointer hover:border-amber-400 transition-all flex items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-heading font-extrabold text-white">
                {pickLocalized(
                  lang,
                  'Refer & Earn ₹10 + 50 Coins Per Friend',
                  'रेफर करें व प्रति दोस्त ₹10 + 50 कॉइन्स पाएं',
                  'রেফার করুন ও বন্ধু প্রতি ₹১০ + ৫০ কয়েন জিতুন'
                )}
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                {pickLocalized(
                  lang,
                  `Your Code: ${user.myReferralCode || 'Loading...'} · ${user.referralCount ?? 0} Referrals`,
                  `आपका कोड: ${user.myReferralCode || 'Loading...'} · ${user.referralCount ?? 0} रेफरल`,
                  `আপনার কোড: ${user.myReferralCode || 'Loading...'} · ${user.referralCount ?? 0} রেফারেল`
                )}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-400 shrink-0" />
        </div>
      )}

      {/* Install App & Android APK Export */}
      <PWAInstallButton lang={lang} onOpenApkModal={onOpenApkModal} />

      {/* Match History Section */}
      <MatchHistory
        user={user}
        transactions={transactions}
        matchResults={matchResults}
        tournaments={tournaments}
        lang={lang}
      />
    </div>
  );
};
