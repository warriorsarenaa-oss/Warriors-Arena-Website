import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import Script from 'next/script';
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
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1779543759678283'); 
            fbq('track', 'PageView');
          `}
        </Script>
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-wa-bg text-wa-text selection:bg-wa-green selection:text-wa-bg">
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }} src="https://www.facebook.com/tr?id=1779543759678283&ev=PageView&noscript=1" />
        </noscript>
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
