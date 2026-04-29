'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { X, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';

interface ViewBookingModalProps {
  booking: any;
  onClose: () => void;
  onUpdate: () => void;
}

export function ViewBookingModal({ booking, onClose, onUpdate }: ViewBookingModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ✅ CRITICAL: Use booking_code if id is missing
  const bookingIdentifier = booking?.id || booking?.booking_code;

  if (!booking || !bookingIdentifier) {
    if (booking) console.error('No booking identifier found!', booking);
    return null;
  }

  const handleAction = async (endpoint: string, method: string = 'POST', body: any = null) => {
    setIsProcessing(true);
    try {
      console.log(`=== ${endpoint.toUpperCase()} ===`);
      console.log('Identifier:', bookingIdentifier);

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
    const remaining = (booking.total_price_at_booking || booking.total_amount) - (booking.deposit_amount || 0);
    if (confirm(`Collect remaining ${remaining} EGP from customer?`)) {
      handleAction('complete', 'POST', {
        final_amount_paid: (booking.total_price_at_booking || booking.total_amount),
        payment_method: 'cash'
      });
    }
  };

  const handleNoShow = () => {
    if (confirm('Mark this booking as NO SHOW? Deposit will be kept as penalty.')) {
      handleAction('no-show');
    }
  };

  // ✅ CRITICAL: Safe date formatting
  const formatBookingDateTime = () => {
    try {
      if (!booking.booking_date || !booking.start_time) return 'N/A';
      
      const dateStr = typeof booking.booking_date === 'string' ? booking.booking_date : booking.booking_date.toString();
      const timeStr = typeof booking.start_time === 'string' ? booking.start_time : booking.start_time.toString();

      // Combine date and time
      const dateTime = new Date(`${dateStr}T${timeStr}`);

      if (isNaN(dateTime.getTime())) {
        return `${dateStr} at ${timeStr}`;
      }

      return format(dateTime, "EEEE, MMMM dd, yyyy 'at' h:mm a");
    } catch (error) {
      console.error('Date formatting error:', error, booking);
      if (booking.booking_date && booking.start_time) {
        return `${booking.booking_date} at ${booking.start_time}`;
      }
      return 'N/A';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="bg-wa-bg border-2 border-wa-green w-full max-w-2xl relative shadow-2xl rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-wa-green/10 border-b border-wa-green/20 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-wa-green font-heading uppercase tracking-widest">
            Booking Details
          </h2>
          <button onClick={onClose} className="text-wa-text/60 hover:text-wa-green transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Info Section */}
            <div className="space-y-4">
              <DetailRow label="Booking Code" value={booking.booking_code} mono highlight />
              <DetailRow label="Status" value={booking.status} status />
              <DetailRow label="Customer" value={booking.customer_name} />
              <DetailRow label="Phone" value={booking.customer_phone} mono />
              <DetailRow label="Game" value={booking.game_name || booking.games?.name_en} />
              <DetailRow label="Game Time" value={`${booking.duration_minutes || 30} min`} />
            </div>

            {/* Financial Section */}
            <div className="bg-wa-surface/30 border border-wa-green/10 p-6 rounded-lg space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-wa-green mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Financial Summary
              </h3>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-wa-text/60">Total Amount:</span>
                <span className="text-wa-text font-bold">{(booking.total_price_at_booking || booking.total_amount)} EGP</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-wa-text/60">Deposit (25%):</span>
                <span className="text-wa-text font-bold">{booking.deposit_amount || 0} EGP</span>
              </div>

              <div className="pt-4 border-t border-wa-green/10 flex justify-between items-center">
                <span className="text-wa-green font-bold uppercase text-xs tracking-widest">Balance Due:</span>
                <span className="text-2xl font-bold text-wa-green">
                  {(booking.total_price_at_booking || booking.total_amount) - (booking.deposit_amount || 0)} EGP
                </span>
              </div>

              <div className="mt-4 p-3 bg-wa-bg rounded border border-wa-green/20">
                <span className="text-[10px] uppercase tracking-widest text-wa-text/40 block mb-1">Deposit Status</span>
                <span className={`text-xs font-bold uppercase tracking-widest ${
                  booking.deposit_status === 'paid' ? 'text-wa-green' :
                  booking.deposit_status === 'refunded' ? 'text-blue-400' :
                  booking.deposit_status === 'forfeited' ? 'text-wa-orange' :
                  'text-yellow-500'
                }`}>
                  {booking.deposit_status || 'PENDING'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Area */}
          <div className="mt-10 pt-6 border-t border-wa-green/20 flex flex-wrap gap-4">
            {booking.status === 'pending' && (
              <button
                onClick={handleConfirmDeposit}
                disabled={isProcessing}
                className="flex-1 min-w-[200px] bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> Confirm Deposit Received
              </button>
            )}

            {booking.status === 'confirmed' && (
              <>
                <button
                  onClick={handleComplete}
                  disabled={isProcessing}
                  className="flex-1 min-w-[200px] bg-wa-green hover:bg-wa-green/90 text-wa-bg font-bold py-3 px-6 rounded uppercase tracking-widest text-sm transition-all"
                >
                  Completed (Collect Payment)
                </button>
                <button
                  onClick={handleNoShow}
                  disabled={isProcessing}
                  className="flex-1 min-w-[200px] border border-wa-orange text-wa-orange hover:bg-wa-orange/10 font-bold py-3 px-6 rounded uppercase tracking-widest text-sm transition-all"
                >
                  Mark No Show
                </button>
              </>
            )}

            {['pending', 'confirmed'].includes(booking.status) && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={isProcessing}
                className="px-6 py-3 border border-wa-error text-wa-error hover:bg-wa-error/10 font-bold rounded uppercase tracking-widest text-sm transition-all"
              >
                Cancel
              </button>
            )}

            <button
              onClick={onClose}
              className="ml-auto px-8 py-3 border border-wa-text/20 text-wa-text/60 hover:text-wa-text hover:bg-wa-text/5 font-bold rounded uppercase tracking-widest text-sm transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <CancelWithRefundModal
          booking={booking}
          onClose={() => setShowCancelModal(false)}
          onSuccess={() => {
            setShowCancelModal(false);
            onUpdate();
            onClose();
          }}
        />
      )}
    </div>
  );
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
