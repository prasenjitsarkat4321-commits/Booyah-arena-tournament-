import React, { useMemo, useState } from 'react';
import {
  Trophy,
  Crosshair,
  Award,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  Coins,
  Users,
  Receipt,
} from 'lucide-react';
import { MatchResult, Transaction, Tournament, UserProfile } from '../types/tournament';
import { translations, Language, pickLocalized } from '../utils/translations';

export interface MatchHistoryRecord {
  id: string;
  tournamentTitle: string;
  date: string;
  placement: number | null;
  kills: number;
  teamKills?: number;
  placementPoints?: number;
  totalPoints?: number;
  earnedReward: number;
  currency: 'INR' | 'COINS';
  teamName?: string;
  players?: string[];
  isMvp?: boolean;
  source: 'OFFICIAL_RESULT' | 'TRANSACTION_LOG' | 'COMPLETED_TOURNEY';
  sourceLabel: string;
  txId?: string;
  description?: string;
  leaderboardSnapshot?: MatchResult['leaderboard'];
}

interface MatchHistoryProps {
  user: UserProfile;
  transactions: Transaction[];
  matchResults: MatchResult[];
  tournaments: Tournament[];
  lang: Language;
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({
  user,
  transactions,
  matchResults,
  tournaments,
  lang,
}) => {
  const t = translations[lang];
  const [filter, setFilter] = useState<'ALL' | 'TOP3' | 'REWARDS'>('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const records = useMemo<MatchHistoryRecord[]>(() => {
    const items: MatchHistoryRecord[] = [];
    const seenTitles = new Set<string>();
    const ignLower = user.ign.trim().toLowerCase();

    // 1. Pull from official matchResults (leaderboard history)
    matchResults.forEach((res) => {
      const playerRow = res.leaderboard.find((row) =>
        row.players.some((p) => p.trim().toLowerCase() === ignLower)
      );

      if (playerRow) {
        const isMvp = res.topFragger.ign.trim().toLowerCase() === ignLower;
        const playerKills = isMvp ? res.topFragger.kills : playerRow.killPoints;

        seenTitles.add(res.tournamentTitle.toLowerCase());
        items.push({
          id: `res_${res.tournamentId}`,
          tournamentTitle: res.tournamentTitle,
          date: res.date,
          placement: playerRow.rank,
          kills: playerKills,
          teamKills: playerRow.killPoints,
          placementPoints: playerRow.placementPoints,
          totalPoints: playerRow.totalPoints,
          earnedReward: playerRow.prizeWon,
          currency: 'INR',
          teamName: playerRow.teamName,
          players: playerRow.players,
          isMvp,
          source: 'OFFICIAL_RESULT',
          sourceLabel: pickLocalized(lang, 'Official Scoreboard', 'ऑफिशियल स्कोरबोर्ड', 'অফিশিয়াল স্কোরবোর্ড'),
          leaderboardSnapshot: res.leaderboard,
        });
      }
    });

    // 2. Pull from transaction history (PRIZE_WON records)
    transactions.forEach((tx) => {
      if (tx.type !== 'PRIZE_WON') return;

      const desc = tx.description;
      const placeMatch = desc.match(/(\d+)(?:st|nd|rd|th)\s*Place/i);
      const booyahMatch = /booyah|1st/i.test(desc);
      const killsMatch = desc.match(/(\d+)\s*kills?/i);
      const inTourneyMatch = desc.match(/\bin\s+(.+)$/i);

      const placement = placeMatch ? Number(placeMatch[1]) : booyahMatch ? 1 : null;
      const kills = killsMatch ? Number(killsMatch[1]) : 0;

      let parsedTitle = inTourneyMatch ? inTourneyMatch[1].trim() : '';
      if (!parsedTitle || parsedTitle.toLowerCase() === 'match') {
        parsedTitle = pickLocalized(lang, 'Free Fire Custom Scrim', 'फ्री फायर कस्टम मैच', 'ফ্রি ফায়ার কাস্টম ম্যাচ');
      }

      // Avoid duplicating an official match result with the exact same title
      if (seenTitles.has(parsedTitle.toLowerCase())) {
        return;
      }

      items.push({
        id: `tx_${tx.id}`,
        tournamentTitle: parsedTitle,
        date: tx.date,
        placement,
        kills,
        earnedReward: tx.amount,
        currency: tx.currency,
        teamName: user.ign,
        source: 'TRANSACTION_LOG',
        sourceLabel: pickLocalized(lang, 'Wallet Prize Log', 'वॉलेट प्राइज लॉग', 'ওয়ালেট প্রাইজ লগ'),
        txId: tx.id,
        description: lang === 'hi' ? tx.descriptionHi : tx.description,
      });
    });

    // 3. Pull any joined tournaments marked COMPLETED that aren't already represented
    tournaments.forEach((tourney) => {
      if (
        tourney.status === 'COMPLETED' &&
        user.joinedTournamentIds.includes(tourney.id) &&
        !seenTitles.has(tourney.title.toLowerCase())
      ) {
        const userSlot = tourney.slots.find((s) =>
          s.players.some((p) => p.ign.toLowerCase() === ignLower || p.uid === user.ffUid)
        );
        items.push({
          id: `comp_${tourney.id}`,
          tournamentTitle: lang === 'hi' ? tourney.titleHi : tourney.title,
          date: tourney.startTime,
          placement: null,
          kills: 0,
          earnedReward: 0,
          currency: tourney.currency,
          teamName: userSlot?.teamName || user.ign,
          players: userSlot?.players.map((p) => p.ign),
          source: 'COMPLETED_TOURNEY',
          sourceLabel: pickLocalized(lang, 'Completed Tournament', 'समाप्त टूर्नामेंट', 'সম্পন্ন টুর্নামেন্ট'),
        });
      }
    });

    return items;
  }, [user, transactions, matchResults, tournaments, lang]);

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const titleMatch = rec.tournamentTitle.toLowerCase().includes(q);
        const teamMatch = rec.teamName?.toLowerCase().includes(q);
        if (!titleMatch && !teamMatch) return false;
      }
      if (filter === 'TOP3') {
        return rec.placement !== null && rec.placement <= 3;
      }
      if (filter === 'REWARDS') {
        return rec.earnedReward > 0;
      }
      return true;
    });
  }, [records, filter, search]);

  const summary = useMemo(() => {
    const totalMatches = records.length;
    const totalKills = records.reduce((sum, r) => sum + r.kills, 0);
    const totalCashWon = records
      .filter((r) => r.currency === 'INR')
      .reduce((sum, r) => sum + r.earnedReward, 0);
    const ranked = records.filter((r) => r.placement !== null);
    const avgRank =
      ranked.length > 0
        ? (ranked.reduce((sum, r) => sum + (r.placement || 0), 0) / ranked.length).toFixed(1)
        : '-';
    return { totalMatches, totalKills, totalCashWon, avgRank };
  }, [records]);

  const formatPlacement = (rank: number | null) => {
    if (rank === null) return pickLocalized(lang, 'Settled', 'पूर्ण', 'সম্পন্ন');
    if (rank === 1) return '#1 Booyah';
    if (rank === 2) return '#2 Runner-up';
    if (rank === 3) return '#3 Podium';
    return `#${rank}`;
  };

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-heading font-extrabold text-white tracking-wide">
            {t.matchHistoryTitle}
          </h3>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">{t.matchHistorySub}</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={pickLocalized(lang, 'Search match or team...', 'मैच या टीम खोजें...', 'ম্যাচ বা টিম খুঁজুন...')}
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* History Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-[11px] font-mono text-zinc-400">
            {pickLocalized(lang, 'Logged Matches', 'रिकॉर्ड किए गए मैच', 'রেকর্ড করা ম্যাচ')}
          </div>
          <div className="text-lg font-mono font-bold text-white tabular-nums mt-0.5">
            {summary.totalMatches}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-[11px] font-mono text-zinc-400">
            {pickLocalized(lang, 'Avg Placement', 'औसत रैंक', 'গড় অবস্থান')}
          </div>
          <div className="text-lg font-mono font-bold text-amber-400 tabular-nums mt-0.5">
            #{summary.avgRank}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-[11px] font-mono text-zinc-400">
            {pickLocalized(lang, 'Verified Kills', 'इतिहास किल्स', 'যাচাইকৃত কিল')}
          </div>
          <div className="text-lg font-mono font-bold text-orange-400 tabular-nums mt-0.5">
            {summary.totalKills}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-[11px] font-mono text-zinc-400">
            {pickLocalized(lang, 'Total Earned', 'कुल जीता इनाम', 'মোট অর্জিত পুরস্কার')}
          </div>
          <div className="text-lg font-mono font-bold text-emerald-400 tabular-nums mt-0.5">
            ₹{summary.totalCashWon.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl w-fit">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-bold transition-colors whitespace-nowrap ${
            filter === 'ALL' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {t.filterHistoryAll}
        </button>
        <button
          onClick={() => setFilter('TOP3')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-bold transition-colors whitespace-nowrap ${
            filter === 'TOP3' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {t.filterHistoryWins}
        </button>
        <button
          onClick={() => setFilter('REWARDS')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-bold transition-colors whitespace-nowrap ${
            filter === 'REWARDS' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {t.filterHistoryRewards}
        </button>
      </div>

      {/* Match History List */}
      {filteredRecords.length === 0 ? (
        <div className="p-10 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-2">
          <Trophy className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-xs font-mono text-zinc-400">{t.noMatchHistory}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((rec) => {
            const isExpanded = expandedId === rec.id;
            const isBooyah = rec.placement === 1;
            const isTop3 = rec.placement !== null && rec.placement <= 3;

            return (
              <div
                key={rec.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/90 hover:border-zinc-700 transition-colors overflow-hidden"
              >
                {/* Main Row */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                  className="w-full p-4 sm:p-5 text-left flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Placement Rank & Match Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-mono font-extrabold text-sm shrink-0 border ${
                        isBooyah
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : isTop3
                          ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800'
                      }`}
                    >
                      {rec.placement !== null ? `#${rec.placement}` : '✓'}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-400">
                        <span className={isBooyah ? 'text-amber-400 font-bold' : 'text-zinc-300 font-semibold'}>
                          {formatPlacement(rec.placement)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{rec.date}</span>
                        <span aria-hidden="true">·</span>
                        <span>{rec.sourceLabel}</span>
                        {rec.isMvp && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-red-400 font-bold">MVP Top Fragger</span>
                          </>
                        )}
                      </div>

                      <h4 className="font-heading font-bold text-base sm:text-lg text-white truncate">
                        {rec.tournamentTitle}
                      </h4>

                      {rec.teamName && (
                        <div className="text-xs font-mono text-zinc-400 truncate">
                          {pickLocalized(lang, 'Squad:', 'टीम:', 'স্কোয়াড:')} {rec.teamName}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Key Stats (Placement, Kills, Earned Reward) */}
                  <div className="flex items-center justify-between md:justify-end gap-5 sm:gap-7 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-800/80 shrink-0">
                    <div className="text-left md:text-right">
                      <div className="text-[10px] font-mono text-zinc-500 uppercase">
                        {t.placement}
                      </div>
                      <div className="text-sm font-mono font-bold text-zinc-100 tabular-nums">
                        {rec.placement !== null ? `#${rec.placement}` : 'Completed'}
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <div className="text-[10px] font-mono text-zinc-500 uppercase">
                        {t.kills}
                      </div>
                      <div className="text-sm font-mono font-bold text-orange-400 tabular-nums flex items-center gap-1 md:justify-end">
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>{rec.kills}</span>
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <div className="text-[10px] font-mono text-zinc-500 uppercase">
                        {t.earnedReward}
                      </div>
                      <div className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                        {rec.earnedReward > 0
                          ? rec.currency === 'INR'
                            ? `+₹${rec.earnedReward}`
                            : `+💎${rec.earnedReward}`
                          : '₹0'}
                      </div>
                    </div>

                    <div className="text-zinc-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Expanded Match Breakdown */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t border-zinc-800 bg-zinc-950/60 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block">
                          {pickLocalized(lang, 'Placement Pts', 'स्थान अंक', 'প্লেসমেন্ট পয়েন্ট')}
                        </span>
                        <span className="font-bold text-zinc-200 tabular-nums">
                          {rec.placementPoints ?? '-'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block">
                          {pickLocalized(lang, 'Squad / Player Kills', 'टीम किल्स', 'টিম / প্লেয়ার কিল')}
                        </span>
                        <span className="font-bold text-orange-400 tabular-nums">
                          {rec.teamKills ?? rec.kills}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block">
                          {pickLocalized(lang, 'Total Points', 'कुल पॉइंट्स', 'মোট পয়েন্ট')}
                        </span>
                        <span className="font-bold text-amber-400 tabular-nums">
                          {rec.totalPoints ?? '-'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block">
                          {pickLocalized(lang, 'Payout Status', 'भुगतान स्थिति', 'পেমেন্ট স্ট্যাটাস')}
                        </span>
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{rec.earnedReward > 0 ? 'Credited' : 'Settled'}</span>
                        </span>
                      </div>
                    </div>

                    {rec.players && rec.players.length > 0 && (
                      <div className="text-xs font-mono text-zinc-400">
                        <span className="text-zinc-500 mr-2">
                          <Users className="w-3.5 h-3.5 inline mr-1" />
                          {pickLocalized(lang, 'Roster:', 'रोस्टर:', 'রোস্টার:')}
                        </span>
                        <span className="text-zinc-200">{rec.players.join(' · ')}</span>
                      </div>
                    )}

                    {rec.description && (
                      <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                        <Receipt className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>
                          {rec.description} {rec.txId ? `(Ref: ${rec.txId})` : ''}
                        </span>
                      </div>
                    )}

                    {rec.leaderboardSnapshot && (
                      <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                        <div className="text-[11px] font-mono font-semibold text-zinc-400">
                          {pickLocalized(lang, 'Match Standings Snapshot:', 'मैच स्टैंडिंग (Top Teams):', 'ম্যাচ স্ট্যান্ডিং (Top Teams):')}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {rec.leaderboardSnapshot.slice(0, 3).map((row) => (
                            <div
                              key={row.rank}
                              className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                                row.teamName === rec.teamName
                                  ? 'bg-amber-500/10 border-amber-500/40 text-white'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                              }`}
                            >
                              <span className="truncate">
                                #{row.rank} {row.teamName}
                              </span>
                              <span className="text-amber-400 font-bold tabular-nums ml-2 shrink-0">
                                {row.totalPoints} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
