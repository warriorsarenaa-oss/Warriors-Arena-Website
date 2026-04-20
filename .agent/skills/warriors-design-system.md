# Warriors Arena — Design System Specification

> Use this file in Sprint 3 when implementing the landing page UI. This is the authoritative visual identity derived from the client's social media posts.

## Brand Analysis (From Client Materials)

**Core aesthetic:** Military/tactical meets arcade. High energy, intense, youthful (18-35 demo). Inspiration: Call of Duty UI, esports tournaments, street sports culture.

**Mood board keywords:** Neon, tactical, grunge, adrenaline, competitive, urban, raw.

---

## Color Palette

```css
:root {
  /* Primary Brand Colors */
  --warriors-neon-green: #00FF41;
  --warriors-orange: #FF6B00;
  
  /* Neutrals */
  --warriors-black: #0A0A0A;
  --warriors-concrete: #1E1E1E;
  --warriors-gray: #404040;
  --warriors-off-white: #F5F5F5;
  
  /* Semantic */
  --color-success: var(--warriors-neon-green);
  --color-warning: var(--warriors-orange);
  --color-error: #FF3B3B;
  --color-info: #00D9FF;
  
  /* Backgrounds */
  --bg-primary: var(--warriors-black);
  --bg-secondary: var(--warriors-concrete);
  --bg-card: #1A1A1A;
  
  /* Text */
  --text-primary: var(--warriors-off-white);
  --text-secondary: #A0A0A0;
  --text-accent: var(--warriors-neon-green);
}
```

### Tailwind Extension

```js
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        warriors: {
          green: '#00FF41',
          orange: '#FF6B00',
          black: '#0A0A0A',
          concrete: '#1E1E1E',
          gray: '#404040',
          'off-white': '#F5F5F5',
        },
      },
      fontFamily: {
        display: ['Teko', 'Bebas Neue', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'Noto Sans Arabic', 'sans-serif'],
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(0, 255, 65, 0.5)',
        'neon-orange': '0 0 20px rgba(255, 107, 0, 0.5)',
        'glow-sm': '0 0 10px rgba(0, 255, 65, 0.3)',
      },
      animation: {
        'pulse-green': 'pulse-green 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glitch': 'glitch 0.3s ease-in-out',
      },
      keyframes: {
        'pulse-green': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(0, 255, 65, 0.5)',
            borderColor: '#00FF41',
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(0, 255, 65, 0.8)',
            borderColor: '#00FF60',
          },
        },
        'glitch': {
          '0%, 100%': { transform: 'translate(0)' },
          '33%': { transform: 'translate(-2px, 2px)' },
          '66%': { transform: 'translate(2px, -2px)' },
        },
      },
    },
  },
};
```

---

## Typography

### Hierarchy

```css
/* Display (Hero headlines, CTAs) */
.text-display {
  font-family: 'Teko', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 0.9;
}

/* Heading (Section titles) */
.text-heading {
  font-family: 'Teko', sans-serif;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  line-height: 1.1;
}

/* Body */
.text-body {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  line-height: 1.6;
}

/* Label (Form fields, captions) */
.text-label {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
}
```

### Scale

```
Display: 72px / 96px desktop, 48px mobile
H1: 48px / 64px desktop, 36px mobile
H2: 36px / 48px desktop, 28px mobile
H3: 24px / 32px desktop, 20px mobile
Body: 16px / 18px
Small: 14px
Caption: 12px
```

### Loading Fonts

```tsx
// app/layout.tsx
import { Teko, Inter, Cairo } from 'next/font/google';

const teko = Teko({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-teko',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-cairo',
  display: 'swap',
});

// Apply: className={`${teko.variable} ${inter.variable} ${cairo.variable}`}
```

---

## Component Patterns

### Buttons

**Primary CTA (Green):**
```tsx
<button className="
  bg-warriors-black 
  border-2 border-warriors-green 
  text-warriors-green 
  px-8 py-4 
  font-display text-lg 
  uppercase tracking-wide
  transition-all duration-200
  hover:bg-warriors-green 
  hover:text-warriors-black 
  hover:shadow-neon-green
  active:scale-95
">
  Book Now
</button>
```

**Secondary CTA (Orange accent):**
```tsx
<button className="
  bg-warriors-orange 
  text-warriors-black 
  px-6 py-3 
  font-display text-base 
  uppercase
  hover:bg-opacity-90
  transition-all duration-200
">
  Learn More
</button>
```

**Ghost Button:**
```tsx
<button className="
  border border-warriors-gray 
  text-warriors-off-white 
  px-6 py-3 
  hover:border-warriors-green 
  hover:text-warriors-green
  transition-colors duration-200
">
  View Details
</button>
```

### Cards

**Game Card:**
```tsx
<div className="
  bg-warriors-concrete 
  border-l-4 border-warriors-green
  overflow-hidden
  transition-all duration-300
  hover:shadow-neon-green
  hover:translate-y-[-4px]
">
  <div className="relative">
    <img className="w-full aspect-[4/3] object-cover filter grayscale-[30%]" />
    <div className="absolute inset-0 bg-gradient-to-t from-warriors-black/80 to-transparent" />
  </div>
  <div className="p-6">
    <h3 className="font-display text-2xl text-warriors-green mb-2">LASER TAG</h3>
    <p className="text-warriors-off-white/80 mb-4">High-energy tactical...</p>
    <div className="flex items-center justify-between">
      <span className="bg-warriors-orange text-warriors-black px-3 py-1 font-display text-sm">
        FROM 150 EGP
      </span>
      <button className="text-warriors-green hover:text-warriors-orange transition">
        BOOK →
      </button>
    </div>
  </div>
</div>
```

### Forms

**Input Field:**
```tsx
<div className="space-y-2">
  <label className="
    block 
    text-warriors-off-white 
    font-display text-sm 
    uppercase tracking-wider
  ">
    Full Name
  </label>
  <input className="
    w-full 
    bg-warriors-concrete 
    border-2 border-warriors-gray 
    text-warriors-off-white 
    px-4 py-3
    focus:border-warriors-green 
    focus:outline-none 
    focus:ring-2 
    focus:ring-warriors-green/20
    transition-all duration-200
    placeholder:text-warriors-gray
  " />
</div>
```

**Slot Grid (Booking Wizard Step 4):**
```tsx
<button 
  disabled={!available}
  className={cn(
    "relative p-4 border-2 transition-all duration-200",
    "font-display text-base",
    available && "border-warriors-gray hover:border-warriors-green hover:shadow-glow-sm",
    !available && "border-red-900 bg-red-950/20 cursor-not-allowed opacity-50",
    selected && "border-warriors-green bg-warriors-green/10 shadow-neon-green animate-pulse-green"
  )}
>
  <time className="text-lg">6:00 PM</time>
  {!available && (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-full h-[2px] bg-red-500 rotate-[-30deg]" />
    </div>
  )}
</button>
```

---

## Motion Patterns

### Principles
1. **Fast and snappy** — 200ms max duration for most transitions
2. **Purposeful** — every animation communicates state or draws attention
3. **Arcade feel** — sharp snap-ins, glitch effects, not smooth fades
4. **Performance first** — transform/opacity only, no layout thrashing

### Framer Motion Presets

```tsx
// Stagger children (game cards grid)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

// Glitch effect (on CTA hover)
const glitchVariants = {
  hover: {
    x: [0, -2, 2, -2, 0],
    y: [0, 2, -2, 2, 0],
    transition: { duration: 0.3 },
  },
};

// Pulse (selected slot)
const pulseVariants = {
  selected: {
    scale: [1, 1.05, 1],
    boxShadow: [
      "0 0 20px rgba(0, 255, 65, 0.5)",
      "0 0 40px rgba(0, 255, 65, 0.8)",
      "0 0 20px rgba(0, 255, 65, 0.5)",
    ],
    transition: { 
      duration: 2, 
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};
```

### Page Transitions

```tsx
// Wrap pages in layout
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.2 }}
>
  {children}
</motion.div>
```

---

## Layout Rules

### Grid System
- Mobile: Single column, 16px gutters
- Tablet: 2 columns for cards, 24px gutters
- Desktop: 3-4 columns for cards, 32px gutters, max-width 1400px container

### Spacing Scale (Tailwind)
```
xs: 4px   (gaps between inline elements)
sm: 8px   (form field internal padding)
md: 16px  (card padding, section gaps)
lg: 24px  (component margins)
xl: 32px  (section padding)
2xl: 48px (major section breaks)
3xl: 64px (hero padding)
```

### Responsive Breakpoints
```
sm: 640px   (large phones)
md: 768px   (tablets)
lg: 1024px  (small laptops)
xl: 1280px  (desktops)
2xl: 1536px (large desktops)
```

---

## Accessibility (WCAG AA Compliance)

### Contrast Ratios (Already Passing)
- Neon green (#00FF41) on black (#0A0A0A): 15.3:1 ✅
- Orange (#FF6B00) on black: 5.8:1 ✅
- Off-white (#F5F5F5) on black: 18.2:1 ✅

### Focus States
```css
*:focus-visible {
  outline: 2px solid var(--warriors-green);
  outline-offset: 2px;
}
```

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Reference Images Interpretation

**Image 1 (Join The Fun):**
- Diagonal green stripes pattern (repeating "LASER TAG" text at 30deg)
- High contrast: neon green on black
- Stencil-style typography
- Call-to-action: WhatsApp number prominently displayed

**Image 2 (Don't Lose Before You Fight):**
- Red "Fighting" wordmark (grunge texture, paint splatter effect)
- Outdoor daytime photography (natural, not studio)
- Player in white tee holding tan blaster (realistic, not staged)
- Casual/accessible vibe

**Image 3 (Easy Day Is Yesterday):**
- Green gradient background (light to dark, top to bottom)
- Bold white display type, stacked
- Player aiming with full protective gear
- Motivational/competitive messaging

**Image 4 (More Guns More Fun):**
- Clean sans-serif heading (not stencil)
- Serif subheading ("MORE FUN")
- Blue-toned color grade on photo
- Professional product photography style

**Image 5 (New Mode Inbound):**
- Orange accent color (secondary brand color confirmed)
- Outdoor setting with sandbag props
- Player in casual plaid shirt (approachable, not intimidating)
- Teaser/announcement format

### Design Takeaways
1. **Primary vibe:** Image 1 (neon green arcade) > Image 3 (gradient urgency)
2. **Typography:** Teko/stencil for display, Inter for body
3. **Photography:** Outdoor action shots, natural light, real people (not models)
4. **Texture:** Grunge/paint splatter accents, not overused
5. **Orange usage:** Secondary accent for badges, announcements, "new" labels

---

## Implementation Checklist for Sprint 3

- [ ] Install fonts: Teko, Inter, Cairo via next/font
- [ ] Create Tailwind config with warriors color palette
- [ ] Create global CSS with animation keyframes
- [ ] Build reusable Button component with 3 variants
- [ ] Build GameCard component matching Image 1 style
- [ ] Implement diagonal stripe background pattern (CSS or SVG)
- [ ] Add neon glow shadows on hover states
- [ ] Test all colors against WCAG AA contrast checker
- [ ] Implement focus-visible states for keyboard nav
- [ ] Add prefers-reduced-motion CSS override
- [ ] Test RTL layout with Arabic font (Cairo)

---

*End of Design System Specification*
