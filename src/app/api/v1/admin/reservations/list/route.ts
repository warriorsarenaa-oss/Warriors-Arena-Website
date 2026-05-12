import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";

export const GET = requirePermission(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const gameId = searchParams.get('game');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 25;
    const offset = (page - 1) * limit;

    let query = supabaseService
      .from('bookings')
      .select(`
        *,
        games ( name_en )
      `, { count: 'exact' });

    if (fromDate) {
      query = query.gte('booking_date', fromDate);
    }
    if (toDate) {
      query = query.lte('booking_date', toDate);
    }
    if (gameId) {
      query = query.eq('game_id', gameId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Default sorting
    query = query.order('booking_date', { ascending: false }).order('start_time', { ascending: false });
    
    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      data,
      metadata: {
        total: count,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error) {
    console.error("[ADMIN_RESERVATIONS_LIST_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "view_bookings");
