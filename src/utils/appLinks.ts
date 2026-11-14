export const PUBLIC_SHARED_APP_URL =
  'https://ais-pre-llc7iihpxvcus2g6qkjhnm-1000092826226.asia-east1.run.app';

export const INCOMING_REFERRAL_STORAGE_KEY = 'booyah_incoming_referral_code';

export const REFERRAL_REWARD_COINS = 50;
export const REFERRAL_REWARD_CASH = 10;

/**
 * Returns a clean, public HTTPS origin suitable for mobile sharing, WhatsApp links,
 * referral invites, and PWABuilder APK generation.
 * Normalizes private AI Studio dev hosts (`ais-dev-*`) to the public shared URL (`ais-pre-*`).
 */
export function getCleanPublicBaseUrl(): string {
  if (typeof window === 'undefined' || !window.location?.origin) {
    return PUBLIC_SHARED_APP_URL;
  }

  try {
    const url = new URL(window.location.origin);
    const isLocalhost =
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname === '0.0.0.0';

    if (isLocalhost || url.protocol !== 'https:') {
      return PUBLIC_SHARED_APP_URL;
    }

    if (url.hostname.startsWith('ais-dev-')) {
      return `https://${url.hostname.replace(/^ais-dev-/, 'ais-pre-')}`;
    }

    return url.origin.replace(/\/+$/, '');
  } catch {
    return PUBLIC_SHARED_APP_URL;
  }
}

export function buildReferralShareUrl(referralCode: string): string {
  const cleanCode = referralCode.trim().toUpperCase();
  const baseUrl = getCleanPublicBaseUrl();
  if (!cleanCode) return baseUrl;
  return `${baseUrl}/?ref=${encodeURIComponent(cleanCode)}`;
}

export function buildApkDownloadShareUrl(): string {
  return `${getCleanPublicBaseUrl()}/?install=apk`;
}

/**
 * Generates a deterministic, clean, collision-resistant uppercase alphanumeric referral code
 * (e.g. BYHTHU4K9X) for every registered user.
 */
export function generateUniqueReferralCode(seedName: string, uid: string): string {
  const cleanSeed = (seedName || 'PLY')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 3)
    .padEnd(3, 'X');

  let hash = 2166136261;
  for (let i = 0; i < uid.length; i++) {
    hash ^= uid.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hashPart = (hash >>> 0).toString(36).toUpperCase().padStart(5, '0').slice(0, 5);
  const uidTail = uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-2).padStart(2, 'B');
  return `BYH${cleanSeed}${hashPart}${uidTail}`.slice(0, 12);
}

export function saveIncomingReferralCode(code: string) {
  const clean = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (clean.length < 3 || clean.length > 30) return;
  try {
    localStorage.setItem(INCOMING_REFERRAL_STORAGE_KEY, clean);
  } catch {}
}

export function getSavedIncomingReferralCode(): string {
  try {
    return localStorage.getItem(INCOMING_REFERRAL_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function clearSavedIncomingReferralCode() {
  try {
    localStorage.removeItem(INCOMING_REFERRAL_STORAGE_KEY);
  } catch {}
}

export interface UrlBootIntent {
  referralCode: string;
  targetTab: 'tournaments' | 'my-matches' | 'leaderboard' | 'wallet' | 'rules' | 'refer' | 'profile' | null;
  openApkModal: boolean;
}

/**
 * Reads incoming referral codes (`?ref=CODE` or `/ref/CODE`), deep-linked tabs (`?tab=wallet`),
 * and APK install intents (`?install=apk`), then cleans the URL back to `/` cleanly.
 */
export function captureUrlBootIntent(): UrlBootIntent {
  if (typeof window === 'undefined') {
    return { referralCode: '', targetTab: null, openApkModal: false };
  }

  let detectedRef = '';
  let targetTab: UrlBootIntent['targetTab'] = null;
  let openApkModal = false;

  try {
    const url = new URL(window.location.href);
    const refParam = url.searchParams.get('ref') || url.searchParams.get('invite') || '';
    if (refParam) {
      detectedRef = refParam.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      if (detectedRef.length >= 3) {
        saveIncomingReferralCode(detectedRef);
      }
    }

    const pathMatch = url.pathname.match(/^\/(?:ref|invite|r)\/([a-zA-Z0-9_-]{3,30})\/?$/i);
    if (!detectedRef && pathMatch?.[1]) {
      detectedRef = pathMatch[1].toUpperCase();
      saveIncomingReferralCode(detectedRef);
    }

    const tabParam = (url.searchParams.get('tab') || '').toLowerCase();
    if (
      tabParam === 'tournaments' ||
      tabParam === 'my-matches' ||
      tabParam === 'leaderboard' ||
      tabParam === 'wallet' ||
      tabParam === 'rules' ||
      tabParam === 'refer' ||
      tabParam === 'profile'
    ) {
      targetTab = tabParam;
    }

    if (url.searchParams.get('install') === 'apk') {
      openApkModal = true;
    }

    if (refParam || pathMatch || tabParam || openApkModal) {
      window.history.replaceState(null, '', '/');
    }
  } catch {}

  return {
    referralCode: detectedRef || getSavedIncomingReferralCode(),
    targetTab,
    openApkModal,
  };
}
