'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, AlertTriangle, CheckCircle2, DollarSign, Package, Plus, UserCheck } from 'lucide-react';
import { RefillModal } from './refill-modal';

interface ViewBookingModalProps {
  booking: any;
  onClose: () => void;
  onUpdate: () => void;
}

function DetailRow({ label, value, mono = false, highlight = false, status = false }: any) {
  let valueClass = "text-wa-text font-medium";
  if (mono) valueClass = "text-wa-text font-mono";
  if (highlight) valueClass = "text-wa-green font-bold font-mono text-lg";
  if (status) {
    valueClass = `font-bold uppercase tracking-widest ${
      value === 'confirmed' ? 'text-wa-green' :
      value === 'pending' ? 'text-yellow-500' :
      value === 'completed' ? 'text-blue-400' :
      value === 'no_show' ? 'text-wa-orange' :
      'text-wa-error'
    }`;
  }

  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-widest text-wa-text/40 mb-1">{label}</span>
      <span className={valueClass}>{value || 'N/A'}</span>
    </div>
  );
}

export function ViewBookingModal({ booking, onClose, onUpdate }: ViewBookingModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [staffOnShift, setStaffOnShift] = useState<any[]>([]);
  const [leadStaffId, setLeadStaffId] = useState<string>('');
  const [localBooking, setLocalBooking] = useState(booking);

  // ✅ CRITICAL: Use booking_code if id is missing
  const bookingIdentifier = booking?.id || booking?.booking_code;

  const refreshBooking = async () => {
    try {
      const res = await fetch(`/api/v1/admin/reservations/${bookingIdentifier}`);
      if (res.ok) {
        const data = await res.json();
        setLocalBooking(data);
        onUpdate(); // Also update parent list
      }
    } catch (err) {
      console.error('Failed to refresh booking:', err);
    }
  };

  useEffect(() => {
    setLocalBooking(booking);
  }, [booking]);

  useEffect(() => {
    if (localBooking?.booking_date) {
      fetchStaffOnShift();
    }
  }, [localBooking?.booking_date]);

  const fetchStaffOnShift = async () => {
    try {
      const res = await fetch(`/api/v1/admin/schedules/staff-on-date?date=${localBooking.booking_date}`);
      if (res.ok) {
        const data = await res.json();
        setStaffOnShift(data);
        // If only one person is on shift, auto-select them
        if (data.length === 1) {
          setLeadStaffId(data[0].staff_id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch staff on shift:', err);
    }
  };

  if (!booking || !bookingIdentifier) {
    if (booking) console.error('No booking identifier found!', booking);
    return null;
  }

  const handleAction = async (endpoint: string, method: string = 'POST', body: any = null) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/v1/admin/reservations/${bookingIdentifier}/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Action failed');
      }

      onUpdate();
      onClose();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDeposit = () => handleAction('confirm-deposit');
  
  const handleComplete = () => {
    const baseAmount = Number(localBooking.total_price_at_booking || localBooking.total_amount);
    const refillAmount = Number(localBooking.total_refill_cost || 0);
    const totalToCollect = baseAmount + refillAmount;
    const deposit = Number(localBooking.deposit_amount || 0);
    const remaining = totalToCollect - deposit;

    if (confirm(`Collect remaining ${remaining} EGP from customer? (Base: ${baseAmount} + Refills: ${refillAmount})`)) {
      handleAction('complete', 'POST', {
        final_amount_paid: totalToCollect,
        payment_method: 'cash',
        lead_staff_id: leadStaffId || null
      });
    }
  };

  const handleNoShow = () => {
    if (confirm('Mark this booking as NO SHOW? Deposit will be kept as penalty.')) {
      handleAction('no-show');
    }
  };

  const handleUndo = async () => {
    if (confirm('Are you sure you want to UNDO this booking? This will recalculate financials and payroll.')) {
      setIsProcessing(true);
      try {
        const res = await fetch(`/api/v1/admin/bookings/${bookingIdentifier}/undo`, {
          method: 'POST'
        });
        if (!res.ok) throw new Error('Failed to undo booking');
        onUpdate();
        onClose();
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 backdrop-blur-sm">
        <div className="bg-wa-bg border border-wa-green/50 w-full max-w-4xl relative shadow-2xl rounded-lg overflow-hidden flex flex-col max-h-[95vh]">
          {/* Header */}
          <div className="bg-wa-green/10 border-b border-wa-green/20 p-4 sm:p-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-wa-green font-heading uppercase tracking-widest">
                Mission Intel
              </h2>
              <p className="text-[10px] text-wa-text/40 uppercase tracking-tighter mt-1">Operational Data Retrieval</p>
            </div>
            <button onClick={onClose} className="text-wa-text/60 hover:text-wa-green transition-colors p-2 hover:bg-white/5 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-gradient-to-b from-wa-bg to-black/20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Left Column: Personnel & Mission Details */}
              <div className="space-y-8">
                <section>
                  <div className="flex items-center gap-3 border-b border-wa-green/10 pb-2 mb-4">
                    <div className="w-2 h-2 bg-wa-green rounded-full shadow-[0_0_8px_#00FF41]" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-wa-green/60">Registry Data</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailRow label="Mission Code" value={localBooking.booking_code} mono highlight />
                    <DetailRow label="Operational Status" value={localBooking.status} status />
                    <div className="col-span-2 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-widest text-wa-text/40">WhatsApp Confirmation</span>
                        <span className={`
                          text-[10px] px-2 py-0.5 font-mono font-bold
                          ${localBooking.whatsapp_confirmed
                            ? 'bg-wa-green/10 text-wa-green border border-wa-green/30'
                            : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                          }
                        `}>
                          {localBooking.whatsapp_confirmed ? '✓ CONFIRMED' : '⏳ PENDING'}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 border-b border-wa-green/10 pb-2 mb-4">
                    <div className="w-2 h-2 bg-wa-green rounded-full shadow-[0_0_8px_#00FF41]" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-wa-green/60">Personnel Info</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailRow label="Lead Operative" value={localBooking.customer_name} />
                    <DetailRow label="Comms Channel" value={localBooking.customer_phone} mono />
                    {localBooking.customer_email && (
                      <div className="sm:col-span-2">
                        <DetailRow label="Digital Address" value={localBooking.customer_email} mono />
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 border-b border-wa-green/10 pb-2 mb-4">
                    <div className="w-2 h-2 bg-wa-green rounded-full shadow-[0_0_8px_#00FF41]" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-wa-green/60">Deployment Parameters</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailRow label="Target Objective" value={localBooking.game_name || localBooking.games?.name_en} />
                    {localBooking.games?.slug?.includes('gel') ? (
                      <DetailRow 
                        label="Ammo Loadout" 
                        value={`${localBooking.ammo_package || (localBooking.duration_minutes === 60 ? 800 : 400)} Rounds/PAX`} 
                        highlight 
                      />
                    ) : (
                      <DetailRow label="Operational Window" value={`${localBooking.duration_minutes || 30} Minutes`} />
                    )}
                    {localBooking.special_missions?.name_en && (
                      <div className="sm:col-span-2">
                        <DetailRow label="Augmented Mission" value={localBooking.special_missions.name_en} highlight />
                      </div>
                    )}
                    <DetailRow label="Unit Strength" value={`${localBooking.player_count} Operatives`} />
                    <DetailRow label="Deployment Time" value={localBooking.start_time?.substring(0, 5)} mono />
                  </div>
                </section>

                {localBooking.customer_notes && (
                  <section>
                    <div className="flex items-center gap-3 border-b border-wa-green/10 pb-2 mb-4">
                      <div className="w-2 h-2 bg-wa-green rounded-full shadow-[0_0_8px_#00FF41]" />
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-wa-green/60">Intel Briefing</h3>
                    </div>
                    <div className="bg-wa-surface/20 p-3 rounded border border-wa-green/10 text-xs italic opacity-80">
                      {localBooking.customer_notes}
                    </div>
                  </section>
                )}
              </div>

              {/* Right Column: Financial & Logistics */}
              <div className="space-y-8">
                <section className="bg-wa-surface/30 border border-wa-green/20 p-6 rounded-lg space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <DollarSign className="w-24 h-24 rotate-12" />
                  </div>
                  
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-wa-green flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Financial Ledger
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs uppercase tracking-wider">
                      <span className="text-wa-text/40">Base Objective Cost:</span>
                      <span className="text-wa-text font-bold">{(localBooking.total_price_at_booking || localBooking.total_amount)} EGP</span>
                    </div>

                    {Number(localBooking.total_refill_cost) > 0 && (
                      <div className="flex justify-between items-center text-xs uppercase tracking-wider">
                        <span className="text-wa-text/40">Field Refills:</span>
                        <span className="text-wa-green font-bold">+{localBooking.total_refill_cost} EGP</span>
                      </div>
                    )}

                    {Number(localBooking.deposit_amount) > 0 && (
                      <div className="flex justify-between items-center text-xs uppercase tracking-wider">
                        <span className="text-wa-text/40">Security Deposit (PAID):</span>
                        <span className="text-wa-text font-bold">-{localBooking.deposit_amount} EGP</span>
                      </div>
                    )}

                    <div className="pt-4 border-t border-wa-green/20 flex justify-between items-center">
                      <span className="text-wa-green font-bold uppercase text-[10px] tracking-[0.2em]">Balance to Collect:</span>
                      <div className="flex flex-col items-end">
                        <span className="text-3xl font-bold text-wa-green font-mono drop-shadow-[0_0_10px_rgba(0,255,65,0.3)]">
                          {(Number(localBooking.total_price_at_booking || localBooking.total_amount) + Number(localBooking.total_refill_cost || 0)) - (Number(localBooking.deposit_amount) || 0)} <span className="text-xs">EGP</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Refill History if any */}
                {localBooking.refills && localBooking.refills.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 border-b border-wa-green/10 pb-2 mb-4">
                      <div className="w-2 h-2 bg-wa-green rounded-full shadow-[0_0_8px_#00FF41]" />
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-wa-green/60">Logistics History</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                      {localBooking.refills.map((refill: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] bg-wa-green/5 p-3 rounded border border-wa-green/10 group hover:border-wa-green/30 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-wa-text font-bold uppercase tracking-tighter flex items-center gap-2">
                              <Package className="w-3 h-3 text-wa-green/40" />
                              {refill.player_count} Units × {refill.ammo_per_player} Rounds
                            </span>
                            <span className="text-[8px] text-wa-text/40 uppercase font-mono mt-1">
                              {format(new Date(refill.created_at || new Date()), "HH:mm:ss")} • {refill.price_per_player} EGP UNIT PRICE
                            </span>
                          </div>
                          <span className="text-wa-green font-mono font-bold">+{refill.total_cost} EGP</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Lead Staff Selector for Commission */}
                {localBooking.status === 'confirmed' && (
                  <section className="bg-wa-orange/5 border border-wa-orange/20 p-4 rounded-lg">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-wa-orange mb-4 flex items-center gap-2">
                      <UserCheck className="w-4 h-4" /> Personnel Deployment Assignment
                    </h4>
                    
                    {staffOnShift.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-[9px] text-wa-text/40 font-mono uppercase leading-relaxed">Select operative responsible for mission execution and commission credit:</p>
                        <select
                          value={leadStaffId}
                          onChange={(e) => setLeadStaffId(e.target.value)}
                          className="w-full bg-wa-bg border border-wa-orange/30 p-3 text-wa-text text-xs rounded outline-none focus:border-wa-orange appearance-none cursor-pointer"
                        >
                          <option value="">-- NO PERSONNEL ASSIGNED --</option>
                          {staffOnShift.map((s) => (
                            <option key={s.staff_id} value={s.staff_id}>
                              {s.full_name.toUpperCase()} (STATION: {s.time})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="text-wa-orange text-[9px] uppercase font-mono bg-wa-orange/10 p-3 border border-wa-orange/30 rounded flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>No personnel schedules detected for current deployment date. Financial commission recording is disabled.</span>
                      </div>
                    )}
                  </section>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-6 border-t border-wa-green/20 bg-wa-bg/80 backdrop-blur-md z-10 flex flex-col sm:flex-row items-center gap-4">
            {localBooking.status === 'pending' && (
              <button
                onClick={handleConfirmDeposit}
                disabled={isProcessing}
                className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(22,163,74,0.3)]"
              >
                <CheckCircle2 className="w-4 h-4" /> VERIFY DEPOSIT
              </button>
            )}

            {localBooking.status === 'confirmed' && (
              <div className="flex flex-col sm:flex-row w-full gap-4">
                <button
                  onClick={handleComplete}
                  disabled={isProcessing}
                  className="w-full sm:flex-[2] bg-wa-green hover:bg-wa-green/90 text-wa-bg font-bold py-3 px-6 rounded uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,65,0.3)]"
                >
                  COMPLETE MISSION & COLLECT
                </button>
                
                {localBooking.games?.slug?.includes('gel') && (
                  <button
                    onClick={() => setShowRefillModal(true)}
                    disabled={isProcessing}
                    className="w-full sm:flex-1 bg-wa-surface border border-wa-green/30 text-wa-green hover:bg-wa-green/10 font-bold py-3 px-6 rounded uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> REFILL
                  </button>
                )}

                <button
                  onClick={handleNoShow}
                  disabled={isProcessing}
                  className="w-full sm:flex-1 border border-wa-orange text-wa-orange hover:bg-wa-orange/10 font-bold py-3 px-6 rounded uppercase tracking-[0.2em] text-[10px] transition-all"
                >
                  NO SHOW
                </button>
              </div>
            )}

            {localBooking.status === 'completed' && (
              <button
                onClick={handleUndo}
                disabled={isProcessing}
                className="w-full sm:w-auto px-6 py-3 border border-wa-orange text-wa-orange hover:bg-wa-orange/10 font-bold rounded uppercase tracking-[0.2em] text-[10px] transition-all"
              >
                UNDO COMPLETION
              </button>
            )}

            {['pending', 'confirmed'].includes(localBooking.status) && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={isProcessing}
                className="w-full sm:w-auto px-6 py-3 border border-wa-error text-wa-error hover:bg-wa-error/10 font-bold rounded uppercase tracking-[0.2em] text-[10px] transition-all"
              >
                CANCEL
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full sm:w-auto sm:ml-auto px-8 py-3 border border-wa-text/20 text-wa-text/40 hover:text-wa-text hover:bg-wa-text/5 font-bold rounded uppercase tracking-[0.2em] text-[10px] transition-all"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <CancelWithRefundModal
          booking={localBooking}
          onClose={() => setShowCancelModal(false)}
          onSuccess={() => {
            setShowCancelModal(false);
            refreshBooking();
          }}
        />
      )}
      {showRefillModal && (
        <RefillModal
          isOpen={showRefillModal}
          onClose={() => setShowRefillModal(false)}
          bookingId={localBooking.id}
          bookingCode={localBooking.booking_code}
          playerCount={localBooking.player_count}
          onSuccess={() => {
            refreshBooking();
          }}
        />
      )}
    </>
  );
}

function CancelWithRefundModal({ booking, onClose, onSuccess }: any) {
  const [reason, setReason] = useState('Customer Request');
  const [notes, setNotes] = useState('');
  const [refundDeposit, setRefundDeposit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/admin/reservations/${booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, notes, refund_deposit: refundDeposit }),
      });

      if (!response.ok) throw new Error('Failed to cancel booking');
      onSuccess();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4">
      <div className="bg-wa-bg border-2 border-wa-error p-8 max-w-md w-full rounded-lg shadow-2xl">
        <div className="flex items-center gap-3 mb-6 text-wa-error">
          <AlertTriangle className="w-8 h-8" />
          <h3 className="text-xl font-bold uppercase tracking-widest font-heading">Cancel Booking</h3>
        </div>
        
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-wa-text/40 mb-2">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-wa-surface border border-wa-green/20 p-3 text-wa-text rounded outline-none focus:border-wa-green transition-colors"
            >
              <option value="Customer Request">Customer Request</option>
              <option value="No Deposit Received">No Deposit Received</option>
              <option value="Weather">Weather</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-wa-text/40 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-wa-surface border border-wa-green/20 p-3 text-wa-text resize-none rounded outline-none focus:border-wa-green transition-colors"
              placeholder="Internal notes..."
            />
          </div>

          <div className="bg-wa-surface/50 border border-wa-green/20 p-4 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={refundDeposit}
                onChange={(e) => setRefundDeposit(e.target.checked)}
                className="w-5 h-5 rounded border-wa-green text-wa-green focus:ring-wa-green bg-wa-bg"
              />
              <div>
                <div className="text-wa-text font-bold text-sm">Refund Deposit ({booking.deposit_amount || 0} EGP)</div>
                <div className="text-[10px] text-wa-text/60 leading-tight mt-0.5">
                  {refundDeposit 
                    ? '✅ Deposit will be returned to customer (Revenue = 0)' 
                    : '❌ Keep deposit as cancellation penalty (Revenue = Deposit)'}
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 border border-wa-text/20 text-wa-text/60 hover:text-wa-text hover:bg-wa-text/5 font-bold rounded uppercase tracking-widest text-sm transition-all"
          >
            Abort
          </button>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-wa-error text-white font-bold rounded uppercase tracking-widest text-sm hover:bg-wa-error/90 transition-all"
          >
            {isSubmitting ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
