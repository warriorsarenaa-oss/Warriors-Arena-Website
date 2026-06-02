import "../globals.css";
import { archivo, barlow, cairo, plex } from '@/lib/fonts';

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
};

export const metadata = {
  title: "Warriors Arena | Admin Console",
  description: "Secure Administrative Interface",
  icons: {
    icon: '/logo.jpg',
  }
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${archivo.variable} ${barlow.variable} ${cairo.variable} ${plex.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-wa-bg text-wa-text font-mono selection:bg-wa-green selection:text-wa-bg">
        {children}
      </body>
    </html>
  );
}
