import React, { useState } from 'react';
import {
  Flame,
  Mail,
  Lock,
  User,
  Gamepad2,
  Hash,
  Phone,
  Ticket,
  ShieldCheck,
  Trophy,
  Zap,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AuthLandingViewProps {
  currentFirebaseUser: FirebaseUser | null;
  onVerificationRefreshed: () => Promise<void>;
  initialReferralCode?: string;
}

const MOBILE_TO_EMAIL_MAP_KEY = 'booyah_mobile_email_map';

function saveMobileToEmailMapping(mobile: string, email: string) {
  try {
    const raw = localStorage.getItem(MOBILE_TO_EMAIL_MAP_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    const digits = mobile.replace(/\D/g, '').slice(-10);
    if (digits.length >= 10) {
      map[digits] = email.trim().toLowerCase();
      localStorage.setItem(MOBILE_TO_EMAIL_MAP_KEY, JSON.stringify(map));
    }
  } catch {}
}

function lookupEmailByMobile(identifier: string): string | null {
  try {
    const raw = localStorage.getItem(MOBILE_TO_EMAIL_MAP_KEY);
    if (!raw) return null;
    const map: Record<string, string> = JSON.parse(raw);
    const digits = identifier.replace(/\D/g, '').slice(-10);
    return map[digits] || null;
  } catch {
    return null;
  }
}

export const AuthLandingView: React.FC<AuthLandingViewProps> = ({
  currentFirebaseUser,
  onVerificationRefreshed,
  initialReferralCode = '',
}) => {
  const [page, setPage] = useState<'login' | 'register'>(
    initialReferralCode ? 'register' : 'login'
  );

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Create Account Form State
  const [username, setUsername] = useState('');
  const [ffUid, setFfUid] = useState('');
  const [ign, setIgn] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [referralCode, setReferralCode] = useState(initialReferralCode);

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const needsEmailVerification =
    Boolean(currentFirebaseUser) && !currentFirebaseUser?.emailVerified;

  const formatAuthError = (err: unknown): string => {
    const code = (err as { code?: string })?.code || '';
    const msg = err instanceof Error ? err.message : String(err);

    if (code === 'auth/operation-not-allowed') {
      return 'Email/Password sign-in is not enabled in Firebase Console yet. Use "Continue with Google" below, or enable Email/Password under Firebase Console > Authentication > Sign-in method.';
    }
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found'
    ) {
      return 'Invalid credentials. Please check your Email/Mobile and Password.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'This email is already registered. Please switch to Login.';
    }
    if (code === 'auth/weak-password') {
      return 'Password must be at least 6 characters long.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Google sign-in popup was closed. Please try again.';
    }
    return msg;
  };

  const handleGoogleAuth = async () => {
    setError('');
    setInfoMessage('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    const rawId = loginIdentifier.trim();
    if (!rawId || !loginPassword) {
      setError('Please enter your Mobile Number / Email and Password.');
      return;
    }

    let resolvedEmail = rawId;
    if (!rawId.includes('@')) {
      const mapped = lookupEmailByMobile(rawId);
      if (!mapped) {
        setError(
          'No saved email found on this device for that mobile number. Please enter your registered Email address or create a new account.'
        );
        return;
      }
      resolvedEmail = mapped;
    }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, resolvedEmail, loginPassword);
      if (!cred.user.emailVerified) {
        setInfoMessage(
          'Signed in! Please verify your email address to enter the BooyahArena dashboard.'
        );
      }
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    const cleanUsername = username.trim();
    const cleanUid = ffUid.trim();
    const cleanIgn = ign.trim();
    const cleanMobileDigits = mobileNumber.replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();
    const cleanRef = referralCode.trim().toUpperCase();

    if (cleanUsername.length < 2) {
      setError('Username must be at least 2 characters.');
      return;
    }
    if (cleanUid.length < 4) {
      setError('Please enter a valid Free Fire UID (min 4 digits).');
      return;
    }
    if (!cleanIgn) {
      setError('Please enter your In-Game Name (IGN).');
      return;
    }
    if (cleanMobileDigits.length < 10) {
      setError('Please enter a valid 10-digit Mobile Number.');
      return;
    }
    if (!cleanEmail.includes('@')) {
      setError('Please enter a valid Email address.');
      return;
    }
    if (registerPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (cleanRef.length < 3) {
      setError(
        'Referral Code is compulsory! Use BOOYAH100 if you do not have a friend code.'
      );
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, registerPassword);
      await updateProfile(cred.user, { displayName: cleanUsername });

      try {
        localStorage.setItem(
          `booyah_pending_profile_${cred.user.uid}`,
          JSON.stringify({
            name: cleanUsername,
            username: cleanUsername,
            ffUid: cleanUid,
            ign: cleanIgn,
            mobileNumber: cleanMobileDigits,
            referralCode: cleanRef,
          })
        );
      } catch {}

      saveMobileToEmailMapping(cleanMobileDigits, cleanEmail);

      await sendEmailVerification(cred.user);
      setInfoMessage(
        `Account created! A verification link was sent to ${cleanEmail}. Verify your inbox, then click "I've Verified — Enter Arena".`
      );
    } catch (err) {
      setError(formatAuthError(err));
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
      setInfoMessage('Verification email resent! Please check your inbox or spam folder.');
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAndEnter = async () => {
    if (!auth.currentUser) return;
    setError('');
    setLoading(true);
    try {
      await onVerificationRefreshed();
      if (!auth.currentUser.emailVerified) {
        setError('Email is not verified yet. Please click the verification link in your email first.');
      }
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutPending = async () => {
    setError('');
    setInfoMessage('');
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden">
      {/* Subtle Esports Glow Backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 w-96 h-96 rounded-full bg-orange-600/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      {/* Top Auth Navbar */}
      <header className="relative z-10 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-zinc-950 shadow-lg shadow-orange-500/20">
              <Flame className="w-5 h-5 fill-zinc-950" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-xl tracking-wider text-white">
                BOOYAH<span className="text-amber-500">ARENA</span>
              </span>
              <span className="text-[10px] tracking-widest text-zinc-400 font-mono -mt-1">
                FREE FIRE ESPORTS
              </span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-zinc-400 hidden sm:block">
            English · Official Tournament Portal
          </div>
        </div>
      </header>

      {/* Main Split Container */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left: Gaming Hero Showcase */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-mono font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>INDIA&apos;S COMPETITIVE FREE FIRE ESPORTS ARENA</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-heading font-extrabold text-white leading-tight tracking-tight">
            Enter the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              Booyah Arena
            </span>{' '}
            &amp; Win Real Rewards
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl">
            Verified mobile-only custom scrims &amp; mega squad tournaments. Book your slot, receive real-time Room ID &amp; Password alerts, and claim instant UPI payouts.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <Trophy className="w-5 h-5 text-amber-400" />
              <div className="text-xs font-heading font-bold text-white">Daily Mega Scrims</div>
              <div className="text-[11px] font-mono text-zinc-400">Solo · Duo · Squad · CS</div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div className="text-xs font-heading font-bold text-white">100% Fair Play</div>
              <div className="text-[11px] font-mono text-zinc-400">No Emulators · Anti-Cheat</div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <Zap className="w-5 h-5 text-cyan-400" />
              <div className="text-xs font-heading font-bold text-white">UPI QR &amp; Payouts</div>
              <div className="text-[11px] font-mono text-zinc-400">Instant Wallet Sync</div>
            </div>
          </div>
        </div>

        {/* Right: Dedicated Login / Create Account Card */}
        <div className="lg:col-span-6">
          <div className="bg-zinc-900/95 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Switch Tabs */}
            {!needsEmailVerification && (
              <div className="grid grid-cols-2 border-b border-zinc-800 bg-zinc-950">
                <button
                  type="button"
                  onClick={() => {
                    setPage('login');
                    setError('');
                    setInfoMessage('');
                  }}
                  className={`py-3.5 text-sm font-heading font-bold transition-colors border-b-2 ${
                    page === 'login'
                      ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Player Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPage('register');
                    setError('');
                    setInfoMessage('');
                  }}
                  className={`py-3.5 text-sm font-heading font-bold transition-colors border-b-2 ${
                    page === 'register'
                      ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            <div className="p-5 sm:p-7 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2 leading-relaxed">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {initialReferralCode && !needsEmailVerification && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2 leading-relaxed">
                  <Ticket className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Invite Applied: Code <strong className="font-mono text-white">{initialReferralCode}</strong>! Register &amp; verify to unlock <strong>+₹10 Cash &amp; +50 Booyah Coins</strong>.
                  </span>
                </div>
              )}

              {infoMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2 leading-relaxed">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {needsEmailVerification ? (
                <div className="space-y-4 py-2">
                  <div className="space-y-1">
                    <div className="text-xs font-mono text-amber-400 uppercase font-bold">
                      Email Verification Required
                    </div>
                    <h2 className="text-xl font-heading font-extrabold text-white">
                      {currentFirebaseUser?.email}
                    </h2>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Click the verification link sent to your email inbox, then press the button below to enter the BooyahArena home dashboard.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleRefreshAndEnter}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-heading font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>I&apos;ve Verified — Enter BooyahArena</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={handleResendVerification}
                        className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-heading font-bold text-xs"
                      >
                        Resend Email
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={handleSignOutPending}
                        className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-300 hover:text-red-300 font-heading font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Switch Account</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : page === 'login' ? (
                /* LOGIN FORM */
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-heading font-extrabold text-white">
                      Welcome Back, Survivor
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Sign in with your Mobile Number / Email &amp; Password
                    </p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                    <div>
                      <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1.5">
                        Mobile Number or Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                          type="text"
                          required
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="9876543210 or player@gmail.com"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-zinc-950 font-heading font-bold text-sm tracking-wide shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all"
                    >
                      <span>{loading ? 'Signing in...' : 'Login to BooyahArena'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="relative flex items-center py-1">
                    <div className="flex-grow border-t border-zinc-800" />
                    <span className="shrink mx-3 text-[10px] font-mono text-zinc-500 uppercase">
                      or quick login
                    </span>
                    <div className="flex-grow border-t border-zinc-800" />
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleAuth}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-heading font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <div className="pt-2 border-t border-zinc-800 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setPage('register');
                        setError('');
                        setInfoMessage('');
                      }}
                      className="text-xs font-mono text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      New to BooyahArena? Create Account →
                    </button>
                  </div>
                </div>
              ) : (
                /* CREATE ACCOUNT FORM */
                <div className="space-y-3.5">
                  <div>
                    <h2 className="text-xl font-heading font-extrabold text-white">
                      Create Player Account
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Complete your esports profile (Referral Code compulsory)
                    </p>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-mono font-semibold text-zinc-300 block mb-1">
                          Username *
                        </label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input
                            type="text"
                            required
                            minLength={2}
                            maxLength={40}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="thunder_op"
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-mono font-semibold text-zinc-300 block mb-1">
                          Free Fire UID *
                        </label>
                        <div className="relative">
                          <Hash className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input
                            type="text"
                            required
                            minLength={4}
                            maxLength={30}
                            value={ffUid}
                            onChange={(e) => setFfUid(e.target.value)}
                            placeholder="284910284"
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-mono font-semibold text-zinc-300 block mb-1">
                          In-Game Name (IGN) *
                        </label>
                        <div className="relative">
                          <Gamepad2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input
                            type="text"
                            required
                            maxLength={40}
                            value={ign}
                            onChange={(e) => setIgn(e.target.value)}
                            placeholder="THUNDER_OP"
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-mono font-semibold text-zinc-300 block mb-1">
                          Mobile Number *
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input
                            type="tel"
                            required
                            minLength={10}
                            maxLength={15}
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            placeholder="9876543210"
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono font-semibold text-zinc-300 block mb-1">
                        Email Address (For Verification) *
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="player@gmail.com"
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-mono font-semibold text-zinc-300 block mb-1">
                          Password *
                        </label>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input
                            type={showRegisterPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            placeholder="Min 6 chars"
                            className="w-full pl-8 pr-8 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                          >
                            {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-mono font-semibold text-amber-400 block mb-1">
                          Referral Code (Compulsory) *
                        </label>
                        <div className="relative">
                          <Ticket className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
                          <input
                            type="text"
                            required
                            minLength={3}
                            maxLength={30}
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                            placeholder="BOOYAH100"
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-amber-500/40 text-xs font-mono font-bold text-amber-300 placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-zinc-500">
                      Tip: Enter a friend&apos;s referral code or use BOOYAH100 to register.
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-50 text-zinc-950 font-heading font-bold text-sm tracking-wide shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all"
                    >
                      <span>{loading ? 'Creating Account...' : 'Create Account & Enter Arena'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="pt-2 border-t border-zinc-800 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setPage('login');
                        setError('');
                        setInfoMessage('');
                      }}
                      className="text-xs font-mono text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      ← Already have an account? Back to Login
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
