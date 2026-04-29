import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";
import { generateTimeSlots } from "@/lib/time/slots";

export const GET = requirePermission(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today';
    let fromDate = searchParams.get('from');
    let toDate = searchParams.get('to');

    const now = new Date();
    
    if (!fromDate || !toDate) {
      if (period === 'today') {
        const today = now.toISOString().split('T')[0];
        fromDate = today;
        toDate = today;
      } else if (period === 'week') {
        const startOfWeek = new Date(now);
        const day = now.getDay();
        const diff = (day + 1) % 7; 
        startOfWeek.setDate(now.getDate() - diff);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        fromDate = startOfWeek.toISOString().split('T')[0];
        toDate = endOfWeek.toISOString().split('T')[0];
      } else if (period === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        fromDate = startOfMonth.toISOString().split('T')[0];
        toDate = endOfMonth.toISOString().split('T')[0];
      }
    }

    const { data: bookings, error } = await supabaseService
      .from('bookings')
      .select(`
        id, status, total_price_at_booking, booking_date, start_time,
        cancellation_reason, game_id, deposit_amount, deposit_status, 
        final_amount_paid,
        games ( name_en )
      `)
      .gte('booking_date', fromDate)
      .lte('booking_date', toDate);

    if (error) throw error;

    let totalRevenue = 0;
    let realizedCount = 0;
    let confirmedCount = 0;
    let confirmedRevenue = 0;
    let cancelledRefunded = 0;
    let cancelledForfeited = 0;
    let noShowCount = 0;

    // Split breakdown maps
    const completedMap: Record<string, number> = {};
    const penaltyMap: Record<string, number> = {};
    const gameBreakdownMap: Record<string, any> = {};
    const cancelReasonMap: Record<string, number> = {};

    for (const b of bookings || []) {
      const price = Number(b.total_price_at_booking);
      const deposit = Number((b as any).deposit_amount || price * 0.25);
      const finalPaid = b.final_amount_paid ? Number(b.final_amount_paid) : price;
      const gameName = (b.games as any)?.name_en || 'Unknown';

      if (!gameBreakdownMap[gameName]) {
        gameBreakdownMap[gameName] = { 
          game_name: gameName, confirmed: 0, completed: 0, cancelled: 0, no_show: 0, total_revenue: 0 
        };
      }

      // Slot key logic
      let slotKey = "";
      if (period === 'today') {
        slotKey = b.start_time.substring(0, 5);
      } else if (period === 'week') {
        const d = new Date(b.booking_date).getDay();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        slotKey = days[d];
      } else if (period === 'month') {
        const dayNum = new Date(b.booking_date).getDate();
        slotKey = `W${Math.ceil(dayNum / 7)}`;
      } else {
        slotKey = b.booking_date;
      }

      if (b.status === 'confirmed') {
        confirmedCount++;
        confirmedRevenue += price;
        gameBreakdownMap[gameName].confirmed++;
      }

      if (b.status === 'completed') {
        realizedCount++;
        totalRevenue += finalPaid;
        gameBreakdownMap[gameName].completed++;
        gameBreakdownMap[gameName].total_revenue += finalPaid;
        completedMap[slotKey] = (completedMap[slotKey] || 0) + finalPaid;
      }

      if (b.status === 'no_show') {
        noShowCount++;
        totalRevenue += deposit;
        gameBreakdownMap[gameName].no_show++;
        gameBreakdownMap[gameName].total_revenue += deposit;
        penaltyMap[slotKey] = (penaltyMap[slotKey] || 0) + deposit;
      }

      if (b.status === 'cancelled') {
        const reason = b.cancellation_reason || 'Unknown';
        cancelReasonMap[reason] = (cancelReasonMap[reason] || 0) + 1;
        
        if ((b as any).deposit_status === 'forfeited') {
          cancelledForfeited++;
          totalRevenue += deposit;
          gameBreakdownMap[gameName].total_revenue += deposit;
          penaltyMap[slotKey] = (penaltyMap[slotKey] || 0) + deposit;
        } else {
          cancelledRefunded++;
        }
        gameBreakdownMap[gameName].cancelled++;
      }
    }

    const totalAttempts = confirmedCount + realizedCount + cancelledRefunded + cancelledForfeited + noShowCount;
    const avgBookingValue = (realizedCount + noShowCount + cancelledForfeited) > 0 
      ? totalRevenue / (realizedCount + noShowCount + cancelledForfeited) : 0;
    const cancellationRate = totalAttempts > 0 
      ? ((cancelledRefunded + cancelledForfeited + noShowCount) / totalAttempts) * 100 : 0;

    let slot_breakdown: any[] = [];
    const buildSlots = (keys: string[]) => keys.map(key => ({
      slot_time: key,
      completed_revenue: completedMap[key] || 0,
      penalty_revenue: penaltyMap[key] || 0,
      total_revenue: (completedMap[key] || 0) + (penaltyMap[key] || 0)
    }));

    if (period === 'today') {
      // Fetch actual operating hours for today to build dynamic slot list
      const { data: hoursData } = await supabaseService.rpc("fn_resolve_operating_hours", {
        p_date: fromDate
      });
      const hours = Array.isArray(hoursData) ? hoursData[0] : hoursData;
      const openT = hours?.open_time || "18:00:00";
      const closeT = hours?.close_time || "21:00:00";
      
      const dynamicKeys = generateTimeSlots(openT, closeT, 30).map(s => s.substring(0, 5));
      slot_breakdown = buildSlots(dynamicKeys);
    } else if (period === 'week') {
      slot_breakdown = buildSlots(['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    } else if (period === 'month') {
      slot_breakdown = buildSlots(['W1', 'W2', 'W3', 'W4', 'W5']);
    } else {
      const allKeys = Array.from(new Set([...Object.keys(completedMap), ...Object.keys(penaltyMap)])).sort();
      slot_breakdown = buildSlots(allKeys);
    }

    return NextResponse.json({
      confirmed_revenue: confirmedRevenue,
      realized_revenue: totalRevenue,
      games_played: realizedCount,
      avg_booking_value: avgBookingValue,
      cancellation_rate: cancellationRate,
      slot_breakdown,
      game_breakdown: Object.values(gameBreakdownMap),
      cancellation_breakdown: Object.entries(cancelReasonMap).map(([reason, count]) => ({ reason, count })),
      breakdown: {
        completed: realizedCount,
        no_show: noShowCount,
        cancelled_refunded: cancelledRefunded,
        cancelled_forfeited: cancelledForfeited,
      }
    });
  } catch (error: any) {
    console.error("[ADMIN_REVENUE_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "view_revenue");
