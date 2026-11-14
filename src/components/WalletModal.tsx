import React, { useState } from 'react';
import {
  X,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Smartphone,
  Copy,
  Check,
  Clock,
  ShieldAlert,
  ExternalLink,
  LogIn,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  UserProfile,
  Transaction,
  DepositRequest,
  WithdrawRequest,
  PaymentSettings,
} from '../types/tournament';
import { translations, Language, pickLocalized } from '../utils/translations';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  user: UserProfile;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  transactions: Transaction[];
  depositRequests: DepositRequest[];
  withdrawRequests?: WithdrawRequest[];
  paymentSettings: PaymentSettings;
  onSubmitDepositRequest: (
    amount: number,
    upiTransactionId: string,
    payerUpiId?: string
  ) => Promise<void>;
  onWithdraw: (amount: number, upiId: string) => Promise<void>;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  lang,
  user,
  isAuthenticated,
  onRequireAuth,
  transactions,
  depositRequests,
  withdrawRequests = [],
  paymentSettings,
  onSubmitDepositRequest,
  onWithdraw,
}) => {
  const [activeTab, setActiveTab] = useState<'add' | 'withdraw' | 'history'>('add');
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [upiTransactionId, setUpiTransactionId] = useState<string>('');
  const [payerUpiId, setPayerUpiId] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState<number>(100);
  const [upiId, setUpiId] = useState<string>('');
  const [withdrawError, setWithdrawError] = useState<string>('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string>('');

  if (!isOpen) return null;

  const t = translations[lang];

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

  const handleManualDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError('');
    setActionSuccessMessage('');

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

    setIsSubmitting(true);
    try {
      await onSubmitDepositRequest(depositAmount, cleanedUtr, payerUpiId.trim() || undefined);
      confetti({
        particleCount: 40,
        spread: 55,
        origin: { y: 0.7 },
        colors: ['#10b981', '#f59e0b'],
      });
      setUpiTransactionId('');
      setActionSuccessMessage(
        pickLocalized(
          lang,
          `Deposit request for ₹${depositAmount} (UTR: ${cleanedUtr}) submitted! Admin approval will credit your wallet instantly.`,
          `₹${depositAmount} का रिक्वेस्ट (UTR: ${cleanedUtr}) सबमिट हो गया! एडमिन वेरिफिकेशन के बाद बैलेंस जुड़ जाएगा।`,
          `₹${depositAmount}-এর রিকোয়েস্ট (UTR: ${cleanedUtr}) জমা হয়েছে! অ্যাডমিন যাচাইয়ের পর ব্যালেন্স যোগ হবে।`
        )
      );
      setTimeout(() => setActionSuccessMessage(''), 5000);
    } catch (err) {
      setDepositError(
        err instanceof Error ? err.message : 'Failed to submit deposit request.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    setActionSuccessMessage('');

    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    if (withdrawAmount < 50) {
      setWithdrawError('Minimum withdrawal amount is ₹50');
      return;
    }

    if (withdrawAmount > user.walletBalance) {
      setWithdrawError('Insufficient wallet balance');
      return;
    }

    if (!upiId.trim() || !upiId.includes('@')) {
      setWithdrawError('Please enter a valid UPI ID (e.g. mobile@upi or username@okaxis)');
      return;
    }

    setIsSubmitting(true);
    try {
      await onWithdraw(withdrawAmount, upiId.trim());
      setUpiId('');
      setActionSuccessMessage(
        `Withdrawal of ₹${withdrawAmount} requested to ${upiId.trim()}. Status: PENDING for admin tracking.`
      );
      setTimeout(() => setActionSuccessMessage(''), 5000);
    } catch (err) {
      setWithdrawError(err instanceof Error ? err.message : 'Withdrawal failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-heading font-bold text-white">
                {pickLocalized(lang, 'Esports Wallet & Payouts', 'वॉलेट और निकासी', 'ওয়ালেট ও পেমেন্ট')}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                {pickLocalized(
                  lang,
                  'UPI QR Scan & Admin Verified Top-Up',
                  'UPI QR स्कैन व UTR वेरिफिकेशन',
                  'UPI QR স্ক্যান ও UTR ভেরিফিকেশন'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Balance Showcase */}
        <div className="p-4 bg-gradient-to-br from-zinc-950 to-zinc-900 border-b border-zinc-800">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <div className="text-[11px] text-zinc-400 font-mono font-medium">Real Cash (INR)</div>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-0.5 tabular-nums">
                ₹{user.walletBalance}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Withdrawable to UPI</div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <div className="text-[11px] text-zinc-400 font-mono font-medium">Booyah Coins</div>
              <div className="text-2xl font-mono font-bold text-amber-400 mt-0.5 tabular-nums">
                💎 {user.coinsBalance}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Usable for Scrims</div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 border-b border-zinc-800 text-xs font-heading font-bold bg-zinc-950">
          <button
            onClick={() => setActiveTab('add')}
            className={`py-3 text-center transition-colors border-b-2 ${
              activeTab === 'add'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.addMoney}
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`py-3 text-center transition-colors border-b-2 ${
              activeTab === 'withdraw'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.withdrawMoney}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 text-center transition-colors border-b-2 ${
              activeTab === 'history'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Passbook ({transactions.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {!isAuthenticated && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="text-xs text-amber-200">
                {pickLocalized(
                  lang,
                  'Please sign in to submit UPI deposits or withdrawals.',
                  'पैसे जोड़ने या निकालने के लिए पहले लॉगिन करें।',
                  'টাকা যোগ বা তুলতে অনুগ্রহ করে সাইন ইন করুন।'
                )}
              </div>
              <button
                type="button"
                onClick={onRequireAuth}
                className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-heading font-bold text-xs flex items-center gap-1 shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{pickLocalized(lang, 'Sign In', 'लॉगिन', 'সাইন ইন')}</span>
              </button>
            </div>
          )}

          {actionSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{actionSuccessMessage}</span>
            </div>
          )}

          {/* TAB 1: MANUAL UPI QR ADD MONEY */}
          {activeTab === 'add' && (
            <div className="space-y-4">
              {/* Step 1: Select Amount */}
              <div>
                <label className="text-xs font-mono font-semibold text-zinc-300 block mb-2">
                  {pickLocalized(
                    lang,
                    '1. Select or Enter Amount (₹)',
                    '1. राशि चुनें (₹10 - ₹50,000)',
                    '১. পরিমাণ নির্বাচন করুন (₹১০ - ₹৫০,০০০)'
                  )}
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[50, 100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className={`py-2 px-2 rounded-xl text-xs font-mono font-bold transition-all ${
                        depositAmount === amt
                          ? 'bg-emerald-500 text-zinc-950 ring-2 ring-emerald-400 font-extrabold'
                          : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700'
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
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Custom amount in ₹"
                />
              </div>

              {/* Step 2: Scan Personal FamApp UPI QR Code */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col items-center text-center space-y-3">
                <div className="text-[11px] font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                  {pickLocalized(
                    lang,
                    '2. Scan FamApp UPI QR Code to Pay',
                    '2. नीचे दिए QR कोड को स्कैन करके पेमेंट करें',
                    '২. পেমেন্ট করতে নিচের FamApp QR কোড স্ক্যান করুন'
                  )}
                </div>

                {/* Receiver Name Above QR */}
                <div className="space-y-0.5">
                  <div className="text-base font-heading font-extrabold text-amber-400 tracking-wide">
                    {paymentSettings.merchantName}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    FamApp · Verified Merchant UPI
                  </div>
                </div>

                {/* QR Code Frame */}
                {paymentSettings.qrImageUrl?.includes('Screenshot_2026-11-13-08-48-19-19_ba41e9a642e6e0e2b03656bfbbffd6e4_3f41749b.jpg') ? (
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
                      <QRCodeSVG
                        value={upiDeepLink}
                        size={176}
                        level="M"
                        includeMargin={false}
                      />
                    )}
                  </div>
                )}

                {/* Official UPI ID + Copy UPI ID Button Below QR */}
                <div className="w-full space-y-2 pt-1">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                    Official UPI ID
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-amber-500/30 text-xs sm:text-sm font-mono font-bold text-amber-400 select-all">
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
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {paymentSettings.instructions}
                  </p>
                  <a
                    href={upiDeepLink}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 hover:underline pt-1"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{pickLocalized(lang, 'Pay directly via UPI App', 'मोबाइल UPI ऐप में खोलें', 'সরাসরি UPI অ্যাপে পেমেন্ট করুন')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Step 3: Submit 12-Digit UTR / Transaction ID */}
              <form onSubmit={handleManualDepositSubmit} className="space-y-3">
                {depositError && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{depositError}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1">
                    {pickLocalized(
                      lang,
                      '3. 12-Digit UPI Transaction ID (UTR / Ref No.) *',
                      '3. 12-अंकों का UPI Transaction ID (UTR / Ref No.) *',
                      '৩. ১২-সংখ্যার UPI Transaction ID (UTR / Ref No.) *'
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
                  <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                    {pickLocalized(
                      lang,
                      'Find the 12-digit UTR / UPI Ref No. in your payment receipt',
                      'PhonePe/GPay/Paytm पेमेंट के बाद 12-अंकों का UTR नंबर यहाँ डालें',
                      'FamApp/PhonePe/GPay পেমেন্টের পর ১২-সংখ্যার UTR নম্বর এখানে লিখুন'
                    )}
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                    {pickLocalized(lang, 'Your UPI ID (Optional)', 'आपका UPI ID (वैकल्पिक)', 'আপনার UPI ID (ঐচ্ছিক)')}
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
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 text-zinc-950 font-heading font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? pickLocalized(lang, 'Submitting Claim...', 'क्लेम सबमिट हो रहा है...', 'ক্লেম জমা হচ্ছে...')
                      : pickLocalized(
                          lang,
                          `Submit & Claim ₹${depositAmount} Deposit`,
                          `₹${depositAmount} डिपॉजिट क्लेम करें`,
                          `₹${depositAmount} ডিপোজিট ক্লেম করুন`
                        )}
                  </span>
                </button>
              </form>

              {/* Recent Manual Deposit Requests Status */}
              {depositRequests.length > 0 && (
                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <div className="text-[11px] font-mono font-semibold text-zinc-400 uppercase">
                    {pickLocalized(
                      lang,
                      'Your Deposit Requests',
                      'आपके हाल के डिपॉजिट रिक्वेस्ट',
                      'আপনার সাম্প্রতিক ডিপোজিট রিকোয়েস্ট'
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
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : req.status === 'REJECTED'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {req.status === 'PENDING' && <Clock className="w-3 h-3" />}
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WITHDRAW */}
          {activeTab === 'withdraw' && (
            <div className="space-y-4">
              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                {withdrawError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                    {withdrawError}
                  </div>
                )}

                <div>
                  <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1">
                    Withdrawal Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max={user.walletBalance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                    {t.minWithdraw} · Available: ₹{user.walletBalance}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1">
                    UPI ID (VPA)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@okaxis or 9876543210@paytm"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
                  ⚡ Withdrawal requests start in PENDING status for admin tracking and are sent to your UPI ID within 5–15 minutes.
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-50 text-zinc-950 font-heading font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting...' : `Request Withdraw ₹${withdrawAmount}`}</span>
                </button>
              </form>

              {withdrawRequests.length > 0 && (
                <div className="pt-3 border-t border-zinc-800 space-y-2">
                  <div className="text-[11px] font-mono font-semibold text-zinc-400 uppercase">
                    Your Payout Requests
                  </div>
                  <div className="space-y-1.5">
                    {withdrawRequests.slice(0, 5).map((req) => (
                      <div
                        key={req.id}
                        className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-zinc-200 font-bold">₹{req.amount}</div>
                          <div className="text-[10px] text-zinc-400 truncate">UPI: {req.upiId}</div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                            req.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : req.status === 'REJECTED'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {req.status === 'PENDING' && <Clock className="w-3 h-3" />}
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRANSACTION HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-zinc-500">
                  {pickLocalized(
                    lang,
                    'No wallet transactions yet.',
                    'अभी कोई ट्रांजैक्शन नहीं है।',
                    'এখনও কোনো লেনদেন হয়নি।'
                  )}
                </div>
              ) : (
                transactions.map((tx) => {
                  const isCredit =
                    tx.type === 'PRIZE_WON' ||
                    tx.type === 'DEPOSIT' ||
                    tx.type === 'DAILY_BONUS' ||
                    tx.type === 'REFERRAL_BONUS';
                  return (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isCredit
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
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
                                  tx.status === 'PENDING' ? 'text-amber-400 font-bold' : 'text-red-400 font-bold'
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
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
