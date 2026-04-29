import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";
import ExcelJS from "exceljs";

export const GET = requirePermission(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');
    const games = searchParams.get('games');
    const statuses = searchParams.get('statuses');

    if (!fromStr || !toStr) {
      return NextResponse.json({ error: "from and to dates are required" }, { status: 400 });
    }

    let query = supabaseService
      .from('bookings')
      .select('*, games(name_en), users!created_by_user_id(full_name)')
      .gte('booking_date', fromStr)
      .lte('booking_date', toStr)
      .order('booking_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (statuses) query = query.in('status', statuses.split(','));
    if (games) query = query.in('game_id', games.split(','));

    const { data: bookings, error } = await query;
    if (error) {
      console.error("Export Query Error:", error);
      throw error;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bookings');

    worksheet.columns = [
      { header: 'Booking Code', key: 'booking_code', width: 15 },
      { header: 'Date', key: 'booking_date', width: 12 },
      { header: 'Time', key: 'start_time', width: 10 },
      { header: 'Game', key: 'game', width: 20 },
      { header: 'Duration', key: 'duration_minutes', width: 10 },
      { header: 'Players', key: 'player_count', width: 10 },
      { header: 'Customer', key: 'customer_name', width: 20 },
      { header: 'Phone', key: 'customer_phone', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Total Price', key: 'total_price_at_booking', width: 12 },
      { header: 'Created By', key: 'created_by', width: 15 },
      { header: 'Created At', key: 'created_at', width: 20 }
    ];

    bookings.forEach(b => {
      const createdAt = b.created_at ? new Date(b.created_at) : null;
      const createdAtStr = (createdAt && !isNaN(createdAt.getTime())) 
        ? createdAt.toISOString() 
        : 'N/A';

      worksheet.addRow({
        booking_code: b.booking_code,
        booking_date: b.booking_date,
        start_time: b.start_time,
        game: (b.games as any)?.name_en || 'Unknown',
        duration_minutes: b.duration_minutes,
        player_count: b.player_count,
        customer_name: b.customer_name,
        customer_phone: b.customer_phone,
        status: b.status,
        total_price_at_booking: b.total_price_at_booking,
        created_by: (b.users as any)?.full_name || 'System',
        created_at: createdAtStr
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="warriors-arena-export-${fromStr}.xlsx"`
      }
    });

  } catch (error: any) {
    console.error("[ADMIN_EXPORT_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "export_data");
