import React, { useState } from 'react';
import {
  X,
  Flame,
  Mail,
  Lock,
  User,
  Gamepad2,
  Hash,
  ShieldAlert,
  CheckCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Language, pickLocalized } from '../utils/translations';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currentFirebaseUser: FirebaseUser | null;
  onAuthSuccess?: (ign?: string, ffUid?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentFirebaseUser,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [ign, setIgn] = useState('');
  const [ffUid, setFfUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  if (!isOpen) return null;

  const needsEmailVerification =
    Boolean(currentFirebaseUser) && !currentFirebaseUser?.emailVerified;

  const formatFirebaseAuthError = (err: unknown): string => {
    const code = (err as { code?: string })?.code || '';
    const msg = err instanceof Error ? err.message : String(err);

    if (code === 'auth/operation-not-allowed') {
      return pickLocalized(
        lang,
        'Email/Password sign-in is not enabled in Firebase Console yet. Please use "Continue with Google" below, or enable Email/Password under Firebase Console > Authentication > Sign-in method.',
        'Firebase Console में Email/Password लॉगिन चालू नहीं है। कृपया Google से लॉगिन करें, या Firebase Console > Authentication > Sign-in method में जाकर Email/Password ऑन करें।',
        'Firebase Console-এ ইমেইল/পাসওয়ার্ড লগইন চালু নেই। অনুগ্রহ করে নিচে Google ব্যবহার করুন, অথবা Firebase Console > Authentication > Sign-in method থেকে এটি চালু করুন।'
      );
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return pickLocalized(
        lang,
        'Invalid email or password. Please check your credentials.',
        'गलत ईमेल या पासवर्ड। कृपया पुनः जांचें।',
        'ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে আবার যাচাই করুন।'
      );
    }
    if (code === 'auth/email-already-in-use') {
      return pickLocalized(
        lang,
        'This email is already registered. Please switch to Login.',
        'यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन करें।',
        'এই ইমেইলটি আগে থেকেই নিবন্ধিত। অনুগ্রহ করে লগইন করুন।'
      );
    }
    if (code === 'auth/weak-password') {
      return pickLocalized(
        lang,
        'Password must be at least 6 characters long.',
        'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।',
        'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
      );
    }
    if (code === 'auth/popup-closed-by-user') {
      return pickLocalized(
        lang,
        'Google sign-in popup was closed. Please try again.',
        'Google साइन-इन पॉपअप बंद कर दिया गया। कृपया पुनः प्रयास करें।',
        'Google সাইন-ইন পপআপ বন্ধ করা হয়েছে। আবার চেষ্টা করুন।'
      );
    }
    return msg;
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setInfoMessage('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!ign.trim() || ffUid.trim().length < 4) {
          setError(
            pickLocalized(
              lang,
              'Please enter your Free Fire IGN and valid FF UID (min 4 characters).',
              'कृपया अपना Free Fire IGN और सही UID (कम से कम 4 अंक) दर्ज करें।',
              'অনুগ্রহ করে আপনার Free Fire IGN এবং সঠিক FF UID (কমপক্ষে ৪ অক্ষর) দিন।'
            )
          );
          setLoading(false);
          return;
        }

        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() });
        }

        // Persist player's preferred IGN & UID temporarily until verification completes
        try {
          localStorage.setItem(
            `booyah_pending_profile_${cred.user.uid}`,
            JSON.stringify({
              name: name.trim() || ign.trim(),
              ign: ign.trim(),
              ffUid: ffUid.trim(),
            })
          );
        } catch {}

        await sendEmailVerification(cred.user);
        setInfoMessage(
          pickLocalized(
            lang,
            'Account created! A verification link has been sent to your email. Verify your inbox, then click Refresh Status.',
            'अकाउंट बन गया! आपके ईमेल पर वेरिफिकेशन लिंक भेजा गया है। ईमेल वेरीफाई करके "Refresh Status" दबाएं।',
            'অ্যাকাউন্ট তৈরি হয়েছে! আপনার ইমেইলে একটি ভেরিফিকেশন লিংক পাঠানো হয়েছে। যাচাই করে Refresh Status-এ ক্লিক করুন।'
          )
        );
        onAuthSuccess?.(ign.trim(), ffUid.trim());
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (!cred.user.emailVerified) {
          setInfoMessage(
            pickLocalized(
              lang,
              'Please verify your email address before continuing.',
              'कृपया पहले अपना ईमेल वेरीफाई करें। जरूरत हो तो नीचे से लिंक दोबारा भेजें।',
              'এগিয়ে যাওয়ার আগে অনুগ্রহ করে আপনার ইমেইল ভেরিফাই করুন।'
            )
          );
        } else {
          onAuthSuccess?.();
          onClose();
        }
      }
    } catch (err) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setError('');
    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setInfoMessage(
        pickLocalized(
          lang,
          'Verification email resent. Please check your inbox or spam folder.',
          'वेरिफिकेशन ईमेल दोबारा भेज दिया गया है। अपना इनबॉक्स/स्पैम चेक करें।',
          'ভেরিফিকেশন ইমেইল আবার পাঠানো হয়েছে। আপনার ইনবক্স বা স্প্যাম ফোল্ডার দেখুন।'
        )
      );
    } catch (err) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshVerification = async () => {
    if (!auth.currentUser) return;
    setError('');
    setLoading(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        onAuthSuccess?.();
        onClose();
      } else {
        setError(
          pickLocalized(
            lang,
            'Email is not verified yet. Please click the verification link in your email first.',
            'ईमेल अभी वेरीफाई नहीं हुआ है। कृपया लिंक पर क्लिक करने के बाद दोबारा कोशिश करें।',
            'ইমেইল এখনো ভেরিফাই হয়নি। অনুগ্রহ করে প্রথমে ইমেইলের লিংকে ক্লিক করুন।'
          )
        );
      }
    } catch (err) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-zinc-950 shadow-lg shadow-orange-500/20">
              <Flame className="w-5 h-5 fill-zinc-950" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-white">
                {pickLocalized(
                  lang,
                  'BooyahArena Account',
                  'BooyahArena लॉगिन / साइन अप',
                  'BooyahArena অ্যাকাউন্ট'
                )}
              </h3>
              <p className="text-[11px] font-mono text-zinc-400">
                {pickLocalized(
                  lang,
                  'Secured by Firebase Authentication',
                  'रियल-टाइम टूर्नामेंट व वॉलेट सुरक्षा',
                  'Firebase Authentication দ্বারা সুরক্ষিত'
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

        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2 leading-relaxed">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {needsEmailVerification ? (
            <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/30 space-y-3">
              <div className="text-xs font-mono text-amber-300 font-semibold">
                {pickLocalized(
                  lang,
                  `Verification Pending: ${currentFirebaseUser?.email}`,
                  `वेरिफिकेशन पेंडिंग: ${currentFirebaseUser?.email}`,
                  `ভেরিফিকেশন বাকি: ${currentFirebaseUser?.email}`
                )}
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {pickLocalized(
                  lang,
                  'Verify your email address using the link sent to your inbox to unlock tournaments and wallet actions.',
                  'टूर्नामेंट जॉइन करने और वॉलेट का उपयोग करने के लिए अपने ईमेल पर भेजे गए लिंक को वेरीफाई करें।',
                  'টুর্নামেন্ট এবং ওয়ালেট ফিচার আনলক করতে আপনার ইমেইলে পাঠানো লিংকে ক্লিক করে ভেরিফাই করুন।'
                )}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleRefreshVerification}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-heading font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{pickLocalized(lang, 'Refresh Status', 'स्टेटस रिफ्रेश करें', 'স্ট্যাটাস রিফ্রেশ')}</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleResendVerification}
                  className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-heading font-bold text-xs"
                >
                  {pickLocalized(lang, 'Resend Link', 'दोबारा भेजें', 'আবার পাঠান')}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Instant Google Sign-In */}
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 active:scale-[0.99] text-zinc-950 font-heading font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>
                  {pickLocalized(
                    lang,
                    'Continue with Google',
                    'Google से तुरंत लॉगिन / साइन अप करें',
                    'Google দিয়ে চালিয়ে যান'
                  )}
                </span>
              </button>

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-zinc-800" />
                <span className="shrink mx-3 text-[10px] font-mono text-zinc-500 uppercase">
                  {pickLocalized(lang, 'or with email', 'या ईमेल से', 'অথবা ইমেইল দিয়ে')}
                </span>
                <div className="flex-grow border-t border-zinc-800" />
              </div>

              {/* Login / Signup Switcher */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-heading font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className={`py-2 rounded-lg transition-colors ${
                    mode === 'login' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {pickLocalized(lang, 'Login', 'लॉगिन (Login)', 'লগইন (Login)')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className={`py-2 rounded-lg transition-colors ${
                    mode === 'signup' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {pickLocalized(lang, 'Sign Up', 'नया अकाउंट (Sign Up)', 'সাইন আপ (Sign Up)')}
                </button>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-3">
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                        {pickLocalized(lang, 'Full Name', 'आपका नाम', 'পুরো নাম')}
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                          Free Fire IGN
                        </label>
                        <div className="relative">
                          <Gamepad2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input
                            type="text"
                            required
                            value={ign}
                            onChange={(e) => setIgn(e.target.value)}
                            placeholder="THUNDER_OP"
                            className="w-full pl-9 pr-2.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                          FF UID
                        </label>
                        <div className="relative">
                          <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input
                            type="text"
                            required
                            value={ffUid}
                            onChange={(e) => setFfUid(e.target.value)}
                            placeholder="284910284"
                            className="w-full pl-9 pr-2.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                    {pickLocalized(lang, 'Email Address', 'ईमेल एड्रेस', 'ইমেইল ঠিকানা')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="player@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                    {pickLocalized(lang, 'Password', 'पासवर्ड', 'পাসওয়ার্ড')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-zinc-950 font-heading font-bold text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <span>
                    {loading
                      ? pickLocalized(lang, 'Please wait...', 'प्रतीक्षा करें...', 'অপেক্ষা করুন...')
                      : mode === 'login'
                        ? pickLocalized(lang, 'Login to Account', 'लॉगिन करें', 'লগইন করুন')
                        : pickLocalized(lang, 'Create Player Account', 'अकाउंट बनाएं', 'অ্যাকাউন্ট তৈরি করুন')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
