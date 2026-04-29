import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";

export async function GET() {
  try {
    // Fetch default hours (most common pattern)
    const { data } = await supabaseService
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

    return NextResponse.json({ displayText });
  } catch (error: any) {
    console.error("[OPERATING_HOURS_DISPLAY_GET_ERROR]", error);
    return NextResponse.json({ displayText: '6 PM - 9 PM' });
  }
}
