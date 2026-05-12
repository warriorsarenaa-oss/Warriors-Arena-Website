"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { 
  DollarSign, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Gamepad2, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Receipt,
  Send
} from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";
import { SectionHeader } from "@/components/UI/SectionHeader";
import { toast } from "sonner";

interface PayrollEntry {
  staff_id: string;
  staff_name: string;
  hourly_rate: number;
  total_hours: number;
  hours_pay: number;
  games_count: number;
  commission_rate: number;
  commission_pay: number;
  total_pay: number;
  is_paid?: boolean;
}

export default function PayrollPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<any>(null);

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

  useEffect(() => {
    fetchPayroll();
  }, [currentWeekStart]);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const startStr = format(currentWeekStart, "yyyy-MM-dd");
      const endStr = format(weekEnd, "yyyy-MM-dd");
      
      // 1. Get schedule to know the ID
      const schedRes = await fetch(`/api/v1/admin/schedules?week_start=${startStr}`);
      const schedData = await schedRes.json();
      const currentSched = Array.isArray(schedData) && schedData.length > 0 ? schedData[0] : null;
      setSchedule(currentSched);

      if (currentSched) {
        // 2. Calculate payroll
        const payrollRes = await fetch(`/api/v1/admin/payroll/calculate?week_start=${startStr}&week_end=${endStr}&schedule_id=${currentSched.id}`);
        const payrollData = await payrollRes.json();
        setEntries(Array.isArray(payrollData) ? payrollData : []);
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error("Failed to fetch payroll:", error);
      toast.error("Failed to calculate payroll");
    } finally {
      setLoading(false);
    }
  };

  const [isFinishing, setIsFinishing] = useState<string | null>(null);

  const markAsPaid = async (entry: PayrollEntry) => {
    setIsFinishing(entry.staff_id);
    const toastId = toast.loading(`Finalizing payment for ${entry.staff_name}...`);
    
    try {
      const res = await fetch("/api/v1/admin/payroll/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_id: entry.staff_id,
          week_start: format(currentWeekStart, "yyyy-MM-dd"),
          week_end: format(weekEnd, "yyyy-MM-dd"),
          total_hours: entry.total_hours,
          hourly_rate: entry.hourly_rate,
          hours_pay: entry.hours_pay,
          games_count: entry.games_count,
          commission_rate: entry.commission_rate,
          commission_pay: entry.commission_pay,
          total_pay: entry.total_pay,
          is_paid: true
        }),
      });

      const data = await res.json();
      console.log("[PAYROLL_FINALIZE_RESPONSE]", data);

      if (res.ok) {
        toast.success(`Payment marked for ${entry.staff_name}`, { id: toastId });
        await fetchPayroll();
      } else {
        toast.error(data.error || "Failed to finalize payment", { id: toastId });
      }
    } catch (error) {
      console.error("Payroll finalize error:", error);
      toast.error("Network error while marking as paid", { id: toastId });
    } finally {
      setIsFinishing(null);
    }
  };

  const pushToExpenses = async () => {
    const unpaidStaff = entries.filter(e => !e.is_paid);
    if (unpaidStaff.length > 0) {
      if (!confirm(`There are ${unpaidStaff.length} staff members not yet marked as paid. Push total for all paid staff?`)) return;
    }
    
    try {
      const res = await fetch("/api/v1/admin/payroll/push-to-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: format(currentWeekStart, "yyyy-MM-dd"),
          week_end: format(weekEnd, "yyyy-MM-dd"),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Pushed ${data.amount} EGP to Financials/Expenses`);
        fetchPayroll();
      } else {
        toast.error(data.error || "Failed to push to expenses");
      }
    } catch (error) {
      toast.error("Failed to push to expenses");
    }
  };

  const totalPayroll = entries.reduce((sum, e) => sum + e.total_pay, 0);
  const totalHours = entries.reduce((sum, e) => sum + e.total_hours, 0);
  const totalGames = entries.reduce((sum, e) => sum + e.games_count, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader
        title="Weekly Payroll Management"
        line="Transparent salary and commission calculations"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <WAPanel className="p-6 bg-gradient-to-br from-wa-green/10 to-transparent">
          <div className="text-wa-text-dim text-[10px] uppercase font-mono tracking-widest mb-1">Weekly Payout</div>
          <div className="text-3xl font-archivo text-wa-green flex items-baseline gap-1">
            {totalPayroll.toLocaleString()} <span className="text-sm">EGP</span>
          </div>
          <TrendingUp className="w-4 h-4 text-wa-green/50 mt-2" />
        </WAPanel>

        <WAPanel className="p-6">
          <div className="text-wa-text-dim text-[10px] uppercase font-mono tracking-widest mb-1">Operational Hours</div>
          <div className="text-2xl font-archivo text-wa-text">
            {totalHours} <span className="text-sm font-mono text-wa-text-dim">HRS</span>
          </div>
          <Clock className="w-4 h-4 text-wa-text-dim mt-2" />
        </WAPanel>

        <WAPanel className="p-6">
          <div className="text-wa-text-dim text-[10px] uppercase font-mono tracking-widest mb-1">Total Games</div>
          <div className="text-2xl font-archivo text-wa-text">
            {totalGames} <span className="text-sm font-mono text-wa-text-dim">Missions</span>
          </div>
          <Gamepad2 className="w-4 h-4 text-wa-text-dim mt-2" />
        </WAPanel>

        <WAPanel className="p-6">
          <div className="text-wa-text-dim text-[10px] uppercase font-mono tracking-widest mb-1">Personnel Cost</div>
          <div className="text-2xl font-archivo text-wa-text">
            {entries.length} <span className="text-sm font-mono text-wa-text-dim">Staff</span>
          </div>
          <Receipt className="w-4 h-4 text-wa-text-dim mt-2" />
        </WAPanel>
      </div>

      {/* Week Selector */}
      <div className="flex items-center justify-between bg-wa-panel p-4 border border-wa-line rounded-sm">
        <div className="flex items-center gap-4">
          <WAButton variant="ghost" size="sm" onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </WAButton>
          <span className="font-archivo text-sm uppercase tracking-widest">
            {format(currentWeekStart, "MMM dd")} - {format(weekEnd, "MMM dd, yyyy")}
          </span>
          <WAButton variant="ghost" size="sm" onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}>
            <ChevronRight className="w-4 h-4" />
          </WAButton>
        </div>
        
        <div className="flex gap-4">
          {schedule?.is_published ? (
            <div className="flex items-center gap-2 text-wa-green font-mono text-[10px] uppercase">
              <CheckCircle2 className="w-4 h-4" /> Schedule Published
            </div>
          ) : (
            <div className="flex items-center gap-2 text-wa-orange font-mono text-[10px] uppercase">
              <AlertCircle className="w-4 h-4" /> Schedule in Draft
            </div>
          )}
        </div>
      </div>

      {/* Payroll Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-20 text-center text-wa-text-dim font-mono animate-pulse">
            CALCULATING WEEKLY PAYROLL SILOS...
          </div>
        ) : entries.length === 0 ? (
          <div className="col-span-2 py-20 text-center border-2 border-dashed border-wa-line rounded-lg">
            <p className="text-wa-text-dim font-mono uppercase tracking-widest">No published shifts found for this week</p>
            <Link href="/admin/schedules/weekly-planner">
              <WAButton variant="ghost" className="mt-4">
                Go to Planner
              </WAButton>
            </Link>
          </div>
        ) : (
          entries.map((entry) => (
            <WAPanel key={entry.staff_id} className="p-0 overflow-hidden border-wa-line hover:border-wa-green/30 transition-all">
              <div className="p-6 border-b border-wa-line flex items-center justify-between bg-wa-text/5">
                <div>
                  <h3 className="text-wa-text font-archivo text-xl uppercase tracking-wider">{entry.staff_name}</h3>
                  <p className="text-[10px] text-wa-text-dim font-mono mt-1 uppercase">Personnel ID: {entry.staff_id.substring(0, 8)}</p>
                </div>
                <div className="text-right">
                  <div className="text-wa-green font-archivo text-2xl">{entry.total_pay} EGP</div>
                  <div className="text-[10px] text-wa-green/60 font-mono uppercase">Calculated Total</div>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-2 gap-8">
                {/* Hours Side */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-wa-text-dim text-[10px] font-mono uppercase tracking-widest border-b border-wa-line pb-2">
                    <Clock className="w-3 h-3" /> Hours worked
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-wa-text text-lg font-archivo">{entry.total_hours} <span className="text-xs text-wa-text-dim">hrs</span></span>
                    <span className="text-wa-text-dim text-xs font-mono">× {entry.hourly_rate}</span>
                  </div>
                  <div className="text-wa-text text-xl font-archivo pt-2 border-t border-wa-line/30 flex justify-between">
                    <span className="text-[10px] text-wa-text-dim uppercase">Hours Pay</span>
                    <span>{entry.hours_pay} <span className="text-xs">EGP</span></span>
                  </div>
                </div>

                {/* Commission Side */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-wa-text-dim text-[10px] font-mono uppercase tracking-widest border-b border-wa-line pb-2">
                    <Gamepad2 className="w-3 h-3" /> Commissions ({entry.games_count} games)
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-wa-text text-lg font-archivo">{entry.games_count || 0} <span className="text-xs text-wa-text-dim">games</span></span>
                    <span className="text-wa-text-dim text-xs font-mono">× {entry.commission_rate}% revenue</span>
                  </div>
                  <div className="text-wa-text text-xl font-archivo pt-2 border-t border-wa-line/30 flex justify-between">
                    <span className="text-[10px] text-wa-text-dim uppercase">Comm. Pay</span>
                    <span>{Number(entry.commission_pay).toFixed(2)} <span className="text-xs">EGP</span></span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-wa-bg/50 border-t border-wa-line flex justify-end">
                {entry.is_paid ? (
                  <div className="flex items-center gap-2 text-wa-green font-mono text-[10px] uppercase px-4 py-2 bg-wa-green/10 rounded">
                    <CheckCircle2 className="w-4 h-4" /> Paid & Settled
                  </div>
                ) : (
                  <WAButton 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => markAsPaid(entry)}
                    disabled={isFinishing === entry.staff_id}
                  >
                    {isFinishing === entry.staff_id ? (
                      "Processing..."
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4 mr-2" /> Mark as Paid
                      </>
                    )}
                  </WAButton>
                )}
              </div>
            </WAPanel>
          ))
        )}
      </div>

      {entries.length > 0 && (
        <div className="flex justify-center pt-8">
          <WAButton className="px-12 py-6 text-lg" onClick={pushToExpenses}>
            <Send className="w-5 h-5 mr-3" /> Push Weekly Total to Expenses
          </WAButton>
        </div>
      )}
    </div>
  );
}
