import { Tournament } from '../types/tournament';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

export interface RoomRevealState {
  isUnlocked: boolean;
  isMatchStarted: boolean;
  matchStartMs: number | null;
  unlockAtMs: number | null;
  msUntilUnlock: number;
  msUntilStart: number;
  reason: 'ADMIN_OPEN' | 'AUTO_15M_WINDOW' | 'LOCKED_COUNTDOWN';
}

/**
 * Parses tournament startTime into epoch milliseconds.
 * Supports ISO / datetime-local strings (e.g. "2026-11-12T20:30") and
 * human-readable strings (e.g. "Today, 08:30 PM IST", "Tomorrow, 04:00 PM IST").
 */
export function parseMatchStartMs(startTime: string, referenceMs: number = Date.now()): number | null {
  if (!startTime || typeof startTime !== 'string') return null;
  const trimmed = startTime.trim();

  // 1. ISO or standard YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) return parsed;
  }

  // 2. Human-readable "Today, 08:30 PM IST" / "Tomorrow, 04:00 PM IST" / "8:30 PM"
  const timeMatch = trimmed.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const meridiem = timeMatch[3]?.toUpperCase();

    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const target = new Date(referenceMs);
      if (/tomorrow/i.test(trimmed)) {
        target.setDate(target.getDate() + 1);
      } else if (/yesterday/i.test(trimmed)) {
        target.setDate(target.getDate() - 1);
      }
      target.setHours(hours, minutes, 0, 0);
      return target.getTime();
    }
  }

  // 3. Fallback general Date.parse
  const fallback = Date.parse(trimmed);
  return Number.isNaN(fallback) ? null : fallback;
}

/**
 * Formats ISO/datetime-local strings cleanly for display while keeping
 * custom readable strings ("Today, 08:30 PM IST") intact.
 */
export function formatMatchStartDisplay(startTime: string): string {
  if (!startTime) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(startTime.trim())) {
    const ms = Date.parse(startTime.trim());
    if (!Number.isNaN(ms)) {
      return new Date(ms).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }
  return startTime;
}

export function formatCountdown(ms: number): string {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.floor(clamped / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  if (days > 0) {
    return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  if (hours > 0) {
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  return `${pad(minutes)}m ${pad(seconds)}s`;
}

/**
 * Evaluates whether Custom Room ID & Password should be visible to a registered player.
 * Automatically unlocks 15 minutes before match start time, or immediately when
 * an admin/organizer sets status to ROOM_OPEN or LIVE.
 */
export function getRoomRevealState(
  tournament: Tournament,
  nowMs: number = Date.now()
): RoomRevealState {
  const matchStartMs = parseMatchStartMs(tournament.startTime, nowMs);
  const unlockAtMs = matchStartMs !== null ? matchStartMs - FIFTEEN_MINUTES_MS : null;

  const isStatusOpen =
    tournament.status === 'ROOM_OPEN' ||
    tournament.status === 'LIVE' ||
    tournament.status === 'COMPLETED';

  const isTimeUnlocked = unlockAtMs !== null && nowMs >= unlockAtMs;
  const isMatchStarted =
    tournament.status === 'LIVE' ||
    tournament.status === 'COMPLETED' ||
    (matchStartMs !== null && nowMs >= matchStartMs);

  const msUntilUnlock = unlockAtMs !== null ? Math.max(0, unlockAtMs - nowMs) : 0;
  const msUntilStart = matchStartMs !== null ? Math.max(0, matchStartMs - nowMs) : 0;

  if (isStatusOpen) {
    return {
      isUnlocked: true,
      isMatchStarted,
      matchStartMs,
      unlockAtMs,
      msUntilUnlock: 0,
      msUntilStart,
      reason: 'ADMIN_OPEN',
    };
  }

  if (isTimeUnlocked) {
    return {
      isUnlocked: true,
      isMatchStarted,
      matchStartMs,
      unlockAtMs,
      msUntilUnlock: 0,
      msUntilStart,
      reason: 'AUTO_15M_WINDOW',
    };
  }

  return {
    isUnlocked: false,
    isMatchStarted: false,
    matchStartMs,
    unlockAtMs,
    msUntilUnlock,
    msUntilStart,
    reason: 'LOCKED_COUNTDOWN',
  };
}
