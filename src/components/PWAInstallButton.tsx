import React from 'react';
import { Download, Smartphone, Share, Package } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language, pickLocalized } from '../utils/translations';

interface PWAInstallButtonProps {
  lang: Language;
  onOpenApkModal?: () => void;
  variant?: 'card' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  lang,
  onOpenApkModal,
  variant = 'card',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (isInstalled) {
    return null;
  }

  if (variant === 'compact') {
    if (isInstallable) {
      return (
        <button
          type="button"
          onClick={install}
          className="py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-heading font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{pickLocalized(lang, 'Install App', 'ऐप इंस्टॉल करें', 'অ্যাপ ইনস্টল')}</span>
        </button>
      );
    }
    return null;
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-heading font-extrabold text-white">
              {pickLocalized(
                lang,
                'Android App & APK Export',
                'Android ऐप व APK डाउनलोड',
                'Android অ্যাপ ও APK এক্সপোর্ট'
              )}
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5 leading-relaxed">
              {isIOS
                ? pickLocalized(
                    lang,
                    'On iPhone/iPad: tap Share in Safari and select "Add to Home Screen" for full-screen mode.',
                    'iPhone/iPad पर: Safari में Share दबाएँ और "Add to Home Screen" चुनें।',
                    'iPhone/iPad-এ: Safari-তে Share ট্যাপ করে "Add to Home Screen" সিলেক্ট করুন।'
                  )
                : pickLocalized(
                    lang,
                    'Install directly on Android Chrome or generate a standalone .apk package.',
                    'Android Chrome में सीधे इंस्टॉल करें या .apk फाइल बनाएँ।',
                    'Android Chrome-এ সরাসরি ইনস্টল করুন অথবা .apk ফাইল তৈরি করুন।'
                  )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {isInstallable && (
            <button
              type="button"
              onClick={install}
              className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-heading font-bold flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              <span>{pickLocalized(lang, 'Install Now', 'अभी इंस्टॉल करें', 'এখনই ইনস্টল করুন')}</span>
            </button>
          )}

          {isIOS && (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300">
              <Share className="w-3.5 h-3.5 text-amber-400" />
              <span>Share &rarr; Add to Home Screen</span>
            </span>
          )}

          {onOpenApkModal && (
            <button
              type="button"
              onClick={onOpenApkModal}
              className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 text-xs font-heading font-bold flex items-center gap-2 transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>
                {pickLocalized(
                  lang,
                  'APK Build Guide',
                  'APK बनाने के विकल्प',
                  'APK তৈরির গাইড'
                )}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
