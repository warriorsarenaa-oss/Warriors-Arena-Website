import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getUserPermissions } from "@/lib/auth/permissions";
import { supabaseService } from "@/lib/db/supabase-service";
import { WAPanel } from "@/components/UI/WAPanel";
import { CalendarDays, DollarSign, Target, Clock, PlusCircle } from "lucide-react";
import { generateTimeSlots } from "@/lib/time/slots";

export const revalidate = 0; // Disable cache for dashboard

export default async function AdminDashboard() {
  const { user, error: sessionError } = await getSession();
  
  if (sessionError || !user) {
    redirect("/admin/login");
  }

  const permissions = await getUserPermissions(user.id);
  const canViewBookings = permissions.permissionKeys.includes("view_bookings");
  const canCreateBookings = permissions.permissionKeys.includes("create_booking");
  
  // Fetch Dashboard Stats (Server-side)
  const today = new Date().toISOString().split('T')[0];
  
  // 1. Confirmed Bookings & Revenue
  const { data: bookings } = await supabaseService
    .from("bookings")
    .select("id, booking_code, status, total_price_at_booking, game_id, start_time, duration_minutes, occupied_slots, customer_name, games(name_en)")
    .eq("booking_date", today);

  const confirmedCount = bookings?.filter(b => b.status === "confirmed").length || 0;
  const liveSessions = bookings?.filter(b => b.status === "in_progress" || b.status === "checked_in").length || 0;
  
  // Total Revenue (Confirmed for now, will be Completed once workflow is fully live)
  const todaysRevenue = bookings?.filter(b => b.status === "confirmed" || b.status === "completed" || b.status === "in_progress")
    .reduce((sum, b) => sum + Number(b.total_price_at_booking), 0) || 0;
  
  // Unique games played today
  const uniqueGames = new Set(bookings?.map(b => b.game_id) || []);

  // Fetch Operating Hours for Today
  const { data: hoursData } = await supabaseService.rpc("fn_resolve_operating_hours", {
    p_date: today
  });
  const hours = Array.isArray(hoursData) ? hoursData[0] : hoursData;
  const openTime = hours?.open_time || "18:00:00";
  const closeTime = hours?.close_time || "21:00:00";
  const isVenueClosed = hours?.is_closed || false;

  const timelineSlots = isVenueClosed ? [] : generateTimeSlots(openTime, closeTime, 30);
  
  // Next 60-min alert
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
  
  const upcomingHour = new Date(now.getTime() + 60 * 60 * 1000);
  const upcomingHourStr = `${upcomingHour.getHours().toString().padStart(2, '0')}:${upcomingHour.getMinutes().toString().padStart(2, '0')}:00`;

  const nextBooking = bookings
    ?.filter(b => b.status === "confirmed" && b.start_time >= currentTimeStr && b.start_time <= upcomingHourStr)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-heading uppercase tracking-widest text-wa-green mb-2">
          OPERATIONAL DASHBOARD
        </h1>
        <p className="text-wa-text/60 uppercase text-xs tracking-wider">
          System overview for {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {nextBooking && (
        <div className="bg-wa-orange/10 border border-wa-orange p-4 rounded-lg flex items-center gap-4">
          <div className="bg-wa-orange/20 p-2 rounded-full">
            <Clock className="w-6 h-6 text-wa-orange" />
          </div>
          <div>
            <h3 className="text-wa-orange font-bold uppercase tracking-widest text-sm">INCOMING PROTOCOL ALERT</h3>
            <p className="text-wa-text/80 text-sm">
              {(nextBooking.games as any)?.name_en} starting at {nextBooking.start_time.substring(0, 5)}
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <WAPanel className="p-6 border border-wa-green/20 bg-wa-bg/50">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-wa-text/60 text-xs uppercase tracking-widest">Today's Confirmed</h3>
            <CalendarDays className="w-5 h-5 text-wa-green" />
          </div>
          <p className="text-4xl font-bold text-wa-text font-heading">{confirmedCount}</p>
        </WAPanel>

        <WAPanel className="p-6 border border-wa-green/20 bg-wa-bg/50">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-wa-text/60 text-xs uppercase tracking-widest">Expected Revenue</h3>
            <DollarSign className="w-5 h-5 text-wa-green" />
          </div>
          <p className="text-4xl font-bold text-wa-green font-heading">{todaysRevenue.toLocaleString()} EGP</p>
        </WAPanel>

        <WAPanel className="p-6 border border-wa-green/20 bg-wa-bg/50">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-wa-text/60 text-xs uppercase tracking-widest">LIVE SESSIONS NOW</h3>
            <Target className="w-5 h-5 text-wa-green" />
          </div>
          <p className="text-4xl font-bold text-wa-text font-heading">{liveSessions}</p>
        </WAPanel>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        {canCreateBookings && (
          <Link href="/admin/reservations?new=true" className="flex items-center gap-2 bg-wa-green text-wa-bg px-6 py-3 font-bold uppercase tracking-widest hover:bg-wa-green/90 transition-colors rounded-lg">
            <PlusCircle className="w-5 h-5" />
            New Manual Booking
          </Link>
        )}
        {canViewBookings && (
          <Link href="/admin/reservations" className="flex items-center gap-2 border border-wa-green/50 text-wa-green px-6 py-3 font-bold uppercase tracking-widest hover:bg-wa-green/10 transition-colors rounded-lg">
            <CalendarDays className="w-5 h-5" />
            View All Reservations
          </Link>
        )}
      </div>

      {/* Mini Slot Grid (UI Only, simplified for dashboard) */}
      {canViewBookings && (
        <WAPanel className="p-6 border border-wa-green/20 bg-wa-bg/50 mt-4">
          <h3 className="text-wa-green font-bold uppercase tracking-widest mb-6">
            Today's Timeline ({openTime.substring(0, 5)} - {closeTime.substring(0, 5)})
            {isVenueClosed && " — VENUE CLOSED"}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {timelineSlots.map((slot) => {
              // ✅ Find booking that occupies this slot
              const booking = bookings?.find(b => {
                if (b.occupied_slots && Array.isArray(b.occupied_slots)) {
                  return b.occupied_slots.includes(slot) || b.occupied_slots.includes(slot.substring(0, 5));
                }
                if (b.start_time === slot) return true;
                if (b.duration_minutes === 60) {
                  const [h, m] = b.start_time.split(':').map(Number);
                  const nextSlotH = m === 30 ? h + 1 : h;
                  const nextSlotM = m === 30 ? 0 : 30;
                  const nextSlot = `${String(nextSlotH).padStart(2, '0')}:${String(nextSlotM).padStart(2, '0')}:00`;
                  return slot === nextSlot;
                }
                return false;
              });

              const isFirstSlotOfBooking = booking && (booking.start_time === slot || booking.start_time.substring(0, 5) === slot.substring(0, 5));
              const isPast = slot < currentTimeStr;
              
              let statusClass = "border-wa-green/20 text-wa-green hover:bg-wa-green/5";
              let label = "AVAILABLE";

              if (booking) {
                switch (booking.status) {
                  case 'pending':
                    statusClass = "border-yellow-500 bg-yellow-500/10 text-yellow-500";
                    label = "AWAITING DEPOSIT";
                    break;
                  case 'confirmed':
                    statusClass = "border-orange-500 bg-orange-500/10 text-orange-500";
                    label = "CONFIRMED";
                    break;
                  case 'completed':
                    statusClass = "border-wa-green bg-wa-green/20 text-wa-green opacity-80";
                    label = "COMPLETED";
                    break;
                  case 'no_show':
                    statusClass = "border-gray-500 bg-gray-500/10 text-gray-500 line-through opacity-40";
                    label = "NO SHOW";
                    break;
                  case 'cancelled':
                    statusClass = "border-red-500 bg-red-500/10 text-red-500 line-through opacity-40";
                    label = "CANCELLED";
                    break;
                  default:
                    statusClass = "border-wa-orange bg-wa-orange/10 text-wa-orange";
                    label = "BOOKED";
                }
              } else if (isPast) {
                statusClass = "border-wa-text/10 text-wa-text/40 bg-wa-text/5";
                label = "CLOSED";
              }

              return (
                <div 
                  key={slot} 
                  className={`border p-4 rounded-lg flex flex-col items-center justify-center text-center transition-colors cursor-default min-h-[100px] ${statusClass}`}
                >
                  <span className="font-bold text-lg font-heading">{slot.substring(0, 5)}</span>
                  
                  {booking && isFirstSlotOfBooking && (
                    <div className="mt-2 text-[10px] uppercase tracking-widest flex flex-col gap-0.5">
                      <span className="font-bold text-wa-text">{(booking as any).games?.name_en || 'GAME'}</span>
                      <span className="opacity-60">{(booking as any).customer_name}</span>
                    </div>
                  )}

                  {booking && !isFirstSlotOfBooking && (
                    <div className="mt-2 text-[10px] uppercase tracking-widest opacity-50 font-mono">
                      ← {booking.duration_minutes}min
                    </div>
                  )}

                  {!booking && (
                    <span className="text-[10px] uppercase tracking-widest mt-1 opacity-40 font-mono">{label}</span>
                  )}
                </div>
              );
            })}
          </div>
        </WAPanel>
      )}
    </div>
  );
}
