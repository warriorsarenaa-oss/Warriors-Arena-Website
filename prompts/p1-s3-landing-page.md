# Sprint 3 — Landing Page (Public UI)

> Prerequisites: Sprint 2 complete. Public API working.

## Prompt To Give Antigravity

```
Sprint 3: Public landing page.

Build the landing page at /en and /ar. Mobile-first, bilingual, performance-minded.

SCOPE:

1. src/app/[locale]/layout.tsx — locale-aware layout with:
   - next-intl provider
   - HTML dir="rtl" when locale=ar, "ltr" otherwise
   - suppressHydrationWarning on body
   - Language toggle visible in top-right (floating)
   - Meta Pixel base code (PageView fires on every page)

2. src/app/[locale]/page.tsx — landing page orchestrator. Server component fetching data once.

3. Section components (all in src/components/public/):
   - HeroSection.tsx — placeholder for animated hero. Renders a static fallback (gradient + tagline + CTA) with a TODO marker for the real animation. Animation components will be added later per user reference images.
   - GamesGrid.tsx — maps over games from API. Each GameCard shows image, name, starting price, duration options, "Book" CTA that deep-links to /book?game={slug}.
   - BundlesCarousel.tsx — horizontal scroll on mobile, grid on desktop. Handles empty state with friendly message.
   - HowItWorks.tsx — 4 steps with icons (Lucide).
   - PhotoGallery.tsx — lazy-loaded <Image> components. 6-8 placeholders until real photos provided.
   - ParkEntryNotice.tsx — prominent info card.
   - FAQSection.tsx — accordion using headless Radix primitives. Content from content/{locale}/faq.md (load at build time).
   - LocationContact.tsx — static map embed (loaded on visible, not on page load), WhatsApp CTA, operating hours displayed 12-hour.
   - Footer.tsx — three-column on desktop, stacked on mobile.

4. src/messages/en.json and src/messages/ar.json — populate with all strings from content/{locale}/landing.md.

5. Tailwind config:
   - Set font family (Inter for EN, Cairo or Noto Sans Arabic for AR — load via next/font)
   - Verify logical CSS properties (ms-, me-, ps-, pe-) work out of the box in Tailwind v4

6. Lighthouse performance:
   - Hero image or fallback <100KB, served in AVIF/WebP
   - No render-blocking scripts
   - Lazy-load everything below the fold (except maybe the games grid)
   - Images use Next.js <Image> with explicit width/height to prevent CLS

WORKING MODE:
- Take screenshots after each section and compare to a mental "clean, modern, mobile-first" reference. I'll provide brand palette later.
- Prose and copy come from content/{locale}/landing.md — do not rewrite.
- Animations are placeholders; leave clear TODO comments for per-component prompts later.

EXIT CRITERIA:
- Lighthouse mobile score >= 90 (Performance, Accessibility, Best Practices, SEO)
- LCP < 2.5s on simulated 4G
- CLS < 0.1
- Both /en and /ar render correctly. /ar is RTL; layout doesn't break.
- Language toggle switches between them preserving scroll position.
- All sections readable on 375px viewport.
- Clicking Book on a game card takes you to /book?game=laser_tag (or /ar/book?game=laser_tag for Arabic).

Begin with the plan.
```

---

*End of Sprint 3 Prompt*
