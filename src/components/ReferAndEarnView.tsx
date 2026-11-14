import React, { useState } from 'react';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Coins,
  Wallet,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Smartphone,
  ShieldAlert,
} from 'lucide-react';
import { ReferralRecord, UserProfile } from '../types/tournament';
import { Language, pickLocalized } from '../utils/translations';
import {
  buildApkDownloadShareUrl,
  buildReferralShareUrl,
  REFERRAL_REWARD_CASH,
  REFERRAL_REWARD_COINS,
} from '../utils/appLinks';

interface ReferAndEarnViewProps {
  user: UserProfile;
  lang: Language;
  referrals: ReferralRecord[];
  onRedeemReferralCode: (code: string) => Promise<void>;
  onOpenApkModal?: () => void;
}

export const ReferAndEarnView: React.FC<ReferAndEarnViewProps> = ({
  user,
  lang,
  referrals,
  onRedeemReferralCode,
  onOpenApkModal,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedApkLink, setCopiedApkLink] = useState(false);
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState('');

  const myCode = user.myReferralCode || 'BOOYAH100';
  const referralUrl = buildReferralShareUrl(myCode);
  const apkInstallUrl = buildApkDownloadShareUrl();

  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate([15, 20, 25]);
      }
    } catch {}
  };

  const copyText = async (text: string, onDone: () => void) => {
    triggerHaptic();
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
    onDone();
  };

  const handleCopyCode = () => {
    copyText(myCode, () => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const handleCopyLink = () => {
    copyText(referralUrl, () => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleCopyApkLink = () => {
    copyText(apkInstallUrl, () => {
      setCopiedApkLink(true);
      setTimeout(() => setCopiedApkLink(false), 2000);
    });
  };

  const inviteMessage = `🔥 Join me on BOOYAH ARENA — Free Fire eSports Tournaments! Use my referral code *${myCode}* or open my invite link to get ₹${REFERRAL_REWARD_CASH} Wallet Cash + ${REFERRAL_REWARD_COINS} Booyah Coins bonus automatically: ${referralUrl}`;

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(inviteMessage)}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(
    `🔥 Join BOOYAH ARENA Free Fire Tournaments with code ${myCode} and get ₹${REFERRAL_REWARD_CASH} Cash + ${REFERRAL_REWARD_COINS} Coins free!`
  )}`;

  const handleNativeShare = async () => {
    triggerHaptic();
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'BOOYAH ARENA — Free Fire eSports Invite',
          text: `Use my referral code ${myCode} to get ₹${REFERRAL_REWARD_CASH} Cash + ${REFERRAL_REWARD_COINS} Booyah Coins free!`,
          url: referralUrl,
        });
        return;
      } catch {
        // Fallback to copy if user cancelled or share blocked in iframe
      }
    }
    handleCopyLink();
  };

  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemError('');
    setRedeemSuccess('');

    const clean = friendCodeInput.trim().toUpperCase();
    if (clean.length < 4) {
      setRedeemError(
        pickLocalized(
          lang,
          'Please enter a valid friend referral code.',
          'कृपया सही रेफरल कोड दर्ज करें।',
          'অনুগ্রহ করে সঠিক রেফারেল কোড লিখুন।'
        )
      );
      return;
    }

    setRedeemLoading(true);
    try {
      await onRedeemReferralCode(clean);
      setRedeemSuccess(
        pickLocalized(
          lang,
          `Bonus Credited! +₹${REFERRAL_REWARD_CASH} Cash & +${REFERRAL_REWARD_COINS} Coins added to both wallets!`,
          `बोनस मिल गया! दोनों वॉलेट में +₹${REFERRAL_REWARD_CASH} कैश और +${REFERRAL_REWARD_COINS} कॉइन्स जोड़े गए!`,
          `বোনাস ক্রেডিট হয়েছে! দুজনের ওয়ালেটেই +₹${REFERRAL_REWARD_CASH} ক্যাশ এবং +${REFERRAL_REWARD_COINS} কয়েন যোগ হয়েছে!`
        )
      );
      setFriendCodeInput('');
      triggerHaptic();
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : 'Unable to redeem referral code.');
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-orange-950/30 p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
              <Gift className="w-3.5 h-3.5" />
              <span>
                {pickLocalized(
                  lang,
                  'REFER & EARN PROGRAM',
                  'रेफर करें और कमाएं',
                  'রেফার ও আয় প্রোগ্রাম'
                )}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-wide">
              {pickLocalized(
                lang,
                `Invite Squadmates & Earn ₹${REFERRAL_REWARD_CASH} + ${REFERRAL_REWARD_COINS} Coins Each`,
                `दोस्तों को बुलाएं और पाएं ₹${REFERRAL_REWARD_CASH} कैश + ${REFERRAL_REWARD_COINS} कॉइन्स`,
                `বন্ধুদের আমন্ত্রণ জানান ও পান ₹${REFERRAL_REWARD_CASH} ক্যাশ + ${REFERRAL_REWARD_COINS} কয়েন`
              )}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {pickLocalized(
                lang,
                `Share your unique invite link below. When a friend opens it, installs/registers on Booyah Arena, and verifies their account, BOTH of you automatically receive ₹${REFERRAL_REWARD_CASH} Wallet Cash and ${REFERRAL_REWARD_COINS} Booyah Coins!`,
                `अपना यूनिक इनवाइट लिंक शेयर करें। जब आपका दोस्त ऐप खोलकर रजिस्टर और वेरिफाई करेगा, तो आप दोनों को तुरंत ₹${REFERRAL_REWARD_CASH} कैश और ${REFERRAL_REWARD_COINS} कॉइन्स मिलेंगे!`,
                `আপনার ইউনিক ইনভাইট লিংক শেয়ার করুন। আপনার বন্ধু রেজিস্টার করে ভেরিফাই করলেই আপনারা দুজনেই স্বয়ংক্রিয়ভাবে ₹${REFERRAL_REWARD_CASH} ওয়ালেট ক্যাশ এবং ${REFERRAL_REWARD_COINS} কয়েন পাবেন!`
              )}
            </p>
          </div>

          {/* Two-Way Reward Pills */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-4 rounded-xl bg-zinc-950/90 border border-emerald-500/30 text-center space-y-1">
              <div className="text-[10px] font-mono text-zinc-400 uppercase">
                {pickLocalized(lang, 'You Earn', 'आपको मिलेगा', 'আপনি পাবেন')}
              </div>
              <div className="text-xl font-mono font-extrabold text-emerald-400">
                +₹{REFERRAL_REWARD_CASH}
              </div>
              <div className="text-xs font-mono font-bold text-amber-400">
                +💎 {REFERRAL_REWARD_COINS} Coins
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/90 border border-orange-500/30 text-center space-y-1">
              <div className="text-[10px] font-mono text-zinc-400 uppercase">
                {pickLocalized(lang, 'Friend Gets', 'दोस्त को मिलेगा', 'বন্ধু পাবে')}
              </div>
              <div className="text-xl font-mono font-extrabold text-orange-400">
                +₹{REFERRAL_REWARD_CASH}
              </div>
              <div className="text-xs font-mono font-bold text-cyan-400">
                +💎 {REFERRAL_REWARD_COINS} Coins
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-zinc-400">
              {pickLocalized(lang, 'Successful Referrals', 'सफल रेफरल', 'সফল রেফারেল')}
            </div>
            <div className="text-2xl font-mono font-extrabold text-white tabular-nums mt-1">
              {user.referralCount ?? referrals.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-zinc-400">
              {pickLocalized(lang, 'Referral Coins Earned', 'रेफरल कॉइन्स कमाई', 'রেফারেল কয়েন আয়')}
            </div>
            <div className="text-2xl font-mono font-extrabold text-cyan-400 tabular-nums mt-1">
              💎 {user.referralEarningsCoins ?? 0}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-zinc-400">
              {pickLocalized(lang, 'Referral Cash Earned', 'रेफरल कैश कमाई', 'রেফারেল ক্যাশ আয়')}
            </div>
            <div className="text-2xl font-mono font-extrabold text-emerald-400 tabular-nums mt-1">
              ₹{user.referralEarningsCash ?? 0}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Share Code, Referral Link & APK Direct Link */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-lg font-heading font-extrabold text-white">
              {pickLocalized(
                lang,
                'Your Unique Referral Code & Invite Link',
                'आपका यूनिक रेफरल कोड और इनवाइट लिंक',
                'আপনার ইউনিক রেফারেল কোড ও ইনভাইট লিংক'
              )}
            </h2>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              {pickLocalized(
                lang,
                'Uses public HTTPS URL — works seamlessly on all mobile browsers & Android APK installs',
                'पब्लिक HTTPS लिंक — मोबाइल ब्राउज़र और APK इंस्टॉल पर बिना किसी एरर के काम करता है',
                'পাবলিক HTTPS লিংক — মোবাইল ব্রাউজার ও APK ইনস্টলে কোনো সমস্যা ছাড়াই কাজ করে'
              )}
            </p>
          </div>

          {/* Code Tap-to-Copy Tile */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-zinc-400 uppercase font-bold">
              {pickLocalized(lang, 'Your Referral Code', 'आपका रेफरल कोड', 'আপনার রেফারেল কোড')}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className={`w-full p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all active:scale-[0.98] ${
                copiedCode
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                  : 'bg-zinc-950 border-amber-500/40 hover:border-amber-400 text-amber-300'
              }`}
            >
              <span className="text-lg sm:text-xl font-mono font-extrabold tracking-widest">
                {myCode}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 text-xs font-heading font-bold">
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </span>
            </button>
          </div>

          {/* Clean Public Referral Link */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-zinc-400 uppercase font-bold">
              {pickLocalized(lang, 'Public Referral Invite Link', 'पब्लिक रेफरल लिंक', 'পাবলিক রেফারেল লিংক')}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={referralUrl}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2.5 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-heading font-bold flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Social Share Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-heading font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href={telegramShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-heading font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Telegram</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={handleNativeShare}
              className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-heading font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{pickLocalized(lang, 'More / Share', 'अन्य शेयर', 'অন্যান্য শেয়ার')}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Redeem Friend Code + Direct Mobile APK Download Link */}
        <div className="lg:col-span-5 space-y-5">
          {/* Redeem Friend Code Box */}
          <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 space-y-3.5">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-heading font-extrabold text-white">
                {pickLocalized(
                  lang,
                  'Claim Friend Referral Bonus',
                  'दोस्त का रेफरल कोड लागू करें',
                  'বন্ধুর রেফারেল কোড ব্যবহার করুন'
                )}
              </h3>
            </div>

            {user.referralRewardClaimed ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">
                    {pickLocalized(
                      lang,
                      'Referral Welcome Bonus Credited!',
                      'रेफरल वेलकम बोनस मिल चुका है!',
                      'রেফারেল ওয়েলকাম বোনাস ক্রেডিট হয়েছে!'
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-emerald-400/90 mt-0.5">
                    Applied Code: {user.referredByCode || user.referralCode}
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRedeemSubmit} className="space-y-3">
                <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                  {pickLocalized(
                    lang,
                    `Did a friend invite you? Enter their referral code below to credit ₹${REFERRAL_REWARD_CASH} Cash + ${REFERRAL_REWARD_COINS} Coins to both of you!`,
                    `किसी दोस्त ने इनवाइट किया? नीचे उनका कोड डालें और दोनों को ₹${REFERRAL_REWARD_CASH} कैश + ${REFERRAL_REWARD_COINS} कॉइन्स तुरंत मिलें!`,
                    `কোনো বন্ধু ইনভাইট করলে নিচে তার কোড দিন এবং দুজনেই ₹${REFERRAL_REWARD_CASH} ক্যাশ + ${REFERRAL_REWARD_COINS} কয়েন পান!`
                  )}
                </p>

                {redeemError && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300 flex items-start gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <span>{redeemError}</span>
                  </div>
                )}

                {redeemSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{redeemSuccess}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={friendCodeInput}
                    onChange={(e) => setFriendCodeInput(e.target.value.toUpperCase())}
                    placeholder="BYH..."
                    maxLength={20}
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold text-amber-300 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={redeemLoading}
                    className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 text-xs font-heading font-bold flex items-center gap-1 transition-colors shrink-0"
                  >
                    <span>{redeemLoading ? 'Applying...' : 'Claim'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Mobile App / APK Download Link Card */}
          <div className="rounded-2xl bg-zinc-900/90 border border-orange-500/30 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-heading font-extrabold text-white">
                {pickLocalized(
                  lang,
                  'Mobile APK & Direct Install Link',
                  'मोबाइल APK व डायरेक्ट इंस्टॉल लिंक',
                  'মোবাইল APK ও ডাইরেক্ট ইনস্টল লিংক'
                )}
              </h3>
            </div>
            <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
              {pickLocalized(
                lang,
                'Clean public HTTPS link configured with manifest.json & allowedHosts so mobile users can open and install the app directly.',
                'क्लीन पब्लिक HTTPS लिंक ताकि मोबाइल यूजर्स सीधे ऐप खोल सकें और इंस्टॉल कर सकें।',
                'সঠিক HTTPS লিংক যাতে মোবাইল ব্যবহারকারীরা সরাসরি অ্যাপ খুলে ইনস্টল করতে পারেন।'
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyApkLink}
                className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
              >
                {copiedApkLink ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedApkLink ? 'APK Link Copied!' : 'Copy App/APK URL'}</span>
              </button>

              {onOpenApkModal && (
                <button
                  type="button"
                  onClick={onOpenApkModal}
                  className="py-2 px-3.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-zinc-950 text-xs font-heading font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span>Open APK Export</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tracked Referrals List */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-heading font-extrabold text-white">
              {pickLocalized(
                lang,
                'Your Tracked Referrals',
                'आपके सफल रेफरल्स',
                'আপনার সফল রেফারেল তালিকা'
              )}
            </h2>
            <p className="text-xs font-mono text-zinc-400">
              {pickLocalized(
                lang,
                'Verified players who registered using your referral code or link',
                'वे खिलाड़ी जिन्होंने आपके कोड या लिंक से रजिस्टर किया',
                'যারা আপনার রেফারেল কোড বা লিংক ব্যবহার করে জয়েন করেছেন'
              )}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold text-amber-400">
            {referrals.length} {pickLocalized(lang, 'Joined', 'जुड़े', 'জন')}
          </span>
        </div>

        {referrals.length === 0 ? (
          <div className="py-8 text-center rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
            <p className="text-xs font-mono text-zinc-400">
              {pickLocalized(
                lang,
                'No referrals yet. Share your link with your Free Fire squad to start earning!',
                'अभी कोई रेफरल नहीं है। कमाई शुरू करने के लिए अपने स्क्वाड के साथ लिंक शेयर करें!',
                'এখনও কোনো রেফারেল নেই। আয় শুরু করতে আপনার স্কোয়াডের সাথে লিংক শেয়ার করুন!'
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {referrals.map((ref) => (
              <div
                key={ref.id}
                className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-heading font-bold text-xs">
                    {ref.referredIgn.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-heading font-bold text-white">
                      {ref.referredIgn}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      Code: {ref.referrerCode} · {ref.createdAtLabel || 'Credited'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                    +₹{ref.referrerBonusCash}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
                    +💎 {ref.referrerBonusCoins}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
