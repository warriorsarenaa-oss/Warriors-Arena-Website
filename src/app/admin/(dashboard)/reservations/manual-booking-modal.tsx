"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { WAButton } from "@/components/UI/WAButton";

interface ManualBookingModalProps {
  initialTime?: string | null;
  initialDate?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManualBookingModal({ initialTime, initialDate, onClose, onSuccess }: ManualBookingModalProps) {
  // ✅ Initialize with proper defaults to prevent NaN
  const [formData, setFormData] = useState({
    gameId: "",
    date: initialDate || format(new Date(), "yyyy-MM-dd"),
    startTime: initialTime || "",
    duration: 30,
    playerCount: 4,
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    notes: "",
  });

  const [games, setGames] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]); // ✅ Always initialize as array
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // ✅ Fetch Games on mount
  useEffect(() => {
    fetch("/api/v1/games?locale=en&active=all")
      .then(res => res.json())
      .then(data => {
        const gamesArray = Array.isArray(data) ? data : [];
        setGames(gamesArray);
        if (gamesArray.length > 0) {
          setFormData(prev => ({ ...prev, gameId: gamesArray[0].id }));
        }
      })
      .catch(err => console.error("Failed to load games", err));
  }, []);

  // ✅ Fetch slots when date or duration changes
  useEffect(() => {
    if (!formData.gameId || !formData.date || !formData.duration) return;
    
    setLoadingSlots(true);
    setAvailableSlots([]);

    const fetchSlots = async () => {
      try {
        console.log("=== FETCHING SLOTS FOR ADMIN ===");
        console.log("Date:", formData.date);

        // ✅ Pass admin=true to see today's past slots
        const response = await fetch(`/api/v1/availability?date=${formData.date}&duration_minutes=${formData.duration}&admin=true`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        
        console.log("API Response:", data);
        console.log("Meta:", data.meta);

        // Handle both old array format and new object format safely
        const slotsArray = Array.isArray(data) ? data : (Array.isArray(data?.slots) ? data.slots : []);
        
        // ✅ CRITICAL: Verify each slot's booking status
        console.log("Slot status breakdown:");
        slotsArray.forEach((slot: any, index: number) => {
          console.log(`  ${index + 1}. ${slot.start_time || slot.slot_time}: ${slot.is_booked ? "❌ BOOKED" : "✅ AVAILABLE"}`);
          if (slot.is_booked && slot.bookings) {
            slot.bookings.forEach((b: any) => {
              console.log(`     └─ ${b.code} (${b.status}) - ${b.customer}`);
            });
          }
        });

        setAvailableSlots(slotsArray);
        // Only reset if the current startTime is not available in the new slots
        setFormData(prev => {
          const isCurrentSlotAvailable = slotsArray.find((s: any) => (s.start_time || s.slot_time) === prev.startTime);
          return { ...prev, startTime: isCurrentSlotAvailable ? prev.startTime : (initialTime || "") };
        });
      } catch (err: any) {
        console.error("Failed to fetch slots:", err);
        setError(`Failed to load time slots: ${err.message}`);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [formData.gameId, formData.date, formData.duration]);

  // ✅ Validate date on change
  const handleDateChange = (dateStr: string) => {
    const selectedDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(selectedDate.getTime())) {
      setError("Invalid date format.");
      return;
    }

    // Admins can book past dates, but we should warn or restrict if needed.
    // For now, let's allow it but restrict the picker's max range.
    setError(null);
    setFormData({ ...formData, date: dateStr, startTime: "" });
  };

  // ✅ Safe pricing calculation
  const calculatePricing = () => {
    if (!games || games.length === 0 || !formData.gameId) {
      return { pricePerPlayer: 0, total: 0, deposit: 0 };
    }

    const game = games.find(g => g.id === formData.gameId);
    // ✅ Fix: use 'pricing' as returned by public API
    const pricingData = game?.pricing || game?.game_pricing;
    if (!game || !pricingData) return { pricePerPlayer: 0, total: 0, deposit: 0 };

    const pricingTier = pricingData.find((p: any) => p.duration_minutes === formData.duration);
    if (!pricingTier) return { pricePerPlayer: 0, total: 0, deposit: 0 };

    const pricePerPlayer = pricingTier.price_per_player || 0;
    const total = pricePerPlayer * (formData.playerCount || 0);
    const deposit = Math.round(total * 0.25);

    return { pricePerPlayer, total, deposit };
  };

  const { pricePerPlayer, total, deposit } = calculatePricing();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorDetails("");

    // ✅ Detailed Validation
    if (!formData.gameId) {
      setError("Please select a game.");
      setShowErrorModal(true);
      return;
    }
    if (!formData.date) {
      setError("Please select a date.");
      setShowErrorModal(true);
      return;
    }
    if (!formData.startTime) {
      setError("Please select a time slot.");
      setShowErrorModal(true);
      return;
    }
    if (!formData.customerName.trim()) {
      setError("Customer name is required.");
      setShowErrorModal(true);
      return;
    }
    if (!formData.customerPhone.trim()) {
      setError("Customer phone is required.");
      setShowErrorModal(true);
      return;
    }

    // Validate phone format (Egyptian)
    const phoneRegex = /^(\+20|0)?1[0-2]\d{8}$/;
    if (!phoneRegex.test(formData.customerPhone.replace(/\s/g, ""))) {
      setError("Invalid Egyptian phone number format.");
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        game_id: formData.gameId,
        booking_date: formData.date,
        start_time: formData.startTime,
        duration_minutes: formData.duration,
        player_count: formData.playerCount,
        customer_name: formData.customerName.trim(),
        customer_phone: formData.customerPhone.trim(),
        customer_email: formData.customerEmail?.trim() || undefined,
        customer_notes: formData.notes?.trim() || undefined,
      };

      console.log("=== SUBMITTING BOOKING ===");
      console.log("Payload:", JSON.stringify(payload, null, 2));

      const res = await fetch("/api/v1/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", res.status);

      const responseText = await res.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}`);
      }

      console.log("Response data:", responseData);

      if (!res.ok) {
        const errorMsg = responseData.error || responseData.message || `Server error: ${res.status}`;
        const details = responseData.details 
          ? JSON.stringify(responseData.details, null, 2)
          : responseData.conflicts
          ? `Slot already booked: ${responseData.conflicts.join(", ")}`
          : "";
        
        setError(errorMsg);
        setErrorDetails(details);
        setShowErrorModal(true);
        return;
      }

      // ✅ Success!
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        onSuccess();
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error("=== BOOKING ERROR ===", err);
      setError("Failed to create booking");
      setErrorDetails(err.message || "Unknown error");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-wa-bg border border-wa-green/50 p-6 rounded-lg max-w-2xl w-full relative my-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-wa-text/50 hover:text-wa-text">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold uppercase tracking-widest font-heading text-wa-green">
            New Manual Booking
          </h2>
          <p className="text-xs text-wa-text/60 uppercase mt-1">Admin Override Protocol</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && !showErrorModal && (
            <div className="bg-wa-error/10 border border-wa-error text-wa-error p-3 text-sm">
              <p className="font-bold">{error}</p>
              {errorDetails && <pre className="text-xs opacity-80 mt-1">{errorDetails}</pre>}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest opacity-70">Game</label>
              <select
                value={formData.gameId}
                onChange={(e) => setFormData({ ...formData, gameId: e.target.value })}
                className="bg-wa-bg border border-wa-text/20 p-2 rounded outline-none focus:border-wa-green"
                required
              >
                {games.map(g => <option key={g.id} value={g.id}>{g.name_en}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest opacity-70">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleDateChange(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
                max={format(addDays(new Date(), 90), "yyyy-MM-dd")}
                className="bg-wa-bg border border-wa-text/20 p-2 rounded outline-none focus:border-wa-green"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest opacity-70">Duration</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="bg-wa-bg border border-wa-text/20 p-2 rounded outline-none focus:border-wa-green"
              >
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest opacity-70">Players</label>
              <input
                type="number"
                value={formData.playerCount || ""} // ✅ Prevent NaN warning by using "" if empty
                onChange={(e) => setFormData({ ...formData, playerCount: parseInt(e.target.value) || 0 })}
                min={1}
                max={50}
                className="bg-wa-bg border border-wa-text/20 p-2 rounded outline-none focus:border-wa-green"
                required
              />
              {formData.playerCount > 6 && (
                <div className="flex items-center gap-1 text-[10px] text-wa-orange mt-1">
                  <AlertCircle className="w-3 h-3" /> Override: Up to 50 players allowed
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest opacity-70">Time Slot</label>
            {loadingSlots ? (
              <div className="text-sm text-wa-text/50 font-mono animate-pulse">SCANNING AVAILABILITY...</div>
            ) : availableSlots.length === 0 ? (
              <div className="text-sm text-wa-error border border-wa-error/20 p-3 rounded bg-wa-error/5 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                No slots available for this configuration.
              </div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {availableSlots.map((slot: any, index: number) => {
                  const timeDisplay = (slot.start_time || slot.slot_time || "??:??").substring(0, 5);
                  
                  // In admin mode, explicitly check the boolean is_booked
                  const isBooked = slot.is_booked === true;
                  const isSelected = formData.startTime === (slot.start_time || slot.slot_time);

                  return (
                    <button
                      key={`${slot.start_time || slot.slot_time}-${index}`}
                      type="button"
                      disabled={isBooked}
                      onClick={() => {
                        if (!isBooked) {
                          console.log("Selected slot:", slot.start_time || slot.slot_time);
                          setFormData(prev => ({ ...prev, startTime: slot.start_time || slot.slot_time }));
                        } else {
                          console.warn("Attempted to select booked slot:", slot.start_time || slot.slot_time);
                        }
                      }}
                      title={isBooked && slot.bookings?.length > 0 
                        ? `Booked: ${slot.bookings.map((b: any) => b.code).join(", ")}` 
                        : isBooked ? "Already booked" : "Available"
                      }
                      className={`p-2 border rounded text-xs transition-colors font-mono relative flex flex-col items-center justify-center ${
                        isBooked 
                          ? 'bg-wa-error/10 border-wa-error/40 text-wa-error/60 cursor-not-allowed line-through' 
                          : isSelected 
                            ? 'border-wa-green bg-wa-green/20 text-wa-green font-bold ring-1 ring-wa-green' 
                            : 'border-wa-text/20 hover:border-wa-green hover:text-wa-green bg-wa-surface'
                      }`}
                    >
                      <span>{timeDisplay}</span>
                      {isBooked && (
                        <span className="text-[8px] uppercase tracking-tighter mt-1 block absolute bottom-0 mb-1 opacity-70">
                          Booked
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-wa-green/20">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest opacity-70">Customer Name</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="bg-wa-bg border border-wa-text/20 p-2 rounded outline-none focus:border-wa-green"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest opacity-70">Phone (+20...)</label>
              <input
                type="text"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="01000000000"
                className="bg-wa-bg border border-wa-text/20 p-2 rounded outline-none focus:border-wa-green"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest opacity-70">Email (Optional)</label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                className="bg-wa-bg border border-wa-text/20 p-2 rounded outline-none focus:border-wa-green"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest opacity-70">Notes (Optional)</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-wa-bg border border-wa-text/20 p-2 rounded outline-none focus:border-wa-green"
              />
            </div>
          </div>

          <div className="bg-wa-green/5 p-4 rounded border border-wa-green/20 flex justify-between items-center mt-2">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-wa-text/60">Total Cost</span>
              <span className="font-bold text-wa-green text-xl">{total} EGP</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xs uppercase tracking-widest text-wa-text/60">Required Deposit</span>
              <span className="font-bold text-wa-text">{deposit} EGP</span>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-2">
            <WAButton type="button" variant="ghost" onClick={onClose}>
              CANCEL
            </WAButton>
            <WAButton 
              type="submit" 
              disabled={loading || !formData.startTime} 
              className="bg-wa-green text-wa-bg font-bold px-8 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "SAVING..." : "CONFIRM BOOKING"}
            </WAButton>
          </div>
        </form>
      </div>
    </div>

    {/* Success Modal */}
    {showSuccessModal && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
        <div className="bg-wa-bg border-2 border-wa-green p-8 max-w-md w-full rounded-xl shadow-2xl shadow-wa-green/20">
          <div className="text-center">
            <div className="w-16 h-16 bg-wa-green rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <svg className="w-10 h-10 text-wa-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-wa-green mb-2 tracking-widest uppercase">
              Booking Confirmed
            </h3>
            <p className="text-wa-text/80 uppercase text-sm tracking-widest">
              Reservation created successfully
            </p>
          </div>
        </div>
      </div>
    )}

    {/* Error Modal */}
    {showErrorModal && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
        <div className="bg-wa-bg border-2 border-wa-error p-8 max-w-md w-full rounded-xl shadow-2xl shadow-wa-error/20">
          <div className="text-center">
            <div className="w-16 h-16 bg-wa-error rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-wa-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-wa-error mb-2 tracking-widest uppercase">
              Booking Failed
            </h3>
            <p className="text-wa-text mb-4">
              {error}
            </p>
            {errorDetails && (
              <pre className="bg-black/50 border border-wa-text/10 p-3 rounded text-xs text-left overflow-auto mb-6 max-h-40 text-wa-text/80">
                {errorDetails}
              </pre>
            )}
            <WAButton
              type="button"
              onClick={() => {
                setShowErrorModal(false);
                setError(null);
                setErrorDetails("");
              }}
              className="bg-wa-error text-wa-bg font-bold w-full"
            >
              CLOSE
            </WAButton>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
