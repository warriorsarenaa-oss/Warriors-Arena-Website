import { NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/db/supabase-service";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = createSupabaseService();
    // Fetch default hours (most common pattern)
    const { data } = await supabase
      .from('operating_hours')
      .select('open_time, close_time')
      .eq('scope', 'default')
      .single();

    if (!data || !data.open_time || !data.close_time) {
      return NextResponse.json({ displayText: '6 PM - 9 PM' });
    }

    const formatTime = (time: string) => {
      const [hour, min] = time.split(':').map(Number);
      const isPM = hour >= 12;
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}${min > 0 ? `:${min}` : ''} ${isPM ? 'PM' : 'AM'}`;
    };

    const displayText = `${formatTime(data.open_time)} - ${formatTime(data.close_time)}`;

    return NextResponse.json({ displayText }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      }
    });
  } catch (error) {
    console.error("[OPERATING_HOURS_DISPLAY_GET_ERROR]", error);
    return NextResponse.json({ displayText: '6 PM - 9 PM' }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      }
    });
  }
}
