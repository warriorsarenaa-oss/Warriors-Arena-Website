import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";

/**
 * Event Processor Endpoint
 * Consumes events from event_queue and cascades updates to Financials & Payroll.
 */
export async function POST(request: Request) {
  // 1. Fetch pending events
  const { data: events, error: fetchError } = await supabaseService
    .from('event_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(10);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!events || events.length === 0) {
    return NextResponse.json({ success: true, processed: 0 });
  }

  let processedCount = 0;

  for (const event of events) {
    try {
      // Mark as processing
      await supabaseService.from('event_queue').update({ status: 'processing' }).eq('id', event.id);

      if (event.event_type === 'BOOKING_UNDONE') {
        const bookingId = event.entity_id;
        
        // CASCADING LOGIC:
        // 1. Financials: Remove revenue associated with this completed booking.
        // If there was a revenue entry or payment tied to 'completed', reverse it.
        // Wait, bookings table has `status = confirmed`. 
        // We must reverse commission from shift_game_log.
        await supabaseService
          .from('shift_game_log')
          .delete()
          .eq('booking_id', bookingId);
          
        // Any payroll records currently tied to shifts related to this booking must be recalculated.
        // The recalculation can happen lazily or we can emit a PAYROLL_RECALCULATE event.
        
        // Reverse specific expenses if any exist natively.
      } else if (event.event_type === 'BOOKING_UPDATED') {
        // Handle changes in discounts or pricing dynamically.
        // We update the shift_game_log game_revenue based on the new total_price_after_discount.
        const booking = event.payload.newState;
        if (booking) {
          await supabaseService
            .from('shift_game_log')
            .update({ game_revenue: booking.total_price_after_discount })
            .eq('booking_id', booking.id);
        }
      } else if (event.event_type === 'SCHEDULE_EDITED') {
        const payload = event.payload;
        const scheduleId = event.entity_id;
        const shift = payload.shift;
        
        if (shift) {
           const { data: schedule } = await supabaseService.from('staff_schedules').select('*').eq('id', scheduleId).single();
           if (schedule) {
             // Find matching payroll record to flag for re-review
             const { data: payrollRecord } = await supabaseService.from('payroll_records')
               .select('id')
               .eq('staff_id', shift.staff_id)
               .eq('week_start', schedule.week_start)
               .single();
               
             if (payrollRecord) {
               // Append a flag/note to alert the finance team
               await supabaseService.from('payroll_records').update({ 
                 notes: '🚨 SCHEDULE EDITED POST-PUBLICATION. Review hours before processing.' 
               }).eq('id', payrollRecord.id);
             }
           }
        }
      }

      // Mark as completed
      await supabaseService.from('event_queue').update({ 
        status: 'completed',
        processed_at: new Date().toISOString()
      }).eq('id', event.id);

      processedCount++;
    } catch (err: any) {
      // Mark as failed
      await supabaseService.from('event_queue').update({ 
        status: 'failed',
        error_message: err.message
      }).eq('id', event.id);
    }
  }

  return NextResponse.json({ success: true, processed: processedCount });
}
