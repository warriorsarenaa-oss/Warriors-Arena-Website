import "../globals.css";
import { Archivo_Black, Barlow_Condensed, Cairo, IBM_Plex_Mono } from "next/font/google";

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
  title: "Warriors Arena | Admin Console",
  description: "Secure Administrative Interface",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${barlow.variable} ${cairo.variable} ${plex.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-wa-bg text-wa-text font-mono selection:bg-wa-green selection:text-wa-bg">
        {children}
      </body>
    </html>
  );
}
