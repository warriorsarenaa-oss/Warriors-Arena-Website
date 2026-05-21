"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, User as UserIcon, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";
import { format, startOfWeek, addDays } from "date-fns";

export default function PayrollPage() {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [payroll, setPayroll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const weekStartStr = format(currentWeek, "yyyy-MM-dd");
      const weekEndStr = format(addDays(currentWeek, 6), "yyyy-MM-dd");
      const res = await fetch(`/api/v1/admin/staff/payroll?week_start=${weekStartStr}&week_end=${weekEndStr}`);
      if (res.ok) setPayroll(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [currentWeek]);

  const handlePay = async (staffPayroll: any) => {
    const deltaDue = Number(staffPayroll.delta_due ?? 0);
    if (deltaDue <= 0) {
      alert("This staff member is fully paid for this week.");
      return;
    }

    const alreadyPaid = Number(staffPayroll.already_paid ?? 0);
    const confirmMsg = alreadyPaid > 0
      ? `Pay remaining ${deltaDue} EGP to ${staffPayroll.staff.full_name}?\n\nTotal earned: ${staffPayroll.total_pay} EGP\nAlready paid: ${alreadyPaid} EGP\nNow paying: ${deltaDue} EGP`
      : `Pay ${deltaDue} EGP to ${staffPayroll.staff.full_name}?`;

    if (!confirm(confirmMsg)) return;

    setIsProcessing(staffPayroll.staff.id);
    try {
      const res = await fetch("/api/v1/admin/staff/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_id: staffPayroll.staff.id,
          week_start: format(currentWeek, "yyyy-MM-dd"),
          week_end: format(addDays(currentWeek, 6), "yyyy-MM-dd"),
          total_hours: staffPayroll.total_hours,
          hourly_rate: staffPayroll.staff.hourly_rate,
          hours_pay: staffPayroll.hours_pay,
          games_count: staffPayroll.games_count,
          commission_per_game: staffPayroll.staff.commission_per_game,
          commission_pay: staffPayroll.commission_pay,
          total_pay: staffPayroll.total_pay,
          delta_due: deltaDue,
          payment_method: "cash",
          notes: `Weekly payroll — delta payment (${deltaDue} EGP of ${staffPayroll.total_pay} EGP total)`
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Payment failed");
      }

      alert(`Payment of ${deltaDue} EGP recorded for ${staffPayroll.staff.full_name}`);
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const totalOutstanding = payroll.reduce((acc, p) => acc + Number(p.delta_due ?? p.total_pay ?? 0), 0);
  const totalAlreadyPaid = payroll.reduce((acc, p) => acc + Number(p.already_paid ?? 0), 0);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-heading uppercase tracking-widest text-wa-green mb-2">WEEKLY PAYROLL</h1>
          <p className="text-wa-text/60 uppercase text-xs tracking-wider">Calculate and authorize staff compensation</p>
        </div>
        <div className="text-right flex flex-col gap-1">
          {totalAlreadyPaid > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest opacity-40 mb-0.5">Already Paid This Week</div>
              <div className="text-lg font-mono font-bold text-wa-text/50">{totalAlreadyPaid.toLocaleString()} EGP</div>
            </div>
          )}
          <div>
            <div className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Outstanding Liability</div>
            <div className="text-3xl font-mono font-bold text-wa-green">{totalOutstanding.toLocaleString()} EGP</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-wa-bg/30 border border-wa-green/20 p-4 rounded-xl">
        <button type="button" onClick={() => setCurrentWeek(addDays(currentWeek, -7))} className="p-2 hover:bg-wa-green/10 rounded-lg text-wa-green transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-wa-green" />
          <span className="font-mono font-bold text-lg tracking-widest uppercase">
            {format(currentWeek, "MMM d")} - {format(addDays(currentWeek, 6), "MMM d, yyyy")}
          </span>
        </div>
        <button type="button" onClick={() => setCurrentWeek(addDays(currentWeek, 7))} className="p-2 hover:bg-wa-green/10 rounded-lg text-wa-green transition-colors">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-wa-green/30" />
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-40">Calculating payouts...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {payroll.map(p => {
            const deltaDue = Number(p.delta_due ?? 0);
            const alreadyPaid = Number(p.already_paid ?? 0);
            const isFullyPaid = deltaDue === 0 && alreadyPaid > 0;
            const isPartiallyPaid = alreadyPaid > 0 && deltaDue > 0;

            return (
              <WAPanel key={p.staff.id} className="p-6 border-wa-green/10 bg-wa-bg/40 backdrop-blur-md flex flex-col md:flex-row items-center gap-8 group hover:border-wa-green/30 transition-all">
                <div className="flex items-center gap-4 min-w-[240px]">
                  <div className="w-12 h-12 bg-wa-green/10 rounded-full flex items-center justify-center border border-wa-green/20">
                    <UserIcon className="w-6 h-6 text-wa-green" />
                  </div>
                  <div>
                    <div className="font-bold text-lg uppercase tracking-wider">{p.staff.full_name}</div>
                    <div className="text-[10px] opacity-40 font-mono">STAFF ID: {p.staff.id.substring(0, 8)}</div>
                    {isPartiallyPaid && (
                      <div className="text-[10px] text-wa-orange font-mono mt-0.5">
                        {alreadyPaid} EGP paid — {deltaDue} EGP pending
                      </div>
                    )}
                    {isFullyPaid && (
                      <div className="text-[10px] text-wa-green font-mono mt-0.5">Fully settled — {alreadyPaid} EGP paid</div>
                    )}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Hours Worked</span>
                    <span className="font-mono font-bold text-wa-green">
                      {p.total_hours}h <span className="text-wa-text/30 text-[10px]">@ {p.staff.hourly_rate}/h</span>
                    </span>
                    <span className="font-bold text-sm">{p.hours_pay.toLocaleString()} EGP</span>
                  </div>
                  <div className="flex flex-col border-l border-wa-text/5 pl-4">
                    <span className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Commission</span>
                    <span className="font-mono font-bold text-wa-green">
                      {p.games_count} games
                    </span>
                    <span className="font-bold text-sm">{p.commission_pay.toLocaleString()} EGP</span>
                  </div>
                  <div className="flex flex-col border-l border-wa-text/5 pl-4">
                    <span className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Total Earned</span>
                    <span className="text-xl font-mono font-bold text-wa-text">{p.total_pay.toLocaleString()} EGP</span>
                    {alreadyPaid > 0 && (
                      <span className="text-[10px] text-wa-text/40 font-mono">— {alreadyPaid} paid</span>
                    )}
                  </div>
                  <div className="flex flex-col border-l border-wa-text/5 pl-4">
                    <span className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Due Now</span>
                    <span className={`text-xl font-mono font-bold ${isFullyPaid ? 'text-wa-green/40' : 'text-wa-green'}`}>
                      {deltaDue.toLocaleString()} EGP
                    </span>
                  </div>
                </div>

                <div className="min-w-[160px] flex justify-end">
                  {isFullyPaid ? (
                    <div className="flex items-center gap-2 text-wa-green bg-wa-green/10 px-4 py-2 rounded-lg border border-wa-green/20">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">SETTLED</span>
                    </div>
                  ) : (
                    <WAButton
                      type="button"
                      onClick={() => handlePay(p)}
                      disabled={isProcessing === p.staff.id || deltaDue <= 0}
                      className="bg-wa-green text-wa-bg font-bold flex items-center gap-2 group-hover:scale-105 transition-all"
                    >
                      {isProcessing === p.staff.id ? "PROCESSING..." : `PAY ${deltaDue.toLocaleString()} EGP`}
                    </WAButton>
                  )}
                </div>
              </WAPanel>
            );
          })}

          {payroll.length === 0 && (
            <div className="p-20 border border-dashed border-wa-text/10 rounded-3xl flex flex-col items-center gap-4 text-wa-text/30">
              <AlertCircle className="w-12 h-12" />
              <p className="uppercase tracking-[0.3em] text-[10px] font-bold">No active shifts or games recorded for this period</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
