"use client";

import { useState } from "react";
import { X, DollarSign, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";
import { roundEGP, formatEGP } from "@/lib/utils/format";

type ModalState = "enter_amount" | "underpayment" | "exact" | "overpayment";

interface Props {
  staffPayroll: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecordPaymentModal({ staffPayroll, onClose, onSuccess }: Props) {
  const [modalState, setModalState] = useState<ModalState>("enter_amount");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const due      = roundEGP(Number(staffPayroll.remaining_balance));
  const entered  = roundEGP(parseFloat(amount) || 0);
  const diff     = roundEGP(entered - due);
  const shortfall = roundEGP(due - entered);
  const overage  = roundEGP(entered - due);

  const handleContinue = () => {
    setError(null);
    const raw = parseFloat(amount);
    if (isNaN(raw) || raw <= 0) {
      setError("Enter an amount greater than 0 EGP.");
      return;
    }
    if (diff < -0.01) {
      setModalState("underpayment");
    } else if (diff > 0.01) {
      if (!notes.trim()) setNotes(`Overpayment of ${formatEGP(overage)} EGP recorded`);
      setModalState("overpayment");
    } else {
      setModalState("exact");
    }
  };

  const handleConfirm = async (action: "keep" | "forgive" | "credit") => {
    setIsSubmitting(true);
    setError(null);

    const defaultNotes =
      action === "forgive"
        ? `Shortfall of ${formatEGP(shortfall)} EGP written off`
        : action === "credit"
        ? `Overpayment of ${formatEGP(overage)} EGP recorded`
        : "Weekly payroll payment";

    try {
      const res = await fetch("/api/v1/admin/staff/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payroll_record_id: staffPayroll.id,
          amount_paid: entered,
          payment_method: "cash",
          notes: notes.trim() || defaultNotes,
          remaining_action: action,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Payment failed");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("[RECORD_PAYMENT_ERROR]", err);
      setError(err.message || "Payment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <WAPanel className="max-w-md w-full p-8 border-wa-green/30 relative shadow-2xl shadow-wa-green/10">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-6 right-6 opacity-50 hover:opacity-100 transition-opacity disabled:opacity-20"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-wa-green/10 rounded border border-wa-green/20">
            <DollarSign className="w-6 h-6 text-wa-green" />
          </div>
          <div>
            <h3 className="font-bold uppercase tracking-widest text-wa-green">Record Payment</h3>
            <p className="text-[10px] opacity-50 uppercase tracking-widest font-mono">
              For {staffPayroll.staff.full_name}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-mono">
            {error}
          </div>
        )}

        {/* STATE 1 — Enter Amount */}
        {modalState === "enter_amount" && (
          <div className="flex flex-col gap-6">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 font-mono">
              <div className="text-[10px] uppercase opacity-50 mb-1 tracking-widest">Amount Due</div>
              <div className="text-2xl font-bold text-wa-green">{formatEGP(due)} EGP</div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest">
                How much are you paying? (EGP)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleContinue(); }}
                placeholder="0.00"
                className="bg-transparent border border-wa-green/30 rounded-xl p-4 text-2xl font-mono text-wa-green outline-none focus:border-wa-green placeholder:text-wa-text/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Cash handed by Admin"
                className="bg-transparent border border-wa-green/30 rounded-xl p-4 text-sm font-mono outline-none focus:border-wa-green"
              />
            </div>

            <div className="flex gap-4 mt-2">
              <WAButton
                type="button"
                variant="ghost"
                onClick={onClose}
                className="flex-1 border-wa-text/20"
              >
                CANCEL
              </WAButton>
              <WAButton
                type="button"
                onClick={handleContinue}
                className="flex-1 bg-wa-green text-black font-bold"
              >
                CONTINUE →
              </WAButton>
            </div>
          </div>
        )}

        {/* STATE 2A — Underpayment */}
        {modalState === "underpayment" && (
          <div className="flex flex-col gap-6">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 font-mono text-sm flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="opacity-50">Paying</span>
                <span className="font-bold text-wa-green">{formatEGP(entered)} EGP</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-50">Amount Due</span>
                <span className="font-bold">{formatEGP(due)} EGP</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between">
                <span className="opacity-50">Remaining</span>
                <span className="font-bold text-wa-orange">{formatEGP(shortfall)} EGP</span>
              </div>
            </div>

            <div className="text-[10px] uppercase tracking-widest opacity-50 font-bold">
              Remaining {formatEGP(shortfall)} EGP — what should happen?
            </div>

            <div className="flex flex-col gap-3">
              <WAButton
                type="button"
                onClick={() => handleConfirm("keep")}
                disabled={isSubmitting}
                className="w-full bg-wa-green text-black font-bold flex flex-col items-start gap-0.5 px-5 py-4 h-auto"
              >
                <span className="text-sm uppercase tracking-wider">Keep in balance</span>
                <span className="text-[11px] opacity-70 font-normal normal-case">
                  {formatEGP(shortfall)} EGP remains owing — deduct from next payment
                </span>
              </WAButton>
              <WAButton
                type="button"
                variant="ghost"
                onClick={() => handleConfirm("forgive")}
                disabled={isSubmitting}
                className="w-full border-wa-orange/30 text-wa-orange flex flex-col items-start gap-0.5 px-5 py-4 h-auto"
              >
                <span className="text-sm uppercase tracking-wider">Write off</span>
                <span className="text-[11px] opacity-70 font-normal normal-case">
                  Forgive the remaining {formatEGP(shortfall)} EGP — mark week as settled
                </span>
              </WAButton>
            </div>

            <WAButton
              type="button"
              variant="ghost"
              onClick={() => setModalState("enter_amount")}
              disabled={isSubmitting}
              className="border-wa-text/20 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> BACK
            </WAButton>
          </div>
        )}

        {/* STATE 2B — Exact */}
        {modalState === "exact" && (
          <div className="flex flex-col gap-6">
            <div className="p-6 bg-wa-green/5 border border-wa-green/20 rounded-xl flex items-center gap-4">
              <CheckCircle2 className="w-8 h-8 text-wa-green flex-shrink-0" />
              <div>
                <div className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Exact Amount</div>
                <div className="text-2xl font-mono font-bold text-wa-green">
                  {formatEGP(entered)} EGP ✓
                </div>
                <div className="text-[11px] opacity-50 mt-1">Matches the amount due exactly</div>
              </div>
            </div>

            <div className="flex gap-4">
              <WAButton
                type="button"
                variant="ghost"
                onClick={() => setModalState("enter_amount")}
                className="flex-1 border-wa-text/20 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> BACK
              </WAButton>
              <WAButton
                type="button"
                onClick={() => handleConfirm("keep")}
                disabled={isSubmitting}
                className="flex-1 bg-wa-green text-black font-bold"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "CONFIRM PAYMENT"
                )}
              </WAButton>
            </div>
          </div>
        )}

        {/* STATE 2C — Overpayment */}
        {modalState === "overpayment" && (
          <div className="flex flex-col gap-6">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 font-mono text-sm flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="opacity-50">Paying</span>
                <span className="font-bold text-wa-green">{formatEGP(entered)} EGP</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-50">Amount Due</span>
                <span className="font-bold">{formatEGP(due)} EGP</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between">
                <span className="opacity-50">Overpayment</span>
                <span className="font-bold text-wa-green">+{formatEGP(overage)} EGP</span>
              </div>
            </div>

            <div className="p-4 bg-wa-green/5 border border-wa-green/20 rounded-xl text-sm opacity-80 leading-relaxed">
              The overpayment of{" "}
              <span className="font-bold text-wa-green">{formatEGP(overage)} EGP</span> will be
              recorded as a credit in {staffPayroll.staff.full_name}&apos;s balance.
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-transparent border border-wa-green/30 rounded-xl p-4 text-sm font-mono outline-none focus:border-wa-green"
              />
            </div>

            <div className="flex gap-4">
              <WAButton
                type="button"
                variant="ghost"
                onClick={() => setModalState("enter_amount")}
                className="flex-1 border-wa-text/20 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> BACK
              </WAButton>
              <WAButton
                type="button"
                onClick={() => handleConfirm("credit")}
                disabled={isSubmitting}
                className="flex-1 bg-wa-green text-black font-bold"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "CONFIRM PAYMENT"
                )}
              </WAButton>
            </div>
          </div>
        )}
      </WAPanel>
    </div>
  );
}
