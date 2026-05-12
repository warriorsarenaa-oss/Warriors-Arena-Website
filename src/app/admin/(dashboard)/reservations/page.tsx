"use client";

import { useState, useEffect } from "react";
import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, LayoutGrid, List, AlertTriangle } from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";
import { ManualBookingModal } from "./manual-booking-modal";
import { CancelDialog } from "./cancel-dialog";
import { ViewBookingModal } from "./view-booking-modal";

export default function ReservationsPage() {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<"grid" | "list">("grid");
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [isClosed, setIsClosed] = useState(false);

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<any>(null);
  const [viewBooking, setViewBooking] = useState<any>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const res = await fetch(`/api/v1/admin/reservations?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperatingHours = async () => {
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const response = await fetch(`/api/v1/operating-hours?date=${dateStr}`);
      const data = await response.json();

      if (data.isClosed) {
        setIsClosed(true);
        setTimeSlots([]);
        return;
      }

      setIsClosed(false);
      const slots = generateTimeSlots(data.openTime, data.closeTime);
      setTimeSlots(slots);
    } catch (err) {
      console.error("Failed to fetch operating hours:", err);
      // Fallback
      setTimeSlots(["18:00:00", "18:30:00", "19:00:00", "19:30:00", "20:00:00", "20:30:00"]);
    }
  };

  const generateTimeSlots = (start: string, end: string) => {
    const slots = [];
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (
      currentHour < endHour || 
      (currentHour === endHour && currentMin < endMin)
    ) {
      slots.push(
        `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}:00`
      );

      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }

    return slots;
  };

  useEffect(() => {
    fetchBookings();
    fetchOperatingHours();
  }, [date, view]); // Re-fetch on date change

  // Check URL params for auto-opening modal (from dashboard "New Manual Booking" link)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("new") === "true") {
        setIsBookingModalOpen(true);
        // Clean up URL
        window.history.replaceState({}, '', '/admin/reservations');
      }
    }
  }, []);

  const handleDateChange = (days: number) => {
    setDate(prev => days > 0 ? addDays(prev, days) : subDays(prev, Math.abs(days)));
  };

  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null);

  const handleOpenBooking = (time: string | null = null) => {
    setSelectedSlotTime(time);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading uppercase tracking-widest text-wa-green mb-2">
            RESERVATION CENTER
          </h1>
          <p className="text-wa-text/60 uppercase text-xs tracking-wider">
            Manage slots and availability
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-wa-bg border border-wa-green/20 rounded p-1">
            <button 
              className={`p-2 rounded ${view === 'grid' ? 'bg-wa-green/20 text-wa-green' : 'text-wa-text/50'}`}
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              className={`p-2 rounded ${view === 'list' ? 'bg-wa-green/20 text-wa-green' : 'text-wa-text/50'}`}
              onClick={() => setView('list')}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <WAPanel className="p-4 border border-wa-green/20 bg-wa-bg/50">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-wa-green/10 rounded text-wa-green">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold uppercase tracking-widest font-heading">
            {format(date, "EEEE, MMMM d, yyyy")}
          </h2>
          <button onClick={() => handleDateChange(1)} className="p-2 hover:bg-wa-green/10 rounded text-wa-green">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-wa-green border-t-transparent rounded-full shadow-[0_0_15px_rgba(0,255,65,0.2)]"></div>
          </div>
        ) : isClosed ? (
          <div className="h-64 flex flex-col items-center justify-center text-wa-error/50 gap-4 border border-wa-error/20 rounded-lg bg-wa-error/5 backdrop-blur-sm">
            <AlertTriangle className="w-12 h-12" />
            <span className="font-bold uppercase tracking-[0.2em] text-center px-4">ARENA CLOSED ON THIS DATE</span>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {timeSlots.map((slot) => {
              // ✅ Find booking that occupies this slot (check array first, then fallback)
              const booking = bookings.find(b => {
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
              
              if (booking) {
                return (
                  <div key={slot} className={`border p-4 rounded-lg flex flex-col relative group min-h-[120px] transition-all hover:scale-[1.02] ${
                    booking.status === 'confirmed' ? 'border-wa-orange bg-wa-orange/10' :
                    booking.status === 'completed' ? 'border-wa-green/40 bg-wa-green/10' :
                    'border-wa-text/20 bg-wa-surface/30'
                  }`}>
                    <span className={`font-bold text-lg font-heading mb-2 ${
                      booking.status === 'confirmed' ? 'text-wa-orange' :
                      booking.status === 'completed' ? 'text-wa-green' :
                      'text-wa-text/60'
                    }`}>{slot.substring(0, 5)}</span>
                    
                    {isFirstSlotOfBooking ? (
                      <>
                        <span className="text-xs uppercase tracking-widest text-wa-text font-bold line-clamp-1">{booking.games?.name_en}</span>
                        <span className="text-xs text-wa-text/70 line-clamp-1">{booking.customer_name}</span>
                        <span className={`text-[10px] mt-2 px-2 py-1 rounded w-max uppercase tracking-widest font-bold ${
                           booking.status === 'confirmed' ? 'bg-wa-orange/20 text-wa-orange' : 
                           booking.status === 'completed' ? 'bg-wa-green/20 text-wa-green' :
                           'bg-wa-text/10 text-wa-text/50'
                        }`}>
                          {booking.status}
                        </span>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center flex-1 opacity-50">
                        <span className="text-[10px] uppercase tracking-widest font-mono">← {booking.duration_minutes}min</span>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-wa-bg/95 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-4 rounded-lg gap-3 border border-wa-green/50">
                       <button onClick={() => setViewBooking(booking)} className="text-[10px] font-bold text-wa-bg bg-wa-green px-4 py-2 rounded-full w-full uppercase tracking-widest">VIEW INTEL</button>
                       {['pending', 'confirmed'].includes(booking.status) && (
                         <button 
                           onClick={() => setSelectedBookingForCancel(booking)}
                           className="text-[10px] font-bold text-wa-error border border-wa-error/30 hover:bg-wa-error/10 px-4 py-2 rounded-full w-full uppercase tracking-widest"
                         >
                           ABORT
                         </button>
                       )}
                    </div>
                  </div>
                );
              }

              return (
                <button 
                  key={slot} 
                  onClick={() => handleOpenBooking(slot)}
                  className="border border-wa-green/20 bg-wa-green/5 p-4 rounded-lg flex flex-col items-center justify-center hover:bg-wa-green/10 hover:border-wa-green/40 transition-all group min-h-[120px] active:scale-95"
                >
                  <span className="font-bold text-lg font-heading text-wa-green group-hover:scale-110 transition-transform">{slot.substring(0, 5)}</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] mt-2 opacity-30 group-hover:opacity-100 transition-opacity">AVAILABLE</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-wa-green/20 text-wa-text/60 uppercase tracking-widest text-xs">
                  <th className="p-3">Code</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Game</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-wa-text/50 italic">No bookings for this date</td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="border-b border-wa-green/10 hover:bg-wa-green/5 transition-colors">
                      <td className="p-3 font-bold">{b.booking_code}</td>
                      <td className="p-3">{b.start_time.substring(0, 5)}</td>
                      <td className="p-3">{b.game_name || b.games?.name_en}</td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span>{b.customer_name}</span>
                          <span className="text-[10px] text-wa-text/50">{b.customer_phone}</span>
                        </div>
                      </td>
                      <td className="p-3">{b.total_price_at_booking} EGP</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-widest ${
                          b.status === 'confirmed' ? 'bg-wa-orange/20 text-wa-orange' : 
                          b.status === 'completed' ? 'bg-wa-green/20 text-wa-green' :
                          'bg-wa-text/10 text-wa-text/50'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-4 items-center">
                          <button onClick={() => setViewBooking(b)} className="text-wa-green hover:underline text-xs uppercase font-bold">View</button>
                          {['pending', 'confirmed'].includes(b.status) && (
                            <button 
                              onClick={() => setSelectedBookingForCancel(b)}
                              className="text-wa-error hover:underline text-xs uppercase font-bold"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </WAPanel>

      {isBookingModalOpen && (
        <ManualBookingModal 
          initialTime={selectedSlotTime}
          initialDate={format(date, "yyyy-MM-dd")}
          onClose={() => setIsBookingModalOpen(false)} 
          onSuccess={() => {
            setIsBookingModalOpen(false);
            fetchBookings();
          }} 
        />
      )}

      {selectedBookingForCancel && (
        <CancelDialog 
          booking={selectedBookingForCancel} 
          onClose={() => setSelectedBookingForCancel(null)}
          onSuccess={() => {
            setSelectedBookingForCancel(null);
            fetchBookings();
          }}
        />
      )}

      {viewBooking && (
        <ViewBookingModal
          booking={viewBooking}
          onClose={() => setViewBooking(null)}
          onUpdate={fetchBookings}
        />
      )}
    </div>
  );
}
