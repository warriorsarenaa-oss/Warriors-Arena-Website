import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { Archivo_Black, Barlow_Condensed, Cairo, IBM_Plex_Mono } from "next/font/google";
import { BookingProvider } from '@/contexts/BookingContext';
import { BookingModalManager } from '@/components/public/booking/BookingModalManager';
import '../globals.css';

const archivo = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const barlow = Barlow_Condensed({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-barlow",
  display: "swap",
});

const cairo = Cairo({
  weight: ["400", "600", "700", "800", "900"],
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

const plex = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: 'Warriors Arena | Premium Tactical Booking',
  description: 'Experience the ultimate tactical gaming arena in Cairo. Laser Tag & Gel Blasters Playground.'
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
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-wa-bg text-wa-text selection:bg-wa-green selection:text-wa-bg">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <BookingProvider>
            {children}
            <BookingModalManager />
          </BookingProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
