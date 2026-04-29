import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateReceipt } from '@/lib/pdf/render-receipt';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const querySchema = z.object({
  phone_last4: z.string().length(4),
  locale: z.enum(['en', 'ar']).default('en'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const resolvedParams = await params;
    const { code } = resolvedParams;
    
    // Parse query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsedQuery = querySchema.safeParse(searchParams);

    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Missing or invalid phone_last4 parameter' }, { status: 400 });
    }

    const { phone_last4, locale } = parsedQuery.data;

    // Fetch booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        games ( name_en, name_ar )
      `)
      .eq('booking_code', code)
      .single();

    if (error || !booking) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify phone_last4
    const actualLast4 = booking.customer_phone.slice(-4);
    if (actualLast4 !== phone_last4) {
      return NextResponse.json({ error: 'Phone verification failed' }, { status: 404 });
    }

    // Generate PDF
    const pdfBuffer = await generateReceipt(booking, locale);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="WA-${code}.pdf"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    // TODO: Log to Sentry
    return NextResponse.json(
      { error: 'Receipt temporarily unavailable — please contact us.' },
      { status: 500 }
    );
  }
}
