"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, DollarSign, Calendar, User as UserIcon, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
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
    if (!confirm(`Mark ${staffPayroll.staff.full_name} as PAID for this week? Total: ${staffPayroll.total_pay} EGP`)) return;

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
          payment_method: "cash",
          notes: "Weekly payroll"
        })
      });

      if (!res.ok) throw new Error("Payment failed");
      
      // Update local state to show as paid (simplified)
      setPayroll(payroll.map(p => p.staff.id === staffPayroll.staff.id ? { ...p, is_paid: true } : p));
      alert("Payment recorded successfully!");
    } catch (err) {
      console.error(err);
      alert("Error processing payment");
    } finally {
      setIsProcessing(null);
    }
  };

  const totalWeeklyPayout = payroll.reduce((acc, p) => acc + p.total_pay, 0);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-heading uppercase tracking-widest text-wa-green mb-2">WEEKLY PAYROLL</h1>
          <p className="text-wa-text/60 uppercase text-xs tracking-wider">Calculate and authorize staff compensation</p>
        </div>
        <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Weekly Estimated Liability</div>
            <div className="text-3xl font-mono font-bold text-wa-green">{totalWeeklyPayout.toLocaleString()} EGP</div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-wa-bg/30 border border-wa-green/20 p-4 rounded-xl">
        <button onClick={() => setCurrentWeek(addDays(currentWeek, -7))} className="p-2 hover:bg-wa-green/10 rounded-lg text-wa-green transition-colors">
            <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-wa-green" />
            <span className="font-mono font-bold text-lg tracking-widest uppercase">
                {format(currentWeek, "MMM d")} - {format(addDays(currentWeek, 6), "MMM d, yyyy")}
            </span>
        </div>
        <button onClick={() => setCurrentWeek(addDays(currentWeek, 7))} className="p-2 hover:bg-wa-green/10 rounded-lg text-wa-green transition-colors">
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
              {payroll.map(p => (
                  <WAPanel key={p.staff.id} className="p-6 border-wa-green/10 bg-wa-bg/40 backdrop-blur-md flex flex-col md:flex-row items-center gap-8 group hover:border-wa-green/30 transition-all">
                      <div className="flex items-center gap-4 min-w-[240px]">
                          <div className="w-12 h-12 bg-wa-green/10 rounded-full flex items-center justify-center border border-wa-green/20">
                              <UserIcon className="w-6 h-6 text-wa-green" />
                          </div>
                          <div>
                              <div className="font-bold text-lg uppercase tracking-wider">{p.staff.full_name}</div>
                              <div className="text-[10px] opacity-40 font-mono">STAFF ID: {p.staff.id.substring(0, 8)}</div>
                          </div>
                      </div>

                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                          <div className="flex flex-col">
                              <span className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Hours Worked</span>
                              <span className="font-mono font-bold text-wa-green">{p.total_hours}h <span className="text-wa-text/30 text-[10px]">@ {p.staff.hourly_rate}/h</span></span>
                              <span className="font-bold text-sm">{p.hours_pay.toLocaleString()} EGP</span>
                          </div>
                          <div className="flex flex-col border-l border-wa-text/5 pl-4">
                              <span className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Games Led</span>
                              <span className="font-mono font-bold text-wa-green">{p.games_count} games <span className="text-wa-text/30 text-[10px]">@ {p.staff.commission_per_game}/g</span></span>
                              <span className="font-bold text-sm">{p.commission_pay.toLocaleString()} EGP</span>
                          </div>
                          <div className="flex flex-col border-l border-wa-text/5 pl-4">
                              <span className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Adjustment</span>
                              <span className="font-mono font-bold text-wa-error">0.00 EGP</span>
                              <span className="text-[10px] opacity-30 italic font-mono">No penalties</span>
                          </div>
                          <div className="flex flex-col border-l border-wa-text/5 pl-4">
                              <span className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Net Payout</span>
                              <span className="text-xl font-mono font-bold text-wa-green">{p.total_pay.toLocaleString()} EGP</span>
                          </div>
                      </div>

                      <div className="min-w-[160px] flex justify-end">
                          {p.is_paid ? (
                              <div className="flex items-center gap-2 text-wa-green bg-wa-green/10 px-4 py-2 rounded-lg border border-wa-green/20">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">PAID</span>
                              </div>
                          ) : (
                              <WAButton 
                                onClick={() => handlePay(p)} 
                                disabled={isProcessing === p.staff.id}
                                className="bg-wa-green text-wa-bg font-bold flex items-center gap-2 group-hover:scale-105 transition-all"
                              >
                                  {isProcessing === p.staff.id ? "PROCESSING..." : "MARK AS PAID"}
                              </WAButton>
                          )}
                      </div>
                  </WAPanel>
              ))}

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
