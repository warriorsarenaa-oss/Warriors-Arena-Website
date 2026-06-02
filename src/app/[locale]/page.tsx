import { getTranslations } from 'next-intl/server';
import { Hero } from '@/components/Landing/Hero';
import { GamesShowcaseWrapper } from '@/components/Landing/GamesShowcaseWrapper';
import { MissionsSection } from '@/components/Landing/MissionsSection';
import { HowItWorks } from '@/components/Landing/HowItWorks';
import { Gallery } from '@/components/Landing/Gallery';
import { FAQ } from '@/components/Landing/FAQ';
import { LocationSection } from '@/components/Landing/LocationSection';
import { ParkNotice } from '@/components/Landing/ParkNotice';
import { Navbar } from '@/components/Landing/Navbar';
import { Footer } from '@/components/Landing/Footer';
import { SectionHeader } from '@/components/UI/SectionHeader';
import { supabaseAnon } from '@/lib/db/supabase-anon';
import { unstable_noStore as noStore } from 'next/cache';

export const metadata = {
  title: 'Warriors Arena — Laser Tag & Gel Blasters · Heliopolis, Cairo',
  description: "Cairo's tactical arena for laser tag & gel blasters. Exclusive 30-minute slots. Six players max. Book your mission.",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  noStore();
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Landing' });

  // Fetch Hero CMS and Hours directly from Supabase
  let heroCms: any = null;
  let missionsCms: any = null;
  let operatingHours = "6 PM - 9 PM";
  let missionsHeader = { heading: t("bundlesTitle"), subheading: t("bundlesLine") };

  try {
    const [hoursData, cmsData] = await Promise.all([
      supabaseAnon.from('settings').select('value').eq('key', 'operating_hours_display').single(),
      supabaseAnon.from('cms_content').select('*')
    ]);

    if (hoursData.data) operatingHours = hoursData.data.value;
    
    if (cmsData.data) {
      // Process Hero CMS
      const heroItems = cmsData.data.filter((item: any) => item.section === 'hero');
      const processedHero: any = { en: {}, ar: {} };
      heroItems.forEach((item: any) => {
        processedHero.en[item.key] = item.value_en;
        processedHero.ar[item.key] = item.value_ar;
      });
      heroCms = processedHero[locale] || processedHero.en || null;

      // Process Missions Header & CMS
      const missionsItems = cmsData.data.filter((item: any) => item.section === 'missions');
      const processedMissions: any = { en: {}, ar: {} };
      missionsItems.forEach((item: any) => {
        processedMissions.en[item.key] = item.value_en;
        processedMissions.ar[item.key] = item.value_ar;
        if (item.key === 'heading') missionsHeader.heading = (locale === 'ar' ? item.value_ar : item.value_en) || item.value_en;
        if (item.key === 'subheading') missionsHeader.subheading = (locale === 'ar' ? item.value_ar : item.value_en) || item.value_en;
      });
      missionsCms = processedMissions[locale] || processedMissions.en || null;
    }
  } catch (err) {
    console.error("Failed to fetch CMS data directly:", err);
  }

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
          <MissionsSection cms={missionsCms} />
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


