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
          <SectionHeader
            kicker="01 · LINEUP"
            title={t("gamesTitle")}
            line={t("gamesLine")}
          />
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
          <SectionHeader
            kicker="03 · PROTOCOL"
            title={t("howItWorksTitle")}
            line={t("howItWorksLine")}
          />
          <HowItWorks />
        </section>

        {/* ── GALLERY ───────────────────────────────── */}
        <section id="field">
          <SectionHeader
            kicker="04 · FROM THE ARENA"
            title={t("galleryTitle")}
            line={t("galleryLine")}
          />
          <Gallery />
        </section>

        {/* ── FAQ ───────────────────────────────────── */}
        <section id="faq">
          <SectionHeader
            kicker="05 · INTEL"
            title={t("faqTitle")}
            line={t("faqLine")}
          />
          <FAQ />
        </section>

        {/* ── PARK NOTICE ───────────────────────────── */}
        <ParkNotice />

        {/* ── LOCATION ──────────────────────────────── */}
        <section id="location">
          <SectionHeader
            kicker="06 · RALLY POINT"
            title={t("locationTitle")}
            line={t("locationLine")}
          />
          <LocationSection />
        </section>

      </div>

      <Footer />
    </main>
  );
}

function SectionHeader({
  kicker,
  title,
  line,
}: {
  kicker: string;
  title: string;
  line: string;
}) {
  return (
    <div className="flex items-end justify-between gap-10 flex-wrap mb-12">
      <div>
        <div className="font-mono text-wa-green text-[12px] tracking-[0.2em] mb-3 uppercase">
          {kicker}
        </div>
        <h2
          className="font-archivo uppercase m-0 leading-none"
          style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
        >
          {title}
        </h2>
      </div>
      {line && (
        <p className="max-w-[440px] text-wa-text-dim text-base mb-1.5">{line}</p>
      )}
    </div>
  );
}
