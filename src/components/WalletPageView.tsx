import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle,
  ShieldAlert,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  History,
  BadgeIndianRupee,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  UserProfile,
  Transaction,
  DepositRequest,
  WithdrawRequest,
  PaymentSettings,
} from '../types/tournament';
import { Language, pickLocalized, translations } from '../utils/translations';
import { QRCodeSVG } from 'qrcode.react';

interface WalletPageViewProps {
  lang: Language;
  user: UserProfile;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  transactions: Transaction[];
  depositRequests: DepositRequest[];
  withdrawRequests: WithdrawRequest[];
  paymentSettings: PaymentSettings;
  onSubmitDepositRequest: (
    amount: number,
    upiTransactionId: string,
    payerUpiId?: string
  ) => Promise<void>;
  onWithdraw: (amount: number, upiId: string) => Promise<void>;
}

export const WalletPageView: React.FC<WalletPageViewProps> = ({
  lang,
  user,
  isAuthenticated,
  onRequireAuth,
  transactions,
  depositRequests,
  withdrawRequests,
  paymentSettings,
  onSubmitDepositRequest,
  onWithdraw,
}) => {
  const t = translations[lang];
  const [section, setSection] = useState<'withdraw' | 'add' | 'history'>('withdraw');

  // Withdraw Form State
  const [withdrawAmount, setWithdrawAmount] = useState<number>(50);
  const [upiId, setUpiId] = useState<string>('');
  const [withdrawError, setWithdrawError] = useState<string>('');
  const [withdrawSuccess, setWithdrawSuccess] = useState<string>('');
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

  // Add Money State
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [upiTransactionId, setUpiTransactionId] = useState<string>('');
  const [payerUpiId, setPayerUpiId] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [depositError, setDepositError] = useState<string>('');
  const [depositSuccess, setDepositSuccess] = useState<string>('');
  const [isDepositing, setIsDepositing] = useState<boolean>(false);

  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(paymentSettings.upiId)}&pn=${encodeURIComponent(
    paymentSettings.merchantName
  )}&am=${depositAmount || 100}&cu=INR&tn=${encodeURIComponent(
    `BooyahArena_${user.ign || 'Player'}`
  )}`;

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(paymentSettings.upiId);
    } catch {
      try {
        const el = document.createElement('textarea');
        el.value = paymentSettings.upiId;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      } catch {}
    }
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess('');

    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    if (!withdrawAmount || withdrawAmount < 50) {
      setWithdrawError(
        pickLocalized(
          lang,
          'Minimum withdrawal amount is ₹50.',
          'न्यूनतम निकासी राशि ₹50 है।',
          'সর্বনিম্ন উত্তোলনের পরিমাণ ₹৫০।'
        )
      );
      return;
    }

    if (withdrawAmount > user.walletBalance) {
      setWithdrawError(
        pickLocalized(
          lang,
          `Insufficient wallet balance. Available: ₹${user.walletBalance}`,
          `वॉलेट बैलेंस अपर्याप्त है। उपलब्ध: ₹${user.walletBalance}`,
          `ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। উপলব্ধ: ₹${user.walletBalance}`
        )
      );
      return;
    }

    const cleanedUpi = upiId.trim();
    if (cleanedUpi.length < 5 || !cleanedUpi.includes('@')) {
      setWithdrawError(
        pickLocalized(
          lang,
          'Please enter a valid UPI ID (e.g. yourname@okaxis or 9876543210@fam).',
          'कृपया सही UPI ID दर्ज करें (उदा. yourname@okaxis या 9876543210@fam)।',
          'অনুগ্রহ করে সঠিক UPI ID লিখুন (যেমন yourname@okaxis বা 9876543210@fam)।'
        )
      );
      return;
    }

    setIsWithdrawing(true);
    try {
      await onWithdraw(withdrawAmount, cleanedUpi);
      confetti({
        particleCount: 40,
        spread: 55,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#10b981'],
      });
      setWithdrawSuccess(
        pickLocalized(
          lang,
          `Payout request for ₹${withdrawAmount} to ${cleanedUpi} submitted! Status is now Pending for admin review.`,
          `₹${withdrawAmount} (${cleanedUpi}) की निकासी रिक्वेस्ट सबमिट हो गई है! एडमिन ट्रैकिंग के लिए स्टेटस अब Pending है।`,
          `${cleanedUpi}-এ ₹${withdrawAmount} তোলার অনুরোধ জমা হয়েছে! অ্যাডমিন যাচাইয়ের জন্য স্ট্যাটাস এখন Pending।'`
        )
      );
      setUpiId('');
    } catch (err) {
      setWithdrawError(
        err instanceof Error ? err.message : 'Failed to submit withdrawal request.'
      );
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleManualDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError('');
    setDepositSuccess('');

    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    if (!depositAmount || depositAmount < 10 || depositAmount > 50000) {
      setDepositError(
        pickLocalized(
          lang,
          'Deposit amount must be between ₹10 and ₹50,000.',
          'जमा राशि ₹10 से ₹50,000 के बीच होनी चाहिए।',
          'জমার পরিমাণ ₹১০ থেকে ₹৫০,০০০-এর মধ্যে হতে হবে।'
        )
      );
      return;
    }

    const cleanedUtr = upiTransactionId.trim();
    if (!/^[a-zA-Z0-9]{12,40}$/.test(cleanedUtr)) {
      setDepositError(
        pickLocalized(
          lang,
          'Please enter a valid 12-digit UPI Transaction ID / UTR number.',
          'कृपया कम से कम 12 अंकों का सही UPI Transaction ID / UTR नंबर दर्ज करें।',
          'অনুগ্রহ করে কমপক্ষে ১২ সংখ্যার সঠিক UPI Transaction ID / UTR নম্বর দিন।'
        )
      );
      return;
    }

    setIsDepositing(true);
    try {
      await onSubmitDepositRequest(depositAmount, cleanedUtr, payerUpiId.trim() || undefined);
      confetti({
        particleCount: 40,
        spread: 55,
        origin: { y: 0.7 },
        colors: ['#10b981', '#f59e0b'],
      });
      setUpiTransactionId('');
      setDepositSuccess(
        pickLocalized(
          lang,
          `Deposit request for ₹${depositAmount} (UTR: ${cleanedUtr}) submitted! Status is Pending until Admin approves.`,
          `₹${depositAmount} (UTR: ${cleanedUtr}) का रिक्वेस्ट सबमिट हो गया! एडमिन वेरिफिकेशन के बाद बैलेंस जुड़ जाएगा।`,
          `₹${depositAmount} (UTR: ${cleanedUtr}) ডিপোজিট অনুরোধ জমা হয়েছে! অ্যাডমিন অনুমোদনের পর ব্যালেন্স যোগ হবে।`
        )
      );
    } catch (err) {
      setDepositError(
        err instanceof Error ? err.message : 'Failed to submit deposit request.'
      );
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Wallet Balance Overview Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
                {pickLocalized(
                  lang,
                  'Esports Wallet & Payouts',
                  'ई-स्पोर्ट्स वॉलेट और निकासी',
                  'ই-স্পোর্টস ওয়ালেট ও পেমেন্ট'
                )}
              </h1>
              <p className="text-xs text-zinc-400 font-mono">
                {pickLocalized(
                  lang,
                  'Add Money via FamApp UPI QR or Withdraw Winnings directly to your UPI ID',
                  'FamApp UPI QR से पैसे जोड़ें या जीती हुई राशि सीधे अपनी UPI ID में निकालें',
                  'FamApp UPI QR দিয়ে টাকা যোগ করুন অথবা জেতা টাকা সরাসরি আপনার UPI ID-তে তুলুন'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-400 font-mono">
                {pickLocalized(lang, 'Real Cash Balance', 'असली कैश बैलेंस', 'আসল ক্যাশ ব্যালেন্স')}
              </div>
              <div className="text-3xl font-mono font-bold text-emerald-400 mt-1 tabular-nums">
                ₹{user.walletBalance}
              </div>
              <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                {pickLocalized(
                  lang,
                  'Withdrawable via UPI',
                  'UPI से निकालने योग्य',
                  'UPI-এর মাধ্যমে তোলা যাবে'
                )}
              </div>
            </div>
            <BadgeIndianRupee className="w-8 h-8 text-emerald-500/30" />
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-400 font-mono">{t.booyahCoinsLabel}</div>
              <div className="text-3xl font-mono font-bold text-amber-400 mt-1 tabular-nums">
                💎 {user.coinsBalance}
              </div>
              <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                {pickLocalized(
                  lang,
                  'Usable for Coin Scrims',
                  'कॉइन स्क्रिम्स में उपयोग करें',
                  'কয়েন স্ক্রিমে ব্যবহারযোগ্য'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-heading font-bold">
          <button
            type="button"
            onClick={() => setSection('withdraw')}
            className={`py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              section === 'withdraw'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{t.withdrawMoney}</span>
          </button>

          <button
            type="button"
            onClick={() => setSection('add')}
            className={`py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              section === 'add'
                ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>{t.addMoney}</span>
          </button>

          <button
            type="button"
            onClick={() => setSection('history')}
            className={`py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              section === 'history'
                ? 'bg-cyan-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>
              {pickLocalized(lang, 'Passbook', 'पासबुक', 'পাসবুক')} ({transactions.length})
            </span>
          </button>
        </div>
      </div>

      {/* SECTION 1: WITHDRAW SECTION & PAYOUT TRACKER */}
      {section === 'withdraw' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Withdraw Form */}
          <div className="lg:col-span-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg text-white">
                  {pickLocalized(
                    lang,
                    'Withdraw to UPI ID',
                    'UPI ID में पैसे निकालें',
                    'UPI ID-তে টাকা তুলুন'
                  )}
                </h2>
                <p className="text-[11px] font-mono text-zinc-400">{t.minWithdraw}</p>
              </div>
            </div>

            {withdrawError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{withdrawError}</span>
              </div>
            )}

            {withdrawSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{withdrawSuccess}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono font-semibold text-zinc-300 block mb-2">
                  {pickLocalized(
                    lang,
                    'Withdrawal Amount (₹)',
                    'निकासी राशि (₹)',
                    'উত্তোলনের পরিমাণ (₹)'
                  )}
                </label>

                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[50, 100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setWithdrawAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                        withdrawAmount === amt
                          ? 'bg-amber-500 text-zinc-950 ring-2 ring-amber-400'
                          : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min={50}
                  max={Math.max(50, user.walletBalance)}
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                  {t.minWithdraw} ·{' '}
                  {pickLocalized(lang, 'Available:', 'उपलब्ध:', 'উপলব্ধ:')} ₹{user.walletBalance}
                </span>
              </div>

              <div>
                <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1.5">
                  {pickLocalized(
                    lang,
                    'Your UPI ID (VPA) *',
                    'आपकी UPI ID (VPA) *',
                    'আপনার UPI ID (VPA) *'
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourname@okaxis or 9876543210@fam"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
                ⚡{' '}
                {pickLocalized(
                  lang,
                  'Submitted payout requests enter Pending status for Admin verification and are transferred directly to your UPI ID.',
                  'सबमिट करने के बाद रिक्वेस्ट Pending स्टेटस में जाएगी और एडमिन वेरिफिकेशन के बाद सीधे आपके UPI पर भेज दी जाएगी।',
                  'জমা দেওয়ার পর অনুরোধটি অ্যাডমিন যাচাইয়ের জন্য Pending অবস্থায় থাকবে এবং অনুমোদনের পর সরাসরি আপনার UPI-তে পাঠানো হবে।'
                )}
              </div>

              <button
                type="submit"
                disabled={isWithdrawing}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50 text-zinc-950 font-heading font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>
                  {isWithdrawing
                    ? pickLocalized(lang, 'Submitting Request...', 'सबमिट हो रहा है...', 'জমা হচ্ছে...')
                    : pickLocalized(
                        lang,
                        `Request Withdraw ₹${withdrawAmount}`,
                        `₹${withdrawAmount} निकासी रिक्वेस्ट भेजें`,
                        `₹${withdrawAmount} তোলার অনুরোধ পাঠান`
                      )}
                </span>
              </button>
            </form>
          </div>

          {/* Right: Payout Requests Tracker (Pending / Completed / Rejected) */}
          <div className="lg:col-span-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 className="font-heading font-bold text-lg text-white">
                  {pickLocalized(
                    lang,
                    'Payout Requests & Status',
                    'निकासी रिक्वेस्ट स्टेटस',
                    'পেআউট রিকোয়েস্ট ও স্ট্যাটাস'
                  )}
                </h2>
                <p className="text-[11px] font-mono text-zinc-400">
                  {pickLocalized(
                    lang,
                    'Real-time tracking for Admin payout approval',
                    'एडमिन द्वारा भुगतान की लाइव स्थिति',
                    'অ্যাডমিন অনুমোদনের রিয়েল-টাইম স্ট্যাটাস'
                  )}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold text-zinc-300">
                {withdrawRequests.length}
              </span>
            </div>

            {withdrawRequests.length === 0 ? (
              <div className="py-10 text-center space-y-2 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <Clock className="w-7 h-7 text-zinc-600 mx-auto" />
                <div className="text-xs font-mono text-zinc-400">
                  {pickLocalized(
                    lang,
                    'No withdrawal requests submitted yet.',
                    'अभी तक कोई निकासी रिक्वेस्ट नहीं भेजी गई है।',
                    'এখনও কোনো টাকা তোলার অনুরোধ জমা দেওয়া হয়নি।'
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {withdrawRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-white tabular-nums">
                          ₹{req.amount}
                        </span>
                        <span className="text-xs font-mono text-zinc-400 truncate">
                          → {req.upiId}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-1">
                        {req.createdAtLabel || 'Just now'}
                        {req.payoutRef ? ` · Ref: ${req.payoutRef}` : ''}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 shrink-0 ${
                        req.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : req.status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {req.status === 'PENDING' && <Clock className="w-3 h-3" />}
                      {req.status === 'COMPLETED' && <CheckCircle className="w-3 h-3" />}
                      <span>
                        {req.status === 'PENDING'
                          ? 'PENDING'
                          : req.status === 'COMPLETED'
                            ? 'PAID'
                            : 'REJECTED'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: ADD MONEY (MANUAL FAMAPP UPI QR) */}
      {section === 'add' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6 flex flex-col items-center text-center space-y-3">
            <div className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
              {pickLocalized(
                lang,
                'Scan Official FamApp UPI QR Code',
                'आधिकारिक FamApp UPI QR कोड स्कैन करें',
                'অফিশিয়াল FamApp UPI QR কোড স্ক্যান করুন'
              )}
            </div>

            <div>
              <div className="text-lg font-heading font-extrabold text-amber-400 tracking-wide">
                {paymentSettings.merchantName}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                FamApp · Verified Merchant UPI
              </div>
            </div>

            {paymentSettings.qrImageUrl?.includes(
              'Screenshot_2026-11-13-08-48-19-19_ba41e9a642e6e0e2b03656bfbbffd6e4_3f41749b.jpg'
            ) ? (
              <div className="relative w-56 h-[278px] rounded-2xl overflow-hidden bg-[#f2d68b] shadow-xl border-2 border-amber-400/50 mx-auto">
                <img
                  src={paymentSettings.qrImageUrl}
                  alt={`${paymentSettings.merchantName} FamApp UPI QR Code`}
                  className="absolute max-w-none w-[176%] left-1/2 -translate-x-1/2 -top-[81.5%] select-none pointer-events-none"
                />
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-white shadow-lg flex items-center justify-center">
                {paymentSettings.qrImageUrl ? (
                  <img
                    src={paymentSettings.qrImageUrl}
                    alt={`${paymentSettings.merchantName} UPI QR Code`}
                    className="w-48 h-48 object-contain rounded"
                  />
                ) : (
                  <QRCodeSVG value={upiDeepLink} size={176} level="M" includeMargin={false} />
                )}
              </div>
            )}

            <div className="w-full space-y-2 pt-1">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                Official UPI ID
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="px-3.5 py-1.5 rounded-lg bg-zinc-950 border border-amber-500/30 text-sm font-mono font-bold text-amber-400 select-all">
                  {paymentSettings.upiId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold flex items-center gap-1.5 transition-colors ${
                    copiedUpi
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                  }`}
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{t.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{pickLocalized(lang, 'Copy UPI ID', 'UPI ID कॉपी करें', 'UPI ID কপি করুন')}</span>
                    </>
                  )}
                </button>
              </div>
              <a
                href={upiDeepLink}
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 hover:underline pt-1"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>
                  {pickLocalized(
                    lang,
                    'Pay directly via UPI App',
                    'मोबाइल UPI ऐप में खोलें',
                    'সরাসরি UPI অ্যাপে পেমেন্ট করুন'
                  )}
                </span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6 space-y-4">
            <h2 className="font-heading font-bold text-lg text-white border-b border-zinc-800 pb-3">
              {pickLocalized(
                lang,
                'Claim Your Manual Deposit (UTR)',
                'मैनुअल डिपॉजिट क्लेम करें (UTR)',
                'ম্যানুয়াল ডিপোজিট ক্লেম করুন (UTR)'
              )}
            </h2>

            {depositError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{depositError}</span>
              </div>
            )}

            {depositSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{depositSuccess}</span>
              </div>
            )}

            <form onSubmit={handleManualDepositSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-mono font-semibold text-zinc-300 block mb-2">
                  {pickLocalized(
                    lang,
                    'Amount Paid (₹)',
                    'जमा राशि (₹10 - ₹50,000)',
                    'জমার পরিমাণ (₹১০ - ₹৫০,০০০)'
                  )}
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[50, 100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                        depositAmount === amt
                          ? 'bg-emerald-500 text-zinc-950 ring-2 ring-emerald-400'
                          : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={10}
                  max={50000}
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1">
                  {pickLocalized(
                    lang,
                    '12-Digit UPI Transaction ID (UTR / Ref No.) *',
                    '12-अंकों का UPI Transaction ID (UTR / Ref No.) *',
                    '১২-সংখ্যার UPI Transaction ID (UTR / Ref No.) *'
                  )}
                </label>
                <input
                  type="text"
                  required
                  minLength={12}
                  maxLength={40}
                  value={upiTransactionId}
                  onChange={(e) => setUpiTransactionId(e.target.value)}
                  placeholder="e.g. 412893019283"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                  {pickLocalized(
                    lang,
                    'Your UPI ID (Optional)',
                    'आपका UPI ID (वैकल्पिक)',
                    'আপনার UPI ID (ঐচ্ছিক)'
                  )}
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={payerUpiId}
                  onChange={(e) => setPayerUpiId(e.target.value)}
                  placeholder="yourname@okaxis"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isDepositing}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 text-zinc-950 font-heading font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>
                  {isDepositing
                    ? pickLocalized(lang, 'Submitting Claim...', 'सबमिट हो रहा है...', 'জমা হচ্ছে...')
                    : pickLocalized(
                        lang,
                        `Submit & Claim ₹${depositAmount} Deposit`,
                        `₹${depositAmount} डिपॉजिट क्लेम करें`,
                        `₹${depositAmount} ডিপোজিট ক্লেম করুন`
                      )}
                </span>
              </button>
            </form>

            {depositRequests.length > 0 && (
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <div className="text-[11px] font-mono font-semibold text-zinc-400 uppercase">
                  {pickLocalized(
                    lang,
                    'Recent Deposit Requests',
                    'हाल के डिपॉजिट रिक्वेस्ट',
                    'সাম্প্রতিক ডিপোজিট রিকোয়েস্ট'
                  )}
                </div>
                <div className="space-y-1.5">
                  {depositRequests.slice(0, 4).map((req) => (
                    <div
                      key={req.id}
                      className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <div className="text-zinc-200 font-bold">₹{req.amount}</div>
                        <div className="text-[10px] text-zinc-500">UTR: {req.upiTransactionId}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : req.status === 'REJECTED'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: PASSBOOK HISTORY */}
      {section === 'history' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6 space-y-3">
          <h2 className="font-heading font-bold text-lg text-white border-b border-zinc-800 pb-3">
            {pickLocalized(
              lang,
              'Wallet Passbook & Transactions',
              'वॉलेट पासबुक और लेनदेन',
              'ওয়ালেট পাসবুক ও লেনদেনের ইতিহাস'
            )}
          </h2>
          {transactions.length === 0 ? (
            <div className="py-10 text-center text-xs font-mono text-zinc-500">
              {pickLocalized(
                lang,
                'No wallet transactions yet.',
                'अभी कोई ट्रांजैक्शन नहीं है।',
                'এখনও কোনো লেনদেন হয়নি।'
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isCredit =
                  tx.type === 'PRIZE_WON' ||
                  tx.type === 'DEPOSIT' ||
                  tx.type === 'DAILY_BONUS' ||
                  tx.type === 'REFERRAL_BONUS';
                return (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isCredit
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-zinc-200 truncate">
                          {lang === 'hi' ? tx.descriptionHi : tx.description}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-2">
                          <span>{tx.date}</span>
                          {tx.status !== 'SUCCESS' && (
                            <span
                              className={
                                tx.status === 'PENDING'
                                  ? 'text-amber-400 font-bold'
                                  : 'text-red-400 font-bold'
                              }
                            >
                              · {tx.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`text-xs font-mono font-bold tabular-nums shrink-0 ${
                        isCredit ? 'text-emerald-400' : 'text-zinc-300'
                      }`}
                    >
                      {isCredit ? '+' : '-'}
                      {tx.currency === 'INR' ? `₹${tx.amount}` : `💎${tx.amount}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
