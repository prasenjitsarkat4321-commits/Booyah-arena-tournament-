import React from 'react';
import {
  ShieldAlert,
  Ban,
  Smartphone,
  Clock,
  Crosshair,
  Users,
  Camera,
  Wallet,
  Trophy,
  Ticket,
  CheckCircle,
} from 'lucide-react';
import { Language, pickLocalized, translations } from '../utils/translations';

interface RulesPageViewProps {
  lang: Language;
  onExploreTournaments: () => void;
  onOpenMyMatches: () => void;
}

export const RulesPageView: React.FC<RulesPageViewProps> = ({
  lang,
  onExploreTournaments,
  onOpenMyMatches,
}) => {
  const t = translations[lang];

  const ruleSections = [
    {
      id: 'anti-cheat',
      icon: Ban,
      accent: 'text-red-400',
      iconBg: 'bg-red-500/15 border-red-500/30',
      title: pickLocalized(
        lang,
        'Zero Tolerance for Hacks & Third-Party Tools',
        'हैक, स्क्रिप्ट और थर्ड-पार्टी टूल्स सख्त वर्जित',
        'হ্যাক, স্ক্রিপ্ট ও থার্ড-পার্টি টুলস সম্পূর্ণ নিষিদ্ধ'
      ),
      badge: pickLocalized(lang, 'PERMANENT BAN', 'स्थायी बैन', 'স্থায়ী ব্যান'),
      description: t.rule1,
      points: [
        pickLocalized(
          lang,
          'No mod menus, auto-headshot scripts, ESP/wallhacks, antenna files, or GFX config injectors.',
          'किसी भी प्रकार का मोड मेन्यू, ऑटो-हेडशॉट स्क्रिप्ट, एंटीना फाइल या कॉन्फ़िग हैक उपयोग न करें।',
          'কোনো মোড মেনু, অটো-হেডশট স্ক্রিপ্ট, অ্যান্টেনা ফাইল বা কনফিগ ইনজেক্টর ব্যবহার করা যাবে না।'
        ),
        pickLocalized(
          lang,
          'Violators lose all wallet winnings immediately and their Free Fire UID is permanently blacklisted.',
          'पकड़े जाने पर वॉलेट बैलेंस जब्त कर लिया जाएगा और आपकी Free Fire UID हमेशा के लिए ब्लॉक हो जाएगी।',
          'ধরা পড়লে সম্পূর্ণ পুরস্কার বাতিল হবে এবং আপনার Free Fire UID স্থায়ীভাবে ব্লক করা হবে।'
        ),
      ],
    },
    {
      id: 'mobile-only',
      icon: Smartphone,
      accent: 'text-amber-400',
      iconBg: 'bg-amber-500/15 border-amber-500/30',
      title: pickLocalized(
        lang,
        'Mobile Only — Strictly No PC Emulators or iPads',
        'केवल मोबाइल प्लेयर्स — PC एमुलेटर और iPad सख्त मना हैं',
        'শুধুমাত্র মোবাইল — পিসি এমুলেটর বা আইপ্যাড নিষিদ্ধ'
      ),
      badge: pickLocalized(lang, 'MOBILE ONLY', 'केवल मोबाइल', 'শুধুমাত্র মোবাইল'),
      description: pickLocalized(
        lang,
        'All standard tournaments are strictly restricted to Android and iOS smartphones to ensure fair aim and movement.',
        'निष्पक्ष मुकाबले के लिए सभी मानक टूर्नामेंट केवल Android और iOS मोबाइल फोन खिलाड़ियों के लिए हैं।',
        'ন্যায্য খেলার পরিবেশ বজায় রাখতে সমস্ত স্ট্যান্ডার্ড টুর্নামেন্ট শুধুমাত্র মোবাইল ফোন প্লেয়ারদের জন্য।'
      ),
      points: [
        pickLocalized(
          lang,
          'BlueStacks, MSI App Player, keyboard/mouse adapters, and external triggers are disallowed in Mobile-Only rooms.',
          'BlueStacks, एमुलेटर, कीबोर्ड-माउस या एक्सटर्नल ट्रिगर्स से खेलने पर बिना रिफंड के किक किया जाएगा।',
          'BlueStacks, এমুলেটর বা কিবোর্ড-মাউস অ্যাডাপ্টার ব্যবহার করলে কোনো রিফান্ড ছাড়াই কিক করা হবে।'
        ),
        pickLocalized(
          lang,
          'Your Free Fire account level must match competitive fair-play eligibility requirements.',
          'खिलाड़ी की इन-गेम ID और UID वही होनी चाहिए जो स्लॉट बुकिंग के समय दर्ज की गई है।',
          'স্লট বুকিংয়ের সময় দেওয়া Free Fire IGN এবং UID অনুযায়ীই কাস্টম রুমে খেলতে হবে।'
        ),
      ],
    },
    {
      id: 'timely-entry',
      icon: Clock,
      accent: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15 border-emerald-500/30',
      title: pickLocalized(
        lang,
        'Timely Room Entry & 15-Minute Credential Unlock',
        'समय पर रूम एंट्री और 15 मिनट पहले रूम ID अनलॉक',
        'সময়মতো রুম এন্ট্রি ও ১৫ মিনিট আগে রুম ID আনলক'
      ),
      badge: pickLocalized(lang, '15 MIN RULE', '15 मिनट नियम', '১৫ মিনিট নিয়ম'),
      description: t.rule4,
      points: [
        pickLocalized(
          lang,
          'Custom Room ID and Password unlock automatically inside "My Matches" 15 minutes before the scheduled start time.',
          'मैच शुरू होने से ठीक 15 मिनट पहले "My Matches" सेक्शन में रूम ID और पासवर्ड अपने आप अनलॉक हो जाते हैं।',
          'ম্যাচ শুরুর ঠিক ১৫ মিনিট আগে "My Matches" সেকশনে রুম আইডি ও পাসওয়ার্ড স্বয়ংক্রিয়ভাবে আনলক হবে।'
        ),
        pickLocalized(
          lang,
          'Join the Free Fire custom room at least 5 minutes prior and sit strictly in your allotted slot number. Wrong-slot sitters may be kicked without refund.',
          'मैच से कम से कम 5 मिनट पहले रूम में प्रवेश करें और केवल अपनी अलॉटेड स्लॉट नंबर पर ही बैठें। गलत स्लॉट पर बैठने से किक किया जा सकता है।',
          'ম্যাচ শুরুর অন্তত ৫ মিনিট আগে রুমে প্রবেশ করুন এবং শুধুমাত্র আপনার নির্ধারিত স্লট নম্বরেই বসুন। ভুল স্লটে বসলে কিক করা হতে পারে।'
        ),
      ],
    },
    {
      id: 'fair-play',
      icon: Crosshair,
      accent: 'text-cyan-400',
      iconBg: 'bg-cyan-500/15 border-cyan-500/30',
      title: pickLocalized(
        lang,
        'Gun Attributes & Competitive Integrity',
        'गन एट्रिब्यूट्स और निष्पक्ष खेल नियम',
        'গান অ্যাট্রিবিউট ও ফেয়ার প্লে নীতি'
      ),
      badge: pickLocalized(lang, 'ESPORTS STANDARD', 'ई-स्पोर्ट्स मानक', 'ই-স্পোর্টস স্ট্যান্ডার্ড'),
      description: t.rule2,
      points: [
        pickLocalized(
          lang,
          'Unless marked "Attributes ON", all custom lobbies disable gun skin stat boosts so skill alone decides every duel.',
          'जब तक मैच में "Attributes ON" न लिखा हो, सभी कस्टम रूम में गन स्किन की एक्स्ट्रा पॉवर बंद रहती है।',
          '"Attributes ON" উল্লেখ না থাকলে সব কাস্টম লবিতে গান স্কিনের অতিরিক্ত পাওয়ার বন্ধ থাকবে।'
        ),
        pickLocalized(
          lang,
          'Do not exploit map glitches, roof bugs, or prohibited areas during Clash Squad or Battle Royale scrims.',
          'मैप ग्लिच, बग या अनधिकृत जगहों पर कैंपिंग करना सख्त मना है।',
          'ম্যাপের কোনো গ্লিচ বা বাগ ব্যবহার করে সুবিধা নেওয়া সম্পূর্ণ নিষিদ্ধ।'
        ),
      ],
    },
    {
      id: 'anti-teaming',
      icon: Users,
      accent: 'text-orange-400',
      iconBg: 'bg-orange-500/15 border-orange-500/30',
      title: pickLocalized(
        lang,
        'Strict Anti-Teaming & Stream Sniping Ban',
        'टीमिंग (Teaming) और स्ट्रीम स्नाइपिंग पर सख्त प्रतिबंध',
        'টিমিং ও স্ট্রিম স্নাইপিং সম্পূর্ণ নিষিদ্ধ'
      ),
      badge: pickLocalized(lang, 'ZERO REFUND', 'कोई रिफंड नहीं', 'কোনো রিফান্ড নেই'),
      description: t.rule5,
      points: [
        pickLocalized(
          lang,
          'Collaborating with rival players/squads in Solo, Duo, or Squad matches leads to immediate disqualification of all involved teams.',
          'सोलो, डुओ या स्क्वाड मैच में किसी विरोधी टीम के साथ मिलकर खेलने (Teaming) पर दोनों टीमों को तुरंत डिसक्वालिफाई किया जाएगा।',
          'সোলো, ডুও বা স্কোয়াড ম্যাচে প্রতিপক্ষের সাথে টিমিং করলে জড়িত সকল দলকে তাৎক্ষণিক ডিসকোয়ালিফাই করা হবে।'
        ),
        pickLocalized(
          lang,
          'Room spectators monitor live kill feeds and movement throughout every match.',
          'पूरे मैच के दौरान ऑर्गनाइजर और स्पेक्टेटर टीम द्वारा लाइव निगरानी रखी जाती है।',
          'পুরো ম্যাচ জুড়ে অর্গানাইজার এবং স্পেকটেটর টিম লাইভ পর্যবেক্ষণ করে থাকে।'
        ),
      ],
    },
    {
      id: 'proof-payout',
      icon: Camera,
      accent: 'text-violet-400',
      iconBg: 'bg-violet-500/15 border-violet-500/30',
      title: pickLocalized(
        lang,
        'Result Screenshots, Kills & UPI Payout Policy',
        'रिजल्ट स्क्रीनशॉट, किल्स और UPI पेआउट नियम',
        'ফলাফলের স্ক্রিনশট, কিল ও UPI পেমেন্ট নীতি'
      ),
      badge: pickLocalized(lang, 'VERIFIED PAYOUT', 'वेरिफाइड पेआउट', 'ভেরিফায়েড পেআউট'),
      description: t.rule3,
      points: [
        pickLocalized(
          lang,
          'Upload a clear Booyah / match summary screenshot in "My Matches" within 30 minutes of match completion.',
          'मैच खत्म होने के 30 मिनट के भीतर "My Matches" में अपना बूयाह/स्कोरकार्ड स्क्रीनशॉट अपलोड करें।',
          'ম্যাচ শেষ হওয়ার ৩০ মিনিটের মধ্যে "My Matches" সেকশনে পরিষ্কার বুঁয়া বা স্কোরকার্ড স্ক্রিনশট আপলোড করুন।'
        ),
        pickLocalized(
          lang,
          'Minimum withdrawal is ₹50 via UPI ID. Admin verifies payout requests and settles winnings directly to your UPI account.',
          'न्यूनतम UPI निकासी ₹50 है। एडमिन वेरिफिकेशन के बाद आपकी जीती हुई राशि सीधे UPI खाते में भेजी जाती है।',
          'সর্বনিম্ন UPI উত্তোলন ₹৫০। অ্যাডমিন যাচাইয়ের পর আপনার জেতা টাকা সরাসরি UPI অ্যাকাউন্টে পাঠানো হয়।'
        ),
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Hero */}
      <div className="p-5 sm:p-7 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-amber-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>
              {pickLocalized(
                lang,
                'OFFICIAL FAIR PLAY CHARTER',
                'आधिकारिक फेयर प्ले चार्टर',
                'অফিশিয়াল ফেয়ার প্লে নীতিমালা'
              )}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
            {pickLocalized(
              lang,
              'Rules & Regulations',
              'टूर्नामेंट नियम और शर्तें',
              'টুর্নামেন্টের নিয়ম ও শর্তাবলী'
            )}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            {pickLocalized(
              lang,
              'Every player competing in BooyahArena agrees to follow these fair play, anti-cheat, and custom room guidelines. Violation of any rule results in disqualification without refund.',
              'BooyahArena में खेलने वाला प्रत्येक खिलाड़ी इन फेयर प्ले, एंटी-चीट और कस्टम रूम नियमों का पालन करने के लिए सहमत होता है। नियम तोड़ने पर बिना रिफंड डिसक्वालिफाई किया जाएगा।',
              'BooyahArena-তে অংশগ্রহণকারী প্রতিটি খেলোয়াড়কে এই ফেয়ার প্লে, অ্যান্টি-চিট এবং কাস্টম রুমের নিয়মাবলী মেনে চলতে হবে। নিয়ম ভঙ্গ করলে কোনো রিফান্ড ছাড়াই ডিসকোয়ালিফাই করা হবে।'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenMyMatches}
            className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-heading font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Ticket className="w-4 h-4 text-amber-400" />
            <span>{t.navMyMatches}</span>
          </button>
          <button
            type="button"
            onClick={onExploreTournaments}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-heading font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all whitespace-nowrap"
          >
            <Trophy className="w-4 h-4" />
            <span>{t.navTournaments}</span>
          </button>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {ruleSections.map((rule, index) => {
          const IconComponent = rule.icon;
          return (
            <div
              key={rule.id}
              className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-3.5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${rule.iconBg}`}
                    >
                      <IconComponent className={`w-5 h-5 ${rule.accent}`} />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-zinc-500 font-bold uppercase">
                        0{index + 1}. {rule.badge}
                      </div>
                      <h2 className="font-heading font-bold text-base sm:text-lg text-white leading-snug">
                        {rule.title}
                      </h2>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">{rule.description}</p>

                <ul className="space-y-2 pt-1 border-t border-zinc-800/80">
                  {rule.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[11px] text-zinc-400 leading-relaxed">
                      <CheckCircle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${rule.accent}`} />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Wallet className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-300 leading-relaxed">
            <strong className="text-white block font-heading text-sm mb-0.5">
              {pickLocalized(
                lang,
                'Need Help or Match Dispute Support?',
                'सहायता या मैच विवाद रिपोर्ट करना है?',
                'সহায়তা বা ম্যাচ সংক্রান্ত অভিযোগ জানাতে চান?'
              )}
            </strong>
            {pickLocalized(
              lang,
              'Always keep screen recording ON during high-prize scrims if you suspect a hacker. Submit your match screenshot immediately in My Matches.',
              'बड़े टूर्नामेंट में स्क्रीन रिकॉर्डिंग चालू रखें ताकि किसी हैकर की रिपोर्ट करते समय सबूत पेश किया जा सके।',
              'বড় টুর্নামেন্টে স্ক্রিন রেকর্ডিং চালু রাখুন যাতে কোনো হ্যাকারের বিরুদ্ধে প্রমাণসহ রিপোর্ট করা যায়।'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
