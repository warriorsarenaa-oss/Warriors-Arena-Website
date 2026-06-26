import type { Metadata } from 'next';
import { supabaseService } from '@/lib/db/supabase-service';
import { Navbar } from '@/components/Landing/Navbar';
import { Footer } from '@/components/Landing/Footer';

export const metadata: Metadata = {
  title: 'FAQ — Laser Tag & Gel Blasters Booking | Warriors Arena Cairo',
  description:
    'Frequently asked questions about booking laser tag and gel blasters in Heliopolis, Cairo. Safety, pricing, cancellation policy, and more.',
  openGraph: {
    title: 'Warriors Arena FAQ — Booking, Safety & Pricing',
    description:
      'Everything you need to know before playing laser tag or gel blasters in Heliopolis, Cairo.',
  },
};

export const dynamic = 'force-dynamic';

interface FaqItem {
  id: string;
  question_en: string;
  answer_en: string;
  question_ar: string | null;
  answer_ar: string | null;
}

const FALLBACK_FAQS: FaqItem[] = [
  {
    id: '1',
    question_en: 'How do I book laser tag at Warriors Arena?',
    answer_en:
      'Visit our booking page, select your game (Laser Tag or Gel Blasters), choose your preferred time slot, and complete your reservation. You will receive instant confirmation.',
    question_ar: 'كيف أحجز ليزر تاج في Warriors Arena؟',
    answer_ar:
      'قم بزيارة صفحة الحجز، اختر لعبتك (ليزر تاج أو جيل بلاسترز)، اختر الوقت المفضل، وأكمل حجزك. ستتلقى تأكيدًا فوريًا.',
  },
  {
    id: '2',
    question_en: 'What is the minimum age for laser tag?',
    answer_en:
      'The minimum age is 8 years old. Players under 12 should be accompanied by an adult supervisor.',
    question_ar: 'ما هو الحد الأدنى للسن للعب الليزر تاج؟',
    answer_ar:
      'الحد الأدنى للسن هو 8 سنوات. يجب أن يكون اللاعبون الذين تقل أعمارهم عن 12 عامًا برفقة مشرف بالغ.',
  },
  {
    id: '3',
    question_en: 'How many players can participate per session?',
    answer_en:
      'Up to 6 players per exclusive session. Each booking takes over the entire arena — no sharing with other groups.',
    question_ar: 'كم عدد اللاعبين الذين يمكن المشاركة في كل جلسة؟',
    answer_ar:
      'ما يصل إلى 6 لاعبين لكل جلسة حصرية. كل حجز يستأثر بالساحة بالكامل — لا مشاركة مع مجموعات أخرى.',
  },
  {
    id: '4',
    question_en: 'Is laser tag safe for kids?',
    answer_en:
      'Yes. Warriors Arena uses safe infrared laser technology. All players wear protective gear and safety protocols are enforced by trained staff.',
    question_ar: 'هل الليزر تاج آمن للأطفال؟',
    answer_ar:
      'نعم. يستخدم Warriors Arena تقنية ليزر تحت الأشعة تحت الحمراء الآمنة. يرتدي جميع اللاعبين معدات واقية ويطبق الطاقم المدرب بروتوكولات السلامة.',
  },
  {
    id: '5',
    question_en: 'Can I cancel my booking?',
    answer_en:
      'Yes. Cancellations must be made at least 6 hours before your slot. Please call us directly to cancel.',
    question_ar: 'هل يمكنني إلغاء حجزي؟',
    answer_ar:
      'نعم. يجب أن يتم الإلغاء قبل 6 ساعات على الأقل من موعدك. يرجى الاتصال بنا مباشرة للإلغاء.',
  },
];

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === 'ar';

  let faqs: FaqItem[] = FALLBACK_FAQS;
  try {
    const { data } = await supabaseService
      .from('faq_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (data && data.length > 0) faqs = data as FaqItem[];
  } catch {
    // fall through to hardcoded fallbacks
  }

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: isAr ? (f.question_ar ?? f.question_en) : f.question_en,
      acceptedAnswer: {
        '@type': 'Answer',
        text: isAr ? (f.answer_ar ?? f.answer_en) : f.answer_en,
      },
    })),
  };

  return (
    <>
      <Navbar />
      <main id="main-content" className="max-w-[1020px] mx-auto px-6 py-20">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />

        <h1 className="font-archivo text-3xl md:text-4xl font-bold uppercase tracking-widest text-wa-green mb-3">
          {isAr ? 'الأسئلة الشائعة' : 'Mission Intel'}
        </h1>
        <p className="text-wa-text/50 font-barlow text-sm uppercase tracking-widest mb-12">
          {isAr
            ? 'كل ما تحتاج معرفته قبل الدخول إلى الميدان'
            : 'Everything you need to know before stepping onto the field.'}
        </p>

        <div className="flex flex-col gap-1.5">
          {faqs.map((item, i) => {
            const q = isAr ? (item.question_ar ?? item.question_en) : item.question_en;
            const a = isAr ? (item.answer_ar ?? item.answer_en) : item.answer_en;
            return (
              <div
                key={item.id}
                className="wa-panel border border-wa-line p-6 flex flex-col gap-3"
              >
                <h2 className="font-archivo text-lg text-wa-text uppercase tracking-tight flex items-start gap-3">
                  <span className="text-wa-green font-mono text-xs mt-1 shrink-0">
                    0{i + 1}
                  </span>
                  {q}
                </h2>
                <p className="text-wa-text/70 font-barlow leading-relaxed pl-7">{a}</p>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
