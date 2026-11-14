import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, X, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Language, pickLocalized } from '../utils/translations';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
  lang: Language;
  unauthorizedNotice?: string;
}

const AUTHORIZED_ADMIN_EMAIL =
  (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) || 'prasenjitsarkat4321@gmail.com';
const ADMIN_PASSCODE =
  (import.meta.env.VITE_ADMIN_PASSCODE as string | undefined) || 'BOOYAH@2026';

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  lang,
  unauthorizedNotice,
}) => {
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(unauthorizedNotice || '');
      setPasscode('');
    }
  }, [isOpen, unauthorizedNotice]);

  if (!isOpen) return null;

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLocked && lockedUntil) {
      const remainingSec = Math.ceil((lockedUntil - Date.now()) / 1000);
      setError(
        pickLocalized(
          lang,
          `Too many failed attempts. Please wait ${remainingSec}s before trying again.`,
          `बहुत अधिक गलत प्रयास। कृपया ${remainingSec} सेकंड बाद पुनः प्रयास करें।`,
          `অনেকবার ভুল চেষ্টা করা হয়েছে। অনুগ্রহ করে ${remainingSec} সেকেন্ড পরে আবার চেষ্টা করুন।`
        )
      );
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const expectedEmail = AUTHORIZED_ADMIN_EMAIL.trim().toLowerCase();

    if (normalizedEmail === expectedEmail && passcode === ADMIN_PASSCODE) {
      setFailedAttempts(0);
      setLockedUntil(null);
      setEmail('');
      setPasscode('');
      onAuthenticated();
      return;
    }

    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);

    if (nextAttempts >= 5) {
      setLockedUntil(Date.now() + 30_000);
      setError(
        pickLocalized(
          lang,
          '5 failed attempts: Admin login temporarily locked for 30 seconds.',
          '5 गलत प्रयास: सुरक्षा के लिए एडमिन लॉगिन 30 सेकंड के लिए लॉक किया गया है।',
          '৫ বার ভুল চেষ্টা: নিরাপত্তার জন্য অ্যাডমিন লগইন ৩০ সেকেন্ডের জন্য লক করা হয়েছে।'
        )
      );
    } else {
      setError(
        pickLocalized(
          lang,
          'Invalid admin email or secret passcode. Access denied.',
          'अमान्य एडमिन ईमेल या गुप्त पासकोड। प्रवेश अस्वीकार कर दिया गया।',
          'ভুল অ্যাডমিন ইমেইল বা গোপন পাসকোড। প্রবেশাধিকার বাতিল করা হয়েছে।'
        )
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-white">
                {pickLocalized(
                  lang,
                  'Admin Security Verification',
                  'एडमिन सुरक्षा सत्यापन',
                  'অ্যাডমিন নিরাপত্তা যাচাইকরণ'
                )}
              </h3>
              <p className="text-[11px] font-mono text-zinc-400">
                {pickLocalized(
                  lang,
                  'Authorized Organizer Credentials Required',
                  'केवल अधिकृत ऑर्गनाइजर के लिए',
                  'অনুমোদিত অর্গানাইজারের তথ্য প্রয়োজন'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1.5">
              {pickLocalized(lang, 'Admin Email', 'एडमिन ईमेल (Admin Email)', 'অ্যাডমিন ইমেইল (Admin Email)')}
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@domain.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1.5">
              {pickLocalized(
                lang,
                'Secret Passcode',
                'गुप्त पासकोड (Secret Passcode)',
                'গোপন পাসকোড (Secret Passcode)'
              )}
            </label>
            <div className="relative">
              <input
                type={showPasscode ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                title={showPasscode ? 'Hide passcode' : 'Show passcode'}
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-heading font-bold transition-colors"
            >
              {pickLocalized(lang, 'Back to Home', 'होम पर वापस जाएं', 'হোমে ফিরে যান')}
            </button>

            <button
              type="submit"
              disabled={isLocked}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-50 text-zinc-950 text-xs font-heading font-bold tracking-wide flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-500/20"
            >
              <span>
                {pickLocalized(
                  lang,
                  'Unlock Admin Panel',
                  'अनलॉक एडमिन पैनल',
                  'অ্যাডমিন প্যানেল আনলক করুন'
                )}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
