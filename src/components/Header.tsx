import React, { useState, useRef, useEffect } from 'react';
import { Flame, Wallet, PlusCircle, Trophy, Ticket, BarChart3, Globe, ShieldCheck, ShieldAlert, Bell, LogIn, ChevronDown, Check, Gift } from 'lucide-react';
import { translations, Language, SUPPORTED_LANGUAGES, pickLocalized } from '../utils/translations';
import { UserProfile } from '../types/tournament';

interface HeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  activeTab: 'tournaments' | 'my-matches' | 'leaderboard' | 'wallet' | 'rules' | 'refer' | 'admin' | 'profile';
  setActiveTab: (tab: 'tournaments' | 'my-matches' | 'leaderboard' | 'wallet' | 'rules' | 'refer' | 'admin' | 'profile') => void;
  user: UserProfile;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
  onOpenWallet: () => void;
  onOpenHostModal: () => void;
  onOpenDailyBonus: () => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  isAdminAuthenticated: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  activeTab,
  setActiveTab,
  user,
  isAuthenticated,
  onOpenAuth,
  onOpenWallet,
  onOpenHostModal,
  onOpenDailyBonus,
  unreadNotificationsCount,
  onOpenNotifications,
  isAdminAuthenticated,
}) => {
  const t = translations[lang];
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const currentLangOption =
    SUPPORTED_LANGUAGES.find((item) => item.code === lang) || SUPPORTED_LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 md:gap-8">
        
        {/* Zone 1: Single text element wordmark with flame emblem */}
        <div 
          onClick={() => setActiveTab('tournaments')}
          className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-zinc-950 shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 fill-zinc-950" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-xl tracking-wider text-white group-hover:text-amber-400 transition-colors">
              BOOYAH<span className="text-amber-500">ARENA</span>
            </span>
            <span className="text-[10px] tracking-widest text-zinc-400 font-mono -mt-1 hidden sm:inline">
              FREE FIRE ESPORTS
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`flex items-center gap-2 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'tournaments'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-500'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>{t.navTournaments}</span>
          </button>

          <button
            onClick={() => setActiveTab('my-matches')}
            className={`flex items-center gap-2 py-1.5 transition-colors whitespace-nowrap shrink-0 relative ${
              activeTab === 'my-matches'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-500'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>{t.navMyMatches}</span>
            {user.joinedTournamentIds.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'leaderboard'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-500'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{t.navLeaderboard}</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'rules'
                ? 'text-emerald-400 font-semibold border-b-2 border-emerald-500'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{t.navRules}</span>
          </button>

          <button
            onClick={() => setActiveTab('refer')}
            className={`flex items-center gap-2 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'refer'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-500'
                : 'text-zinc-400 hover:text-amber-300'
            }`}
          >
            <Gift className="w-4 h-4 text-amber-400" />
            <span>{pickLocalized(lang, 'Refer & Earn', 'रेफर व कमाएं', 'রেফার ও আয়')}</span>
          </button>

          {isAdminAuthenticated && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'admin'
                  ? 'text-orange-400 font-semibold border-b-2 border-orange-500'
                  : 'text-zinc-400 hover:text-orange-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <span>{t.navAdmin}</span>
            </button>
          )}

          <button
            onClick={onOpenHostModal}
            className="flex items-center gap-1.5 py-1.5 text-zinc-300 hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-amber-500" />
            <span>{t.navHost}</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action & Utilities */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Daily Coins Bonus Button */}
          <button
            onClick={onOpenDailyBonus}
            title={t.dailyBonus}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-amber-300 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
          >
            <span className="text-amber-400 font-mono font-bold">💎 {user.coinsBalance}</span>
            <span className="text-[10px] text-zinc-400">Coins</span>
          </button>

          {/* Wallet Balance Pill */}
          <button
            onClick={onOpenWallet}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono hover:border-amber-500/50 hover:bg-zinc-800 transition-all text-zinc-100 whitespace-nowrap shrink-0"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span className="tabular-nums font-semibold text-emerald-400">₹{user.walletBalance}</span>
          </button>

          {/* Notification Bell with unread pulse badge */}
          <button
            onClick={onOpenNotifications}
            title={t.alertsAndRoomId}
            className="relative p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-zinc-950 font-mono font-bold text-[9px] flex items-center justify-center animate-pulse shadow-md">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Multi-Language Switcher (English, Hindi, Bengali) */}
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setLangMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold">{currentLangOption.shortCode}</span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl py-1.5 z-50">
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  Select Language
                </div>
                {SUPPORTED_LANGUAGES.map((option) => {
                  const active = option.code === lang;
                  return (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => {
                        setLang(option.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                        active
                          ? 'bg-amber-500/15 text-amber-400 font-bold'
                          : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                      }`}
                    >
                      <span>
                        {option.nativeLabel}{' '}
                        <span className="text-[10px] text-zinc-500 font-mono">
                          ({option.label})
                        </span>
                      </span>
                      {active && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Auth / Player Profile Quick Button */}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              title={t.navProfile}
              className={`flex items-center gap-2 pl-2 border-l border-zinc-800 rounded-r-lg py-1 pr-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'profile'
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'hover:bg-zinc-900'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-xs font-bold text-zinc-950 shadow-inner ${
                  activeTab === 'profile' ? 'ring-2 ring-amber-400' : ''
                }`}
              >
                {(user.name || user.ign || 'TG').slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-zinc-100 leading-tight truncate max-w-[90px]">
                  {user.ign}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 leading-tight">
                  UID: {user.ffUid}
                </span>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-heading font-bold text-xs tracking-wide shadow-md shadow-orange-500/20 transition-all whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{pickLocalized(lang, 'Login / Sign Up', 'लॉगिन / साइन अप', 'লগইন / সাইন আপ')}</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
