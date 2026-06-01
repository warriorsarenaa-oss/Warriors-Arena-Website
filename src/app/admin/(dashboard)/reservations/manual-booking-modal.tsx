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
    specialMissionId: "",
    discountType: "percentage" as "percentage" | "flat",
    discountValue: 0,
  });

  const [games, setGames] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]); // ✅ Always initialize as array
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // ✅ Fetch Games on mount
  useEffect(() => {
    async function fetchGames() {
      try {
        const res = await fetch("/api/v1/games?locale=en&active=all");
        const data = await res.json();
        const gamesArray = Array.isArray(data) ? data : [];
        setGames(gamesArray);
      } catch (err) {
        console.error("Failed to load games", err);
      }
    }
    
    fetchGames();

    fetch("/api/v1/missions")
      .then(res => res.json())
      .then(data => setMissions(Array.isArray(data) ? data : []))
      .catch(err => console.error("Failed to load missions", err));
  }, []);

  // ✅ New: Filter games based on date availability
  const [availableGames, setAvailableGames] = useState<any[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);

  useEffect(() => {
    if (!formData.date || games.length === 0) {
      setAvailableGames(games);
      return;
    }

    async function checkAvailability() {
      setLoadingGames(true);
      try {
        const res = await fetch(`/api/v1/availability/games?date=${formData.date}&admin=true`);
        if (res.ok) {
          const availabilityData = await res.json();
          // availabilityData is [{ game_id, is_available }]
          const filtered = games.map(game => {
            const avail = availabilityData.find((a: any) => a.game_id === game.id);
            return {
              ...game,
              is_restricted: avail ? !avail.is_available : false
            };
          });
          setAvailableGames(filtered);
          
          // If current game becomes restricted, select the first unrestricted one
          const currentGame = filtered.find(g => g.id === formData.gameId);
          if (currentGame?.is_restricted) {
            const firstValid = filtered.find(g => !g.is_restricted);
            if (firstValid) setFormData(prev => ({ ...prev, gameId: firstValid.id }));
          } else if (!formData.gameId && filtered.length > 0) {
             const firstValid = filtered.find(g => !g.is_restricted) || filtered[0];
             setFormData(prev => ({ ...prev, gameId: firstValid.id }));
          }
        }
      } catch (err) {
        console.error("Failed to check game availability", err);
        setAvailableGames(games);
      } finally {
        setLoadingGames(false);
      }
    }

    checkAvailability();
  }, [formData.date, games]);

  // ✅ Fetch slots when date or duration changes
  useEffect(() => {
    if (!formData.gameId || !formData.date || !formData.duration) return;
    
    setLoadingSlots(true);
    setAvailableSlots([]);

    const fetchSlots = async () => {
      try {
        // ✅ Pass admin=true to see today's past slots
        const response = await fetch(`/api/v1/availability?date=${formData.date}&duration_minutes=${formData.duration}&admin=true&game_id=${formData.gameId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        
        // Handle both old array format and new object format safely
        const slotsArray = Array.isArray(data) ? data : (Array.isArray(data?.slots) ? data.slots : []);
        
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
    setError(null);
    setFormData({ ...formData, date: dateStr, startTime: "" });
  };

  // ✅ Safe pricing calculation
  const calculatePricing = () => {
    if (!games || games.length === 0 || !formData.gameId) {
      return { pricePerPlayer: 0, subtotal: 0, discountAmount: 0, total: 0 };
    }

    const game = games.find(g => g.id === formData.gameId);
    // ✅ Fix: use 'pricing' as returned by public API
    const pricingData = game?.pricing || game?.game_pricing;
    if (!game || !pricingData) return { pricePerPlayer: 0, subtotal: 0, discountAmount: 0, total: 0 };

    const pricingTier = pricingData.find((p: any) => p.duration_minutes === formData.duration);
    if (!pricingTier) return { pricePerPlayer: 0, subtotal: 0, discountAmount: 0, total: 0 };

    const pricePerPlayer = pricingTier.price_per_player || 0;
    
    // Mission Price
    let missionPrice = 0;
    if (formData.specialMissionId) {
      const mission = missions.find(m => m.id === formData.specialMissionId);
      missionPrice = parseFloat(mission?.additional_price_per_player) || 0;
    }

    const subtotal = (pricePerPlayer + missionPrice) * (formData.playerCount || 0);
    
    let discountAmount = 0;
    if (formData.discountValue > 0) {
      if (formData.discountType === "percentage") {
        discountAmount = subtotal * (formData.discountValue / 100);
      } else {
        discountAmount = formData.discountValue;
      }
    }
    
    const total = Math.max(subtotal - discountAmount, 0);

    return { pricePerPlayer, subtotal, discountAmount, total };
  };

  const { pricePerPlayer, subtotal, discountAmount, total } = calculatePricing();

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
    
    const selectedGame = availableGames.find(g => g.id === formData.gameId);
    if (selectedGame?.is_restricted) {
      setError("This game is not available on the selected date.");
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
        special_mission_id: formData.specialMissionId || null,
        discount_type: formData.discountValue > 0 ? formData.discountType : null,
        discount_value: formData.discountValue > 0 ? formData.discountValue : 0,
        discount_amount: discountAmount,
        total_price_at_booking: subtotal // Maintain original pre-discount price
      };

      const res = await fetch("/api/v1/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}`);
      }

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
      setError("Failed to create booking");
      setErrorDetails(err.message || "Unknown error");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-wa-bg border border-wa-green/50 rounded-lg max-w-4xl w-full relative max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-wa-green/20 flex justify-between items-center bg-wa-bg/50 backdrop-blur-md z-10">
            <div>
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-widest font-heading text-wa-green">
                New Manual Booking
              </h2>
              <p className="text-[10px] text-wa-text/40 uppercase tracking-tighter mt-1">Admin Override Protocol</p>
            </div>
            <button onClick={onClose} className="text-wa-text/50 hover:text-wa-text transition-colors p-2 hover:bg-white/5 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-gradient-to-b from-wa-bg to-black/20">
            <form id="manual-booking-form" onSubmit={handleSubmit} className="flex flex-col gap-8">
              {error && !showErrorModal && (
                <div className="bg-wa-error/10 border border-wa-error text-wa-error p-4 rounded text-sm flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-widest">
                    <AlertCircle className="w-4 h-4" /> System Alert
                  </div>
                  <p>{error}</p>
                  {errorDetails && <pre className="text-[10px] opacity-60 mt-2 bg-black/40 p-2 rounded overflow-auto">{errorDetails}</pre>}
                </div>
              )}

              {/* 1. Session Parameters */}
              <section className="flex flex-col gap-6">
                <div className="flex items-center gap-3 border-b border-wa-green/10 pb-2">
                  <div className="w-2 h-2 bg-wa-green rounded-full shadow-[0_0_8px_#00FF41]" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-wa-green">Session Parameters</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest opacity-70 font-bold text-wa-green/60">
                      Target Game {loadingGames && <Loader2 className="inline w-3 h-3 animate-spin ml-2" />}
                    </label>
                    <select
                      value={formData.gameId}
                      onChange={(e) => setFormData({ ...formData, gameId: e.target.value })}
                      className="bg-wa-bg border border-wa-green/20 p-3 text-base rounded outline-none focus:border-wa-green appearance-none cursor-pointer"
                      required
                    >
                      {availableGames.map(g => (
                        <option key={g.id} value={g.id} disabled={g.is_restricted}>
                          {g.name_en} {g.is_restricted ? "(RESTRICTED)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest opacity-70 font-bold text-wa-green/60">Deployment Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="bg-wa-bg border border-wa-green/20 p-3 text-base rounded outline-none focus:border-wa-green text-wa-green font-mono [color-scheme:dark] cursor-pointer"
                      required
                    />
                    {formData.date < format(new Date(), "yyyy-MM-dd") && (
                      <span className="text-[10px] text-wa-orange/70 mt-[-4px]">
                        ⚠ HISTORICAL DATE — bookings will be logged with past date
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest opacity-70 font-bold text-wa-green/60">Operational Tier</label>
                    <select
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                      className="bg-wa-bg border border-wa-green/20 p-3 text-base rounded outline-none focus:border-wa-green font-mono uppercase appearance-none cursor-pointer"
                    >
                      {(() => {
                        const game = games.find(g => g.id === formData.gameId);
                        const pricing = game?.pricing || game?.game_pricing || [];
                        if (pricing.length === 0) {
                          return (
                            <>
                              <option value={30}>30 MINUTES</option>
                              <option value={60}>60 MINUTES</option>
                            </>
                          );
                        }
                        return pricing.map((p: any) => (
                          <option key={p.duration_minutes} value={p.duration_minutes}>
                            {p.pricing_type === 'ammo' 
                              ? `${p.ammo_count} ROUNDS (${p.duration_minutes_display || 'N/A'})` 
                              : `${p.duration_minutes} MINUTES`
                            }
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest opacity-70 font-bold text-wa-green/60">Personnel Count</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        value={formData.playerCount || ""}
                        onChange={(e) => setFormData({ ...formData, playerCount: parseInt(e.target.value) || 0 })}
                        min={1}
                        max={100}
                        className="bg-wa-bg border border-wa-green/20 p-3 rounded outline-none focus:border-wa-green flex-1 font-mono text-wa-green text-lg"
                        required
                      />
                      {formData.playerCount > (availableGames.find(g => g.id === formData.gameId)?.max_players ?? 6) && (
                        <div className="flex items-center gap-1 text-[10px] text-wa-orange animate-pulse">
                          <AlertCircle className="w-3 h-3" /> OVERRIDE ACTIVE
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest opacity-70 font-bold text-wa-green/60">Special Mission Augmentation</label>
                    <select
                      value={formData.specialMissionId}
                      onChange={(e) => setFormData({ ...formData, specialMissionId: e.target.value })}
                      className="bg-wa-bg border border-wa-green/20 p-3 text-base rounded outline-none focus:border-wa-green appearance-none cursor-pointer"
                    >
                      <option value="">Standard Mission Protocol (No Augmentation)</option>
                      {missions
                        .filter(m => !m.compatible_games || m.compatible_games.length === 0 || m.compatible_games.includes(formData.gameId))
                        .map(m => (
                          <option key={m.id} value={m.id}>{m.name_en} (+{m.additional_price_per_player} EGP / PAX)</option>
                        ))
                      }
                    </select>
                  </div>
                </div>
              </section>

              {/* 2. Slot Selection Section */}
              <section className="flex flex-col gap-6">
                <div className="flex items-center gap-3 border-b border-wa-green/10 pb-2">
                  <div className="w-2 h-2 bg-wa-green rounded-full shadow-[0_0_8px_#00FF41]" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-wa-green">Timeline Assignment</h3>
                </div>

                {loadingSlots ? (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-wa-green/10 rounded">
                    <div className="flex items-center gap-3 text-wa-green/50 font-mono text-xs animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" /> SCANNING TEMPORAL SLOTS...
                    </div>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-wa-error/20 bg-wa-error/5 rounded flex flex-col items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-wa-error opacity-50" />
                    <p className="text-xs text-wa-error font-bold uppercase tracking-widest">No Operational Slots Available</p>
                    <p className="text-[10px] text-wa-text/40">Try adjusting the date or duration parameters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {availableSlots.map((slot: any, index: number) => {
                      const timeDisplay = (slot.start_time || slot.slot_time || "??:??").substring(0, 5);
                      // Block if the slot itself is booked OR if it's a 60min game but the next 30min block is unavailable
                      const isUnavailableForDuration = formData.duration === 60 ? slot.available_60 === false : (slot.is_booked === true || slot.available_30 === false);
                      const isBooked = slot.is_booked === true || isUnavailableForDuration;
                      const isSelected = formData.startTime === (slot.start_time || slot.slot_time);

                      return (
                        <button
                          key={`${slot.start_time || slot.slot_time}-${index}`}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setFormData(prev => ({ ...prev, startTime: slot.start_time || slot.slot_time }))}
                          className={`group h-14 border rounded text-[10px] transition-all font-mono relative flex flex-col items-center justify-center ${
                            isBooked 
                              ? 'bg-wa-error/5 border-wa-error/20 text-wa-error/40 cursor-not-allowed' 
                              : isSelected 
                                ? 'border-wa-green bg-wa-green/20 text-wa-green font-bold shadow-[0_0_15px_rgba(0,255,65,0.2)]' 
                                : 'border-wa-green/10 hover:border-wa-green/40 hover:bg-wa-green/5 text-wa-text/60'
                          }`}
                        >
                          <span className="text-sm">{timeDisplay}</span>
                          {isBooked && (
                            <span className="text-[7px] uppercase tracking-tighter mt-1 opacity-60">BOOKED</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* 3. Customer Intel Section */}
              <section className="flex flex-col gap-6">
                <div className="flex items-center gap-3 border-b border-wa-green/10 pb-2">
                  <div className="w-2 h-2 bg-wa-green rounded-full shadow-[0_0_8px_#00FF41]" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-wa-green">Customer Intel</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest opacity-70 font-bold text-wa-green/60">Full Name</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="bg-wa-bg border border-wa-green/20 p-3 text-base rounded outline-none focus:border-wa-green placeholder:opacity-20"
                      placeholder="e.g. John Wick"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest opacity-70 font-bold text-wa-green/60">Comms (Phone)</label>
                    <input
                      type="text"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      placeholder="01xxxxxxxxx"
                      className="bg-wa-bg border border-wa-green/20 p-3 text-base rounded outline-none focus:border-wa-green font-mono"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest opacity-70 font-bold text-wa-green/60">Digital Address (Email)</label>
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      className="bg-wa-bg border border-wa-green/20 p-3 text-base rounded outline-none focus:border-wa-green placeholder:opacity-20"
                      placeholder="optional@intel.com"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest opacity-70 font-bold text-wa-green/60">Operational Notes</label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="bg-wa-bg border border-wa-green/20 p-3 text-base rounded outline-none focus:border-wa-green placeholder:opacity-20"
                      placeholder="Any specific mission requests..."
                    />
                  </div>
                </div>
                {/* DISCOUNT INPUT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest opacity-70 font-bold text-wa-green/60">Discount Type</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as "percentage" | "flat" })}
                      className="bg-wa-bg border border-wa-green/20 p-3 text-base rounded outline-none focus:border-wa-green appearance-none cursor-pointer"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (EGP)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest opacity-70 font-bold text-wa-green/60">Discount Value</label>
                    <input
                      type="number"
                      value={formData.discountValue === 0 ? "" : formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                      min="0"
                      max={formData.discountType === "percentage" ? "100" : undefined}
                      className="bg-wa-bg border border-wa-green/20 p-3 text-base rounded outline-none focus:border-wa-green placeholder:opacity-20 font-mono"
                      placeholder="0"
                    />
                  </div>
                </div>
              </section>

              {/* 4. Financial Summary */}
              <div className="bg-wa-green/5 p-6 rounded-lg border border-wa-green/30 flex flex-col items-center justify-center backdrop-blur-sm mt-4 gap-2">
                {discountAmount > 0 && (
                  <div className="flex justify-between w-full max-w-xs text-[10px] uppercase font-mono opacity-60">
                    <span>Subtotal:</span>
                    <span>{subtotal} EGP</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between w-full max-w-xs text-[10px] uppercase font-mono text-wa-orange mb-2">
                    <span>Discount Applied:</span>
                    <span>-{discountAmount} EGP</span>
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-wa-green/60 font-bold mb-1">Total Mission Investment</span>
                  <span className="font-bold text-wa-green text-3xl font-mono shadow-wa-green/20 drop-shadow-lg">{total} <span className="text-sm">EGP</span></span>
                </div>
              </div>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-6 border-t border-wa-green/20 bg-wa-bg/80 backdrop-blur-md z-10 flex flex-col sm:flex-row justify-end items-center gap-4">
            <WAButton type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto text-[10px]">ABORT</WAButton>
            <WAButton 
              type="submit" 
              form="manual-booking-form"
              disabled={loading || !formData.startTime} 
              className="bg-wa-green text-wa-bg font-bold w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,65,0.2)] hover:shadow-[0_0_30px_rgba(0,255,65,0.4)] text-[10px] tracking-[0.2em]"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "TRANSMITTING..." : "CONFIRM MISSION"}
            </WAButton>
          </div>
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
