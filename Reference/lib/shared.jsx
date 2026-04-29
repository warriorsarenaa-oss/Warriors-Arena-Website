/* global React */
/* ==========================================================================
   WARRIORS ARENA — shared primitives
   ========================================================================== */

const useState = React.useState;
const useEffect = React.useEffect;
const useRef = React.useRef;
const useMemo = React.useMemo;
const useCallback = React.useCallback;
const createContext = React.createContext;
const useContext = React.useContext;

// ------- i18n -----------------------------------------------------------
const STRINGS = {
  en: {
    bookNow: "Book Now", games: "Games", bundles: "Bundles", howItWorks: "How It Works",
    gallery: "Gallery", faq: "FAQ", location: "Location", contact: "Contact",
    laserTag: "Laser Tag", gelBlasters: "Gel Blasters",
    heroKicker: "HELIOPOLIS · CAIRO", heroLine1: "GEAR UP.", heroLine2: "LOCK IN.", heroLine3: "WIN.",
    heroSub: "Cairo's tactical arena for laser tag & gel blasters. Exclusive 30-minute slots. Six players max. All-out warfare.",
    reserveSlot: "Reserve a slot", viewPricing: "View pricing",
    startingAt: "Starting at", perPlayer: "/ player", duration: "Duration",
    featured: "Featured", allBundles: "All bundles", select: "Select",
    step: "Step", of: "of", chooseGame: "Choose game", configure: "Configure",
    selectDate: "Select date", selectTime: "Select time", yourInfo: "Your info",
    confirm: "Confirm", next: "Next", back: "Back",
    players: "Players", minutes: "minutes",
    totalPrice: "Total", reservationCode: "Reservation code",
    locked: "LOCKED IN", sendWhatsapp: "Confirm on WhatsApp",
    downloadReceipt: "Download receipt", deposit: "50% deposit required to confirm",
    parkFee: "Park entrance fee (paid at gate, not included).",
    minPlayers: "minimum 2 players",
    fullName: "Full name", phone: "Phone", email: "Email (optional)",
  },
  ar: {
    bookNow: "احجز الآن", games: "الألعاب", bundles: "العروض", howItWorks: "كيف يعمل",
    gallery: "الصور", faq: "الأسئلة", location: "الموقع", contact: "تواصل",
    laserTag: "ليزر تاغ", gelBlasters: "جل بلاسترز",
    heroKicker: "مصر الجديدة · القاهرة", heroLine1: "جهّز.", heroLine2: "اقفل.", heroLine3: "اكسب.",
    heroSub: "الساحة التكتيكية الأولى في القاهرة لليزر تاغ وجل بلاسترز. فترات حصرية ٣٠ دقيقة. حتى ٦ لاعبين. حرب شاملة.",
    reserveSlot: "احجز مكانك", viewPricing: "عرض الأسعار",
    startingAt: "يبدأ من", perPlayer: "/ لاعب", duration: "المدة",
    featured: "مميّز", allBundles: "كل العروض", select: "اختر",
    step: "خطوة", of: "من", chooseGame: "اختر لعبة", configure: "اختَر الإعدادات",
    selectDate: "اختر التاريخ", selectTime: "اختر الوقت", yourInfo: "بياناتك",
    confirm: "تأكيد", next: "التالي", back: "رجوع",
    players: "اللاعبين", minutes: "دقيقة",
    totalPrice: "الإجمالي", reservationCode: "كود الحجز",
    locked: "تم الحجز", sendWhatsapp: "تأكيد عبر واتساب",
    downloadReceipt: "تحميل الإيصال", deposit: "مطلوب عربون ٥٠٪ لتأكيد الحجز",
    parkFee: "رسوم دخول الحديقة تُدفع عند البوابة وليست مشمولة.",
    minPlayers: "الحد الأدنى ٢ لاعبين",
    fullName: "الاسم بالكامل", phone: "رقم الهاتف", email: "البريد (اختياري)",
  },
};

const I18nContext = createContext({ lang: 'en', t: (k) => STRINGS.en[k] || k, setLang: () => {} });
const useI18n = () => useContext(I18nContext);

// ------- Icons (tactical / hairline / monoweight) -----------------------
const Icon = {
  crosshair: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    </svg>
  ),
  bolt: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" {...p}>
      <path d="M13 2L4 14h7l-1 8 10-14h-7l0-6z"/>
    </svg>
  ),
  shield: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" {...p}>
      <path d="M12 2l8 3v7c0 5-3.4 9-8 10-4.6-1-8-5-8-10V5l8-3z"/>
    </svg>
  ),
  target: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    </svg>
  ),
  users: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" {...p}>
      <circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M15 20c0-3 2-5 5-5"/>
    </svg>
  ),
  clock: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
    </svg>
  ),
  calendar: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" {...p}>
      <rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 9h18M8 3v4M16 3v4"/>
    </svg>
  ),
  whatsapp: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="currentColor" {...p}>
      <path d="M12 2a10 10 0 00-8.5 15.2L2 22l5-1.3A10 10 0 1012 2zm5.8 14.1c-.3.7-1.5 1.4-2.1 1.5-.5.1-1.2.1-2-.1a12 12 0 01-6.7-6.2c-.3-.6-.7-1.6-.7-2.4 0-.8.4-1.2.6-1.4.2-.2.5-.3.7-.3h.5c.2 0 .5 0 .7.5l1 2.2c.1.2.2.5 0 .7l-.4.5-.2.3c-.1.1-.2.3-.1.5a8 8 0 004 3.7c.2.1.4.1.5 0l.7-.9c.2-.3.4-.2.7-.1l2.2 1c.3.1.5.2.6.4 0 .3 0 1-.4 1.7z"/>
    </svg>
  ),
  download: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" {...p}>
      <path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>
    </svg>
  ),
  plus: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>,
  minus: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/></svg>,
  arrow: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>,
  arrowL: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M19 12H5M11 5l-7 7 7 7"/></svg>,
  x: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  chevron: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>,
  lock: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="1"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>,
  settings: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a7.7 7.7 0 000-6l2-1.2-2-3.4-2.4.9a8 8 0 00-5-2.9L11.5 0h-3l-.5 2.4a8 8 0 00-5 2.9l-2.4-.9-2 3.4L.6 9a7.7 7.7 0 000 6L-1.4 16.2l2 3.4 2.4-.9a8 8 0 005 2.9l.5 2.4h3l.5-2.4a8 8 0 005-2.9l2.4.9 2-3.4L19.4 15z"/></svg>,
  check: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>,
  pin: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 22s-7-7.5-7-13a7 7 0 0114 0c0 5.5-7 13-7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>,
  globe: (p) => <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>,
  menu: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M3 12h18M3 18h18"/></svg>,
  search: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>,
  spark: (p) => <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></svg>,
  trash: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/></svg>,
  edit: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M14 4l6 6-10 10H4v-6z"/></svg>,
  dots: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>,
};

// ------- Placeholder tactical artwork (inline SVG, no hand-drawing people) -----
function GamePlaceholder({ variant = "laser", label }) {
  // variant: laser | gel | bundle
  const palette = variant === "gel"
    ? { a:"#FF7A1A", b:"#7a3a08", bg:"#1a0f08" }
    : variant === "bundle"
      ? { a:"#b2f066", b:"#3a5a1a", bg:"#0d140a" }
      : { a:"#8FE04A", b:"#2a5a1a", bg:"#0a120a" };
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: palette.bg, overflow: "hidden" }}>
      {/* diagonal tactical stripes */}
      <div style={{
        position: "absolute", inset: 0,
        background: `repeating-linear-gradient(135deg, ${palette.b}22 0 12px, transparent 12px 36px)`,
      }}/>
      {/* concentric reticle */}
      <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet"
        style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
        <g stroke={palette.a} strokeWidth="0.8" fill="none" opacity=".35">
          <circle cx="100" cy="100" r="80"/><circle cx="100" cy="100" r="60"/>
          <circle cx="100" cy="100" r="40"/><circle cx="100" cy="100" r="20"/>
          <line x1="10" y1="100" x2="190" y2="100"/><line x1="100" y1="10" x2="100" y2="190"/>
        </g>
        <g stroke={palette.a} strokeWidth="1.4" fill="none">
          <path d="M20 20 L20 50 M20 20 L50 20"/>
          <path d="M180 20 L180 50 M180 20 L150 20"/>
          <path d="M20 180 L20 150 M20 180 L50 180"/>
          <path d="M180 180 L180 150 M180 180 L150 180"/>
        </g>
      </svg>
      {/* faux scanner bar */}
      <div style={{
        position:"absolute", left:0, right:0, height: "10%",
        background: `linear-gradient(180deg, transparent, ${palette.a}40, transparent)`,
        top: "45%",
      }}/>
      {/* label */}
      <div style={{
        position:"absolute", left: 14, bottom: 12,
        fontFamily:"var(--ff-mono)", fontSize:11, color:palette.a,
        letterSpacing:".12em", textTransform:"uppercase"
      }}>
        {label || "ARENA IMAGE · DROP PHOTO HERE"}
      </div>
    </div>
  );
}

// ------- Data ------------------------------------------------------------
const GAMES = [
  { id:"laser-30", type:"laser", name:"Laser Tag · 30", duration:30, price:120, blurb:"Quick sortie. No gear fatigue. Perfect sample run.", variant:"laser" },
  { id:"laser-60", type:"laser", name:"Laser Tag · 60", duration:60, price:200, blurb:"Long ops. Multiple game modes. Full rotation.", variant:"laser" },
  { id:"gel-30",   type:"gel",   name:"Gel Blasters · 30", duration:30, price:150, blurb:"High-impact, biodegradable. Eye protection issued.", variant:"gel" },
];
const BUNDLES = [
  { id:"b1", name:"SQUAD RUN", mode:"per_player", price:150, players:4, duration:60, includes:["2 game rounds","All gear included","Debrief room"], variant:"bundle" },
  { id:"b2", name:"FIRE TEAM", mode:"fixed_total", price:1500, players:6, duration:60, includes:["All modes unlocked","Team photos","Victory lap"], variant:"laser" },
  { id:"b3", name:"BIRTHDAY OPS", mode:"fixed_total", price:2200, players:8, duration:90, includes:["Private host","Cake space","Loot bags x8"], variant:"gel" },
];
const TIME_SLOTS = ["6:00 PM","6:30 PM","7:00 PM","7:30 PM","8:00 PM","8:30 PM","9:00 PM"];

function fmt(n) { return new Intl.NumberFormat('en-US').format(n); }
function genCode() {
  const c = "WA-" + Math.random().toString(36).slice(2,6).toUpperCase() + "-" + Math.random().toString(36).slice(2,5).toUpperCase();
  return c;
}

Object.assign(window, {
  STRINGS, I18nContext, useI18n,
  Icon, GamePlaceholder,
  GAMES, BUNDLES, TIME_SLOTS,
  fmt, genCode,
  useState, useEffect, useRef, useMemo, useCallback,
});
