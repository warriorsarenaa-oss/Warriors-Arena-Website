import { getTranslations } from 'next-intl/server';
import { Hero } from '@/components/Landing/Hero';
import { GamesShowcaseWrapper } from '@/components/Landing/GamesShowcaseWrapper';
import { MissionsSection } from '@/components/Landing/MissionsSection';
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

  // Fetch Hero CMS and Hours
  let heroCms = null;
  let operatingHours = "6 PM - 9 PM";
  try {
    const [hoursRes, cmsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/operating-hours/display`).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/cms/hero`).then(r => r.json()),
    ]);
    if (hoursRes?.displayText) operatingHours = hoursRes.displayText;
    if (cmsRes) heroCms = cmsRes[locale] || cmsRes.en || null;
  } catch (err) {
    console.error("Failed to fetch Hero data", err);
  }

  // Fetch Missions CMS
  let missionsHeader = { heading: t("bundlesTitle"), subheading: t("bundlesLine") };
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/cms/missions`);
    if (res.ok) {
      const data = await res.json();
      const content = data[locale] || data.en || {};
      if (content.heading) missionsHeader.heading = content.heading;
      if (content.subheading) missionsHeader.subheading = content.subheading;
    }
  } catch (err) {}

  return (
    <main id="main-content" className="w-full bg-wa-bg relative overflow-x-hidden">
      <Navbar />
      <Hero locale={locale} hours={operatingHours} cms={heroCms} />

      {/* ⭐ GAME SHOWCASE (Animated) ⭐ */}
      <section id="games" className="bg-wa-black py-20 border-y border-wa-green/10">
        <div className="max-w-[1320px] mx-auto">
          <GamesShowcaseWrapper locale={locale} />
        </div>
      </section>

      <div className="max-w-[1320px] mx-auto px-6 space-y-24 md:space-y-40 py-20 md:py-40">

        <section id="missions">
          <SectionHeader
            title={missionsHeader.heading}
            line={missionsHeader.subheading}
          />
          <MissionsSection />
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


