import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { archivo, barlow, cairo, plex } from '@/lib/fonts';
import { BookingProvider } from '@/contexts/BookingContext';
import { BookingModalManager } from '@/components/public/booking/BookingModalManager';
import { PreloadingScreen } from '@/components/UI/PreloadingScreen';
import { ScrollToTop } from '@/components/UI/ScrollToTop';
import '../globals.css';
import type { Metadata } from 'next';

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
};

export const metadata: Metadata = {
  title: 'Warriors Arena | Laser Tag & Gel Blasters · Cairo',
  description: "Cairo's tactical arena. 30-min exclusive slots. Up to 6 players. Book your mission in Heliopolis.",
  openGraph: {
    title: 'Warriors Arena — Book Your Mission',
    description: "Laser Tag & Gel Blasters in Heliopolis, Cairo. Nightly sessions. 6 players max.",
    url: 'https://warriorsarena.gg',
    siteName: 'Warriors Arena',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Warriors Arena tactical arena' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Warriors Arena — Book Your Mission',
    description: "Laser Tag & Gel Blasters in Heliopolis, Cairo.",
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: '/logo.jpg',
  }
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
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning className={`${archivo.variable} ${barlow.variable} ${cairo.variable} ${plex.variable} h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1aff6e" />
        <meta name="apple-mobile-web-app-capable" content="true" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-wa-bg text-wa-text selection:bg-wa-green selection:text-wa-bg">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-wa-green focus:text-wa-bg focus:px-4 focus:py-2 focus:font-mono focus:uppercase focus:text-sm"
        >
          Skip to content
        </a>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ScrollToTop />
          <BookingProvider>
            <PreloadingScreen />
            {children}
            <BookingModalManager />
          </BookingProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
