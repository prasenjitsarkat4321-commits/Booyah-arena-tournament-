import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Smartphone,
  Download,
  ExternalLink,
  Terminal,
  Package,
  CheckCircle,
  AlertTriangle,
  Cloud,
  FileJson,
} from 'lucide-react';
import { Language, pickLocalized } from '../utils/translations';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { getCleanPublicBaseUrl } from '../utils/appLinks';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

const FIREBASE_PROJECT_HOSTING_URL = 'https://pristine-folder-tc62s.web.app';

const FIREBASE_DEPLOY_COMMANDS = `npm install
npm run build
npx firebase-tools login
npx firebase-tools deploy --only hosting`;

const CAPACITOR_COMMANDS = `npm install
npm run build
npm install --no-save @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npx cap sync android
npx cap open android`;

function buildFirebaseHostingJson(): string {
  return JSON.stringify(
    {
      firestore: { rules: 'firestore.rules' },
      hosting: {
        public: 'dist',
        ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
        headers: [
          {
            source: '/manifest.json',
            headers: [
              { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' },
              { key: 'Access-Control-Allow-Origin', value: '*' },
              { key: 'Cache-Control', value: 'public, max-age=300' },
            ],
          },
          {
            source: '/sw.js',
            headers: [
              { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
              { key: 'Service-Worker-Allowed', value: '/' },
              { key: 'Cache-Control', value: 'no-cache' },
            ],
          },
          {
            source: '/.well-known/**',
            headers: [
              { key: 'Content-Type', value: 'application/json; charset=utf-8' },
              { key: 'Access-Control-Allow-Origin', value: '*' },
            ],
          },
          {
            source: '/**',
            headers: [
              { key: 'Access-Control-Allow-Origin', value: '*' },
              { key: 'X-Robots-Tag', value: 'index, follow' },
            ],
          },
        ],
        rewrites: [{ source: '**', destination: '/index.html' }],
      },
    },
    null,
    2
  );
}

function buildTwaManifestJson(targetOrigin: string): string {
  const cleanOrigin = targetOrigin.replace(/\/+$/, '');
  let host = 'pristine-folder-tc62s.web.app';
  try {
    host = new URL(cleanOrigin).host || host;
  } catch {}

  return JSON.stringify(
    {
      packageId: 'com.booyaharena.esports',
      host,
      name: 'BOOYAH ARENA',
      launcherName: 'Booyah Arena',
      display: 'standalone',
      themeColor: '#f97316',
      themeColorDark: '#09090b',
      navigationColor: '#09090b',
      navigationColorDark: '#09090b',
      navigationDividerColor: '#27272a',
      navigationDividerColorDark: '#27272a',
      backgroundColor: '#09090b',
      enableNotifications: true,
      startUrl: '/',
      iconUrl: `${cleanOrigin}/pwa-512x512.png`,
      maskableIconUrl: `${cleanOrigin}/pwa-maskable-512x512.png`,
      splashScreenFadeOutDuration: 300,
      signingKey: {
        path: './android.keystore',
        alias: 'booyaharena',
      },
      appVersionName: '1.0.0',
      appVersionCode: 1,
      shortcuts: [
        {
          name: 'Live Tournaments',
          shortName: 'Matches',
          url: `${cleanOrigin}/`,
          chosenIconUrl: `${cleanOrigin}/pwa-192x192.png`,
        },
        {
          name: 'Wallet & UPI',
          shortName: 'Wallet',
          url: `${cleanOrigin}/?tab=wallet`,
          chosenIconUrl: `${cleanOrigin}/pwa-192x192.png`,
        },
      ],
      generatorApp: 'bubblewrap-cli',
      webManifestUrl: `${cleanOrigin}/manifest.json`,
      fallbackType: 'customtabs',
      features: {},
      alphaDependencies: { enabled: false },
      enableSiteSettingsShortcut: true,
      isChromeOSOnly: false,
      isMetaQuest: false,
      fullScopeUrl: `${cleanOrigin}/`,
      minSdkVersion: 21,
      orientation: 'portrait-primary',
      fingerprints: [],
      additionalTrustedOrigins: ['https://pristine-folder-tc62s.firebaseapp.com'],
      retainedBundles: [],
    },
    null,
    2
  );
}

function buildCapacitorConfigJson(): string {
  return JSON.stringify(
    {
      appId: 'com.booyaharena.esports',
      appName: 'BOOYAH ARENA',
      webDir: 'dist',
      bundledWebRuntime: false,
      server: {
        androidScheme: 'https',
        allowNavigation: [
          '*.firebaseapp.com',
          '*.googleapis.com',
          '*.gstatic.com',
          'pristine-folder-tc62s.web.app',
        ],
      },
      android: {
        backgroundColor: '#09090b',
        allowMixedContent: false,
        captureInput: true,
        webContentsDebuggingEnabled: false,
      },
    },
    null,
    2
  );
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, lang }) => {
  const [activeSection, setActiveSection] = useState<'apk' | 'share'>('apk');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<'fb' | 'twa' | 'cap' | null>(null);
  const [customHostUrl, setCustomHostUrl] = useState(FIREBASE_PROJECT_HOSTING_URL);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const activeUrl = getCleanPublicBaseUrl();
  const normalizedTargetHost = (customHostUrl || FIREBASE_PROJECT_HOSTING_URL)
    .trim()
    .replace(/\/+$/, '');

  const bubblewrapCommands = `npm install -g @bubblewrap/cli
bubblewrap update
bubblewrap build`;

  const copyText = async (text: string, onSuccess: () => void) => {
    try {
      await navigator.clipboard.writeText(text);
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
      } catch {}
    }
    onSuccess();
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = () => {
    copyText(activeUrl, () => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    });
  };

  const handleCopyCommands = (which: 'fb' | 'twa' | 'cap', cmdText: string) => {
    copyText(cmdText, () => {
      setCopiedCmd(which);
      setTimeout(() => setCopiedCmd(null), 2000);
    });
  };

  const shareText = encodeURIComponent(
    `Free Fire Tournament App Live! Join daily Solo, Duo & Squad custom rooms, win cash prizes & instant UPI payouts: ${activeUrl}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;
  const pwabuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(normalizedTargetHost)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-white">
                {pickLocalized(
                  lang,
                  'Android APK & Zero-Terminal Hosting',
                  'Android APK व बिना-टर्मिनल होस्टिंग',
                  'Android APK ও জিরো-টার্মিনাল হোস্টিং'
                )}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                {pickLocalized(
                  lang,
                  'Mobile-ready GitHub Actions workflows + downloadable configs',
                  'मोबाइल के लिए तैयार GitHub Actions और डाउनलोड योग्य कॉन्फ़िग',
                  'মোবাইল থেকেই GitHub Actions দিয়ে অটো-ডিপ্লয় ও APK তৈরি করুন'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="grid grid-cols-2 border-b border-zinc-800 bg-zinc-950 text-xs font-heading font-bold">
          <button
            type="button"
            onClick={() => setActiveSection('apk')}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeSection === 'apk'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{pickLocalized(lang, 'Mobile APK & Firebase Auto-Deploy', 'APK व ऑटो-डिप्लॉय', 'APK ও অটো-ডিপ্লয়')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('share')}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeSection === 'share'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>{pickLocalized(lang, 'Live URL & WhatsApp Share', 'लाइव लिंक व शेयर', 'লাইভ লিংক ও শেয়ার')}</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activeSection === 'apk' ? (
            <div className="space-y-4">
              {/* Root Cause Notice */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300">On Mobile (Zero Terminal Needed):</span>{' '}
                  Export/push this project to GitHub once from AI Studio. Both{' '}
                  <strong className="text-white">Android APK Building</strong> and{' '}
                  <strong className="text-white">Firebase Hosting Deployment</strong> are pre-configured as 1-tap GitHub Actions workflows that run in the cloud from your phone browser.
                </div>
              </div>

              {/* Option 1: Direct Install on Android (PWA) */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase">
                    <Download className="w-4 h-4" />
                    <span>Instant Phone Install · Works Now</span>
                  </div>
                  {isInstalled && (
                    <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Installed
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {isIOS
                    ? 'On iPhone/iPad Safari, tap Share and choose "Add to Home Screen" to launch Booyah Arena full-screen.'
                    : 'Open this app in Chrome on Android and tap Install App below (or Chrome Menu ⋮ → Add to Home screen) to install on your phone immediately.'}
                </p>

                {isInstallable && !isInstalled && (
                  <button
                    type="button"
                    onClick={install}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-heading font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install BOOYAH ARENA App Now</span>
                  </button>
                )}
              </div>

              {/* Method 1: Zero-Terminal Cloud APK via GitHub Actions */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-cyan-500/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase">
                    <Cloud className="w-4 h-4" />
                    <span>Method 1 · Cloud APK Build on Mobile (GitHub Actions)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadFile('capacitor.config.json', buildCapacitorConfigJson())}
                    className="px-2.5 py-1 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    <FileJson className="w-3 h-3" />
                    <span>capacitor.config.json</span>
                  </button>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Bundles the web app directly inside an Android <code className="text-cyan-300 font-mono">.apk</code> using{' '}
                  <code className="text-cyan-300 font-mono">.github/workflows/build-android-apk.yml</code> —{' '}
                  <strong>no terminal, no Firebase deploy, and no PWABuilder needed</strong>:
                </p>

                <ol className="text-xs text-zinc-300 space-y-1 list-decimal list-inside leading-relaxed">
                  <li>Export/push this project to GitHub from AI Studio.</li>
                  <li>
                    In GitHub (phone browser) → <strong>Actions</strong> → <strong>Build BOOYAH ARENA Android APK</strong> → tap{' '}
                    <strong>Run workflow</strong>.
                  </li>
                  <li>
                    Tap <strong>BOOYAH-ARENA-debug-apk</strong> artifact (~2 mins) to download &amp; install the APK on Android.
                  </li>
                </ol>

                <div className="pt-1 border-t border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-zinc-400">
                      Optional PC commands (if building locally later):
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCommands('cap', CAPACITOR_COMMANDS)}
                      className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-zinc-200 flex items-center gap-1 transition-colors"
                    >
                      {copiedCmd === 'cap' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === 'cap' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                    {CAPACITOR_COMMANDS}
                  </pre>
                </div>
              </div>

              {/* Method 2: Zero-Terminal Auto-Deploy to Firebase Hosting */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase">
                    <Package className="w-4 h-4" />
                    <span>Method 2 · Auto-Activate pristine-folder-tc62s.web.app</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => downloadFile('firebase.json', buildFirebaseHostingJson())}
                      className="px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[11px] font-mono text-amber-300 flex items-center gap-1 transition-colors"
                    >
                      <FileJson className="w-3 h-3" />
                      <span>firebase.json</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyCommands('fb', FIREBASE_DEPLOY_COMMANDS)}
                      className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-zinc-200 flex items-center gap-1 transition-colors"
                    >
                      {copiedCmd === 'fb' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === 'fb' ? 'Copied' : 'Copy CLI'}</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Includes <code className="text-amber-300 font-mono">.github/workflows/deploy-firebase-hosting.yml</code> so you can activate{' '}
                  <strong className="text-white">pristine-folder-tc62s.web.app</strong> from your mobile browser with zero terminal commands:
                </p>

                <ol className="text-xs text-zinc-300 space-y-1 list-decimal list-inside leading-relaxed">
                  <li>
                    In Firebase Console → <strong>Project Settings → Service accounts</strong> → tap{' '}
                    <strong>Generate new private key</strong>.
                  </li>
                  <li>
                    In GitHub Repo → <strong>Settings → Secrets → Actions</strong>, add secret{' '}
                    <code className="text-amber-300 font-mono">FIREBASE_SERVICE_ACCOUNT</code> with that JSON key.
                  </li>
                  <li>
                    Tap <strong>Actions → Deploy BOOYAH ARENA to Firebase Hosting → Run workflow</strong>.
                  </li>
                </ol>

                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-mono text-zinc-400 block">
                    Test Live Hosting URL in PWABuilder:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={customHostUrl}
                      onChange={(e) => setCustomHostUrl(e.target.value)}
                      placeholder="https://pristine-folder-tc62s.web.app"
                      className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-emerald-300 focus:outline-none focus:border-amber-500"
                    />
                    <a
                      href={pwabuilderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0"
                    >
                      <span>Open PWABuilder</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Method 3: Bubblewrap Config Download */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-orange-400 uppercase">
                    <Terminal className="w-4 h-4" />
                    <span>Method 3 · Bubblewrap TWA Config (twa-manifest.json)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => downloadFile('twa-manifest.json', buildTwaManifestJson(normalizedTargetHost))}
                      className="px-2.5 py-1 rounded-md bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-[11px] font-mono text-orange-300 flex items-center gap-1 transition-colors"
                    >
                      <FileJson className="w-3 h-3" />
                      <span>twa-manifest.json</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyCommands('twa', bubblewrapCommands)}
                      className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-zinc-200 flex items-center gap-1 transition-colors"
                    >
                      {copiedCmd === 'twa' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === 'twa' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <pre className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                  {bubblewrapCommands}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Working Live Web Link */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                    Active Live URL
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                    LIVE NOW
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={activeUrl}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-emerald-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedUrl ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-heading font-bold text-center flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>
                      {pickLocalized(lang, 'Share on WhatsApp', 'WhatsApp पर शेयर करें', 'WhatsApp-এ শেয়ার করুন')}
                    </span>
                  </a>

                  <a
                    href={activeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <span>{pickLocalized(lang, 'Open Link', 'अभी खोलें', 'লিংক খুলুন')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 leading-relaxed">
                On mobile with zero terminal commands: push to GitHub and run{' '}
                <strong className="text-zinc-200">Deploy BOOYAH ARENA to Firebase Hosting</strong> to bring{' '}
                <code className="text-emerald-400 font-mono">{FIREBASE_PROJECT_HOSTING_URL}</code> live, or run{' '}
                <strong className="text-zinc-200">Build BOOYAH ARENA Android APK</strong> to download the APK straight to your phone.
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-heading font-bold transition-colors"
          >
            {pickLocalized(lang, 'Close', 'बंद करें', 'বন্ধ করুন')}
          </button>
        </div>
      </div>
    </div>
  );
};
