#!/bin/bash

# ============================================
# WARRIORS ARENA 404 DIAGNOSTIC & FIX AGENT
# ============================================

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║         WARRIORS ARENA ROUTING DIAGNOSTICS & AUTO-FIX             ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

PROJECT_ROOT="$(pwd)"
ISSUES_FOUND=0
ISSUES_FIXED=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_check() {
  echo -e "${BLUE}▸${NC} $1"
}

log_pass() {
  echo -e "${GREEN}✅${NC} $1"
}

log_fail() {
  echo -e "${RED}❌${NC} $1"
  ((ISSUES_FOUND++))
}

log_fix() {
  echo -e "${YELLOW}⚙️${NC} $1"
  ((ISSUES_FIXED++))
}

# ============================================
# CHECK 1: [locale] folder structure
# ============================================
echo ""
log_check "Checking [locale] folder structure..."

if [ ! -d "src/app/[locale]" ]; then
  log_fail "src/app/[locale]/ does NOT exist"
  log_fix "Creating src/app/[locale]/ structure..."
  mkdir -p "src/app/[locale]/(public)"
  mkdir -p "src/app/[locale]/(admin)"
else
  log_pass "src/app/[locale]/ exists"
  
  if [ ! -d "src/app/[locale]/(public)" ]; then
    log_fail "src/app/[locale]/(public)/ missing"
    log_fix "Creating (public) folder..."
    mkdir -p "src/app/[locale]/(public)"
  else
    log_pass "src/app/[locale]/(public)/ exists"
  fi
fi

# ============================================
# CHECK 2: Middleware or Proxy
# ============================================
echo ""
log_check "Checking middleware/proxy configuration..."

if [ -f "src/middleware.ts" ] && [ -f "src/proxy.ts" ]; then
  log_fail "BOTH middleware.ts AND proxy.ts exist (conflict)"
  log_fix "Removing src/middleware.ts (using proxy.ts as Next.js 16 standard)..."
  rm -f src/middleware.ts
elif [ ! -f "src/middleware.ts" ] && [ ! -f "src/proxy.ts" ]; then
  log_fail "NEITHER middleware.ts NOR proxy.ts found"
  log_fix "Creating src/middleware.ts..."
  cat > src/middleware.ts << 'MIDDLEWARE_EOF'
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'ar'],
  defaultLocale: 'en'
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
MIDDLEWARE_EOF
  log_pass "Created src/middleware.ts"
elif [ -f "src/proxy.ts" ]; then
  log_pass "src/proxy.ts exists (Next.js 16 pattern)"
else
  log_pass "src/middleware.ts exists"
fi

# ============================================
# CHECK 3: Layout file
# ============================================
echo ""
log_check "Checking [locale]/layout.tsx..."

if [ ! -f "src/app/[locale]/layout.tsx" ]; then
  log_fail "src/app/[locale]/layout.tsx missing"
  log_fix "Creating src/app/[locale]/layout.tsx..."
  cat > "src/app/[locale]/layout.tsx" << 'LAYOUT_EOF'
import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import '../globals.css';

export const metadata = {
  title: 'Warriors Arena - Laser Tag & Gel Blasters',
  description: 'Book your tactical gaming experience in Heliopolis, Cairo.',
  metadataBase: new URL('https://warriorsarena.example')
};

interface RootLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

const locales = ['en', 'ar'];

export default async function RootLayout({
  children,
  params
}: RootLayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head />
      <body className="bg-wa-bg text-wa-text antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
LAYOUT_EOF
  log_pass "Created src/app/[locale]/layout.tsx"
else
  log_pass "src/app/[locale]/layout.tsx exists"
fi

# ============================================
# CHECK 4: Public page
# ============================================
echo ""
log_check "Checking (public)/page.tsx..."

if [ ! -f "src/app/[locale]/(public)/page.tsx" ]; then
  log_fail "src/app/[locale]/(public)/page.tsx missing"
  log_fix "Creating src/app/[locale]/(public)/page.tsx..."
  cat > "src/app/[locale]/(public)/page.tsx" << 'PAGE_EOF'
import { useTranslations } from 'next-intl';
import { Hero } from '@/components/Landing/Hero';
import { GamesGrid } from '@/components/Landing/GamesGrid';
import { BundleCarousel } from '@/components/Landing/BundleCarousel';
import { HowItWorks } from '@/components/Landing/HowItWorks';
import { Gallery } from '@/components/Landing/Gallery';
import { FAQ } from '@/components/Landing/FAQ';
import { Footer } from '@/components/Landing/Footer';
import { Navbar } from '@/components/Landing/Navbar';

export const metadata = {
  title: 'Warriors Arena - Book Your Mission',
  description: 'Laser tag and gel blaster games in Heliopolis, Cairo. Book your experience now.'
};

export default function HomePage({ params }: { params: { locale: string } }) {
  return (
    <main className="w-full bg-wa-bg text-wa-text">
      <Navbar />
      <Hero locale={params.locale} />
      <div className="container mx-auto px-4 space-y-48 py-32 md:py-48">
        <GamesGrid />
        <BundleCarousel />
        <HowItWorks />
        <Gallery />
        <FAQ />
      </div>
      <Footer />
    </main>
  );
}
PAGE_EOF
  log_pass "Created src/app/[locale]/(public)/page.tsx"
else
  log_pass "src/app/[locale]/(public)/page.tsx exists"
fi

# ============================================
# CHECK 5: Globals CSS location
# ============================================
echo ""
log_check "Checking globals.css location..."

if [ -f "src/app/[locale]/globals.css" ] && [ ! -f "src/app/globals.css" ]; then
  log_fail "globals.css is in src/app/[locale]/ but should be in src/app/"
  log_fix "Moving globals.css to src/app/..."
  mv "src/app/[locale]/globals.css" src/app/globals.css
  log_pass "Moved globals.css"
elif [ -f "src/app/globals.css" ]; then
  log_pass "src/app/globals.css is in correct location"
else
  log_fail "globals.css not found anywhere"
  log_fix "Creating minimal globals.css..."
  cat > "src/app/globals.css" << 'CSS_EOF'
@import "tailwindcss";

:root {
  --wa-bg: #0a0d0a;
  --wa-panel: #161b18;
  --wa-green: #8FE04A;
  --wa-green-2: #b2f066;
  --wa-orange: #FF7A1A;
  --wa-red: #ff3d3d;
  --wa-amber: #ffc043;
  --wa-text: #eef1ea;
}

body {
  background-color: var(--wa-bg);
  color: var(--wa-text);
}
CSS_EOF
  log_pass "Created minimal globals.css"
fi

# ============================================
# CHECK 6: next-intl configuration
# ============================================
echo ""
log_check "Checking next-intl config..."

if [ ! -f "src/i18n/request.ts" ]; then
  log_fail "src/i18n/request.ts missing"
  log_fix "Creating src/i18n/request.ts..."
  mkdir -p src/i18n
  cat > src/i18n/request.ts << 'I18N_EOF'
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  return {
    messages: (await import(`../../messages/${locale}.json`)).default,
    locale
  };
});
I18N_EOF
  log_pass "Created src/i18n/request.ts"
else
  log_pass "src/i18n/request.ts exists"
fi

# ============================================
# CHECK 7: next.config.ts
# ============================================
echo ""
log_check "Checking next.config.ts..."

# (Simplified check, assuming it exists or needs fixing)
log_pass "Skipping next.config.ts overwrite to protect Turbopack settings"

# ============================================
# CLEANUP & RESTART
# ============================================
echo ""
log_check "Cleaning up build artifacts..."
rm -rf .next
log_pass "Cleared .next directory"

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                        DIAGNOSTIC SUMMARY                         ║"
echo "╠════════════════════════════════════════════════════════════════════╣"
echo -e "║ Issues Found:     $ISSUES_FOUND                                             ║"
echo -e "║ Issues Fixed:     $ISSUES_FIXED                                             ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
