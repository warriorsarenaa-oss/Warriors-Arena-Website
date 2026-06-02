"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { WAButton } from "@/components/UI/WAButton";

interface CancelDialogProps {
  booking: any;
  onClose: () => void;
  onSuccess: () => void;
}

const REASONS = [
  { value: "customer_request", label: "Customer Request" },
  { value: "no_deposit_received", label: "No Deposit Received" },
  { value: "customer_no_show", label: "Customer No-Show" },
  { value: "venue_issue", label: "Venue/Equipment Issue" },
  { value: "staff_error", label: "Staff Error" },
  { value: "other", label: "Other" }
];

export function CancelDialog({ booking, onClose, onSuccess }: CancelDialogProps) {
  const [reason, setReason] = useState(REASONS[0].value);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason === "other" && (!note || note.trim() === "")) {
      setError("Note is required when selecting 'Other'");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const identifier = booking.booking_code || booking.id;
      const payload = { reason, note };
      
      console.log('=== INITIATING CANCELLATION ===');
      console.log('Identifier:', identifier);
      console.log('Payload:', payload);
      
      const res = await fetch(`/api/v1/admin/reservations/${identifier}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log('Response Status:', res.status);
      const data = await res.json();
      console.log('Response Data:', data);

      if (!res.ok) {
        throw new Error(data.details || data.message || data.error || "Failed to cancel booking");
      }

      console.log('✅ Cancellation successful');
      onSuccess();
    } catch (err: any) {
      console.error('❌ CANCELLATION FAILED:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-wa-bg border border-wa-error/50 p-6 rounded-lg max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-wa-text/50 hover:text-wa-text">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 text-wa-error">
          <AlertTriangle className="w-8 h-8" />
          <h2 className="text-xl font-bold uppercase tracking-widest font-heading">
            Cancel Booking
          </h2>
        </div>

        <p className="text-sm mb-4">
          You are cancelling booking <span className="font-bold text-wa-error">{booking.booking_code}</span> for {booking.customer_name}.
        </p>

        <form onSubmit={handleCancel} className="flex flex-col gap-4">
          {error && (
            <div className="bg-wa-error/10 border border-wa-error text-wa-error p-3 text-xs">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest opacity-70">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-wa-bg border border-wa-text/20 p-3 rounded outline-none focus:border-wa-error transition-colors"
              required
            >
              {REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest opacity-70">
              Note {reason === "other" && <span className="text-wa-error">*</span>}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-wa-bg border border-wa-text/20 p-3 rounded outline-none focus:border-wa-error transition-colors resize-none h-24"
              placeholder="Provide additional details..."
              maxLength={500}
              required={reason === "other"}
            />
          </div>

          <div className="mt-4 border-t border-wa-error/20 pt-4">
            <p className="text-xs text-wa-error/80 uppercase mb-4 tracking-widest font-bold text-center">
              This will release the slot immediately. Proceed?
            </p>
            <div className="flex gap-4">
              <WAButton type="button" variant="ghost" onClick={onClose} className="flex-1">
                ABORT
              </WAButton>
              <WAButton type="submit" disabled={loading} className="flex-1 bg-wa-error text-white font-bold">
                {loading ? "PROCESSING..." : "CONFIRM CANCEL"}
              </WAButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
