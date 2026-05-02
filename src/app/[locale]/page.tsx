import { getTranslations } from 'next-intl/server';
import { Hero } from '@/components/Landing/Hero';
import { GamesShowcaseWrapper } from '@/components/Landing/GamesShowcaseWrapper';
import { BundleCarousel } from '@/components/Landing/BundleCarousel';
import { HowItWorks } from '@/components/Landing/HowItWorks';
import { Gallery } from '@/components/Landing/Gallery';
import { FAQ } from '@/components/Landing/FAQ';
import { LocationSection } from '@/components/Landing/LocationSection';
import { ParkNotice } from '@/components/Landing/ParkNotice';
import { Footer } from '@/components/Landing/Footer';
import { Navbar } from '@/components/Landing/Navbar';
import { SectionHeader } from '@/components/UI/SectionHeader';

export const metadata = {
  title: 'Warriors Arena — Laser Tag & Gel Blasters · Heliopolis, Cairo',
  description: "Cairo's tactical arena for laser tag & gel blasters. Exclusive 30-minute slots. Six players max. Book your mission.",
};

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Landing' });

  return (
    <main className="w-full bg-wa-bg relative overflow-x-hidden">
      <Navbar />
      <Hero locale={locale} />

      <div className="max-w-[1320px] mx-auto px-6 space-y-24 md:space-y-40 py-20 md:py-40">

        {/* ── GAMES ─────────────────────────────────── */}
        <section id="games">
          <GamesShowcaseWrapper locale={locale} />
        </section>

        {/* ── BUNDLES ───────────────────────────────── */}
        <section id="bundles">
          <SectionHeader
            kicker="02 · FIRE TEAMS"
            title={t("bundlesTitle")}
            line={t("bundlesLine")}
          />
          <BundleCarousel />
        </section>

        {/* ── HOW IT WORKS ──────────────────────────── */}
        <section id="how">
          <HowItWorks locale={locale} />
        </section>

        {/* ── GALLERY ───────────────────────────────── */}
        <section id="field">
          <Gallery locale={locale} />
        </section>

        {/* ── FAQ ───────────────────────────────────── */}
        <section id="faq">
          <FAQ locale={locale} />
        </section>

        {/* ── PARK NOTICE ───────────────────────────── */}
        <ParkNotice />

        {/* ── LOCATION ──────────────────────────────── */}
        <section id="location">
          <LocationSection locale={locale} />
        </section>

      </div>

      <Footer />
    </main>
  );
}


