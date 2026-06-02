import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requirePermission } from '@/lib/auth/permission-middleware';
import { logAuditAction } from '@/lib/admin/audit-log';

export const POST = requirePermission(async (
  request: Request,
  { params, user }: { params: Promise<{ id: string }>, user: any }
) => {
  try {
    // ✅ CRITICAL: Await params in Next.js 15+
    const resolvedParams = await params;
    const identifier = resolvedParams.id; // Can be UUID or booking_code

    const body = await request.json();
    const { 
      reason, 
      notes, 
      note
    } = body;
    const finalNotes = notes || note || null;


    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    let booking = null;
    let findError = null;

    if (isUuid) {
      const res = await supabase.from('bookings').select('*').eq('id', identifier).maybeSingle();
      booking = res.data;
      findError = res.error;
    } else {
      const res = await supabase.from('bookings').select('*').eq('booking_code', identifier).maybeSingle();
      booking = res.data;
      findError = res.error;
    }

    if (findError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Determine cancellation type based on deadline (24h)
    const now = new Date();
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    let cancellationType = 'other';
    if (reason === 'Customer Request') {
      cancellationType = hoursUntilBooking >= 24 
        ? 'customer_request_early' 
        : 'customer_request_late';
    } else if (reason === 'No Show') {
      cancellationType = 'no_show';
    }

    const updateData: any = {
      status: 'cancelled',
      cancellation_reason: reason,
      cancellation_notes: finalNotes,
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
      cancellation_type: cancellationType,
      updated_at: new Date().toISOString(),
      deposit_amount: 0,
      total_price: 0,
      total_price_after_discount: 0,
      final_amount_paid: 0,
      deposit_status: 'pending'
    };

    const { data: result, error: cancelError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', booking.id)
      .select()
      .single();

    if (cancelError) {
      console.error('❌ Cancellation failed:', cancelError);
      return NextResponse.json({ error: 'Failed to cancel booking', details: cancelError.message }, { status: 500 });
    }
    
    // Release slots in booking_slots table
    await supabase
      .from('booking_slots')
      .update({ released: true })
      .eq('booking_id', booking.id);

    
    // Audit log
    await logAuditAction({
      request,
      actor_user_id: user.id,
      actor_email: user.email,
      action: "cancel_booking",
      entity_type: "bookings",
      entity_id: booking.booking_code,
      before_state: { status: booking.status },
      after_state: updateData
    });

    return NextResponse.json({ 
      success: true, 
      booking: result
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}, "cancel_booking");
