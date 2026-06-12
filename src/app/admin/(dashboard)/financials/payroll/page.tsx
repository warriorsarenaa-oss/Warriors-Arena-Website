"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, User as UserIcon, CheckCircle2, AlertCircle, Loader2, X, History, DollarSign, Send } from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";
import { format, startOfWeek, addDays } from "date-fns";

export default function PayrollPage() {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [payroll, setPayroll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  // Tracks which staff member's commission tooltip is "tapped open" (mobile). Desktop uses hover.
  const [openCommissionTip, setOpenCommissionTip] = useState<string | null>(null);

  // Modals state
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; staffPayroll: any; amount: string; notes: string } | null>(null);
  const [historyModal, setHistoryModal] = useState<{ isOpen: boolean; staffPayroll: any } | null>(null);
  const [pushModal, setPushModal] = useState<{ isOpen: boolean; isProcessing: boolean } | null>(null);
  const [writeOffModal, setWriteOffModal] = useState<{ isOpen: boolean; amount: number; due: number; staffPayroll: any; notes: string } | null>(null);

  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const weekStartStr = format(currentWeek, "yyyy-MM-dd");
      const weekEndStr = format(addDays(currentWeek, 6), "yyyy-MM-dd");
      const res = await fetch(`/api/v1/admin/staff/payroll?week_start=${weekStartStr}&week_end=${weekEndStr}`);
      const data = await res.json();
      if (!res.ok) {
        console.error('[PAYROLL_FETCH_ERROR]', data);
        setError(data.error || `Server error ${res.status}`);
        setPayroll([]);
      } else {
        setPayroll(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.error('[PAYROLL_NETWORK_ERROR]', err);
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [currentWeek]);

  const WRITEOFF_THRESHOLD = 50; // EGP — configurable

  const processPayment = async (staffPayroll: any, amount: number, notes: string, forceSettle: boolean) => {
    setIsProcessing(staffPayroll.staff.id);
    try {
      const res = await fetch('/api/v1/admin/staff/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payroll_record_id: staffPayroll.id,
          amount_paid: amount,
          payment_method: 'cash',
          notes: notes || (forceSettle ? 'Weekly payroll — write-off settlement' : 'Weekly payroll payment'),
          force_settle: forceSettle,
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Payment failed');
      }
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModal) return;

    const { staffPayroll, notes } = paymentModal;
    const amount = parseFloat(paymentModal.amount);
    const due = Number(staffPayroll.remaining_balance);

    if (!amount || amount <= 0) {
      alert('Payment amount must be greater than 0 EGP.');
      return;
    }

    const diff = Math.abs(due - amount);

    // If there is a discrepancy within the write-off threshold, intercept and show confirmation
    if (diff > 0.01 && diff <= WRITEOFF_THRESHOLD) {
      setPaymentModal(null);
      setWriteOffModal({ isOpen: true, amount, due, staffPayroll, notes });
      return;
    }

    setPaymentModal(null);
    await processPayment(staffPayroll, amount, notes, false);
  };

  const confirmPush = async () => {
    setPushModal({ isOpen: true, isProcessing: true });
    try {
      const res = await fetch("/api/v1/admin/payroll/push-to-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: format(currentWeek, "yyyy-MM-dd"),
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to push to expenses");

      alert(data.message || `Successfully pushed ${data.amount} EGP (${data.count} staff records) to expenses.`);
      setPushModal(null);
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
      setPushModal({ isOpen: true, isProcessing: false });
    }
  };

  const totalOutstanding = payroll.reduce((acc, p) => acc + Number(p.remaining_balance || 0), 0);
  const totalAlreadyPaid = payroll.reduce((acc, p) => acc + Number(p.total_paid_so_far || 0), 0);

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
              <div className="text-[10px] uppercase tracking-widest opacity-40 mb-0.5">Total Paid This Week</div>
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

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-mono text-sm">
          <span className="font-bold uppercase">API Error:</span> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-wa-green/30" />
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-40">Calculating payouts...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {payroll.map(p => {
            const remainingBalance = Number(p.remaining_balance || 0);
            const alreadyPaid = Number(p.total_paid_so_far || 0);
            const totalEarned = Number(p.total_calculated_payroll || 0);
            // Fully paid = paid amount matches or exceeds calculated total (with float tolerance) OR is_settled flag set
            const isFullyPaid = (totalEarned > 0 && alreadyPaid >= totalEarned - 0.01) || p.is_settled;
            const isOverpaid = alreadyPaid > totalEarned + 0.01;

            return (
              <WAPanel key={p.staff.id} className="p-6 border-wa-green/10 bg-wa-bg/40 backdrop-blur-md flex flex-col md:flex-row items-center gap-8 group hover:border-wa-green/30 transition-all relative">
                
                {isOverpaid && (
                  <div className="absolute -top-3 left-6 bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md">
                    OVERPAID BY {Math.abs(remainingBalance)} EGP
                  </div>
                )}

                <div className="flex items-center gap-4 min-w-[240px]">
                  <div className="w-12 h-12 bg-wa-green/10 rounded-full flex items-center justify-center border border-wa-green/20">
                    <UserIcon className="w-6 h-6 text-wa-green" />
                  </div>
                  <div>
                    <div className="font-bold text-lg uppercase tracking-wider">{p.staff.full_name}</div>
                    <div className="text-[10px] opacity-40 font-mono">STAFF ID: {p.staff.id.substring(0, 8)}</div>
                    
                    {p.payment_history?.length > 0 && (
                      <button 
                        onClick={() => setHistoryModal({ isOpen: true, staffPayroll: p })}
                        className="flex items-center gap-1 text-[10px] text-wa-green/70 hover:text-wa-green uppercase tracking-widest mt-1 transition-colors"
                      >
                        <History className="w-3 h-3" /> View {p.payment_history.length} Payments
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Hours Worked</span>
                    <span className="font-mono font-bold text-wa-green">
                      {Number(Number(p.total_hours).toFixed(2))}h <span className="text-wa-text/30 text-[10px]">@ {p.staff.hourly_rate}/h</span>
                    </span>
                    <span className="font-bold text-sm">{Number(p.hours_pay).toLocaleString(undefined, { maximumFractionDigits: 2 })} EGP</span>
                  </div>
                  <div className="flex flex-col border-l border-wa-text/5 pl-4 relative group">
                    <span className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Commission</span>
                    <button
                      type="button"
                      onClick={() => setOpenCommissionTip(openCommissionTip === p.staff.id ? null : p.staff.id)}
                      className="font-mono font-bold text-wa-green cursor-help text-left w-fit underline decoration-dotted decoration-wa-green/40 underline-offset-4"
                    >
                      {p.games_count} games
                    </button>
                    <span className="font-bold text-sm">{Number(p.commission_pay).toLocaleString(undefined, { maximumFractionDigits: 2 })} EGP</span>

                    {/* Commission breakdown tooltip — hover on desktop, tap on mobile */}
                    <div
                      className={`absolute z-40 left-0 top-full mt-2 w-60 max-w-[80vw] p-4 rounded-xl bg-wa-bg/95 border border-wa-green/30 shadow-2xl shadow-wa-green/10 backdrop-blur-md font-mono text-wa-green ${openCommissionTip === p.staff.id ? 'block' : 'hidden'} group-hover:block`}
                    >
                      <div className="flex justify-between items-baseline text-xs font-bold uppercase tracking-widest mb-2">
                        <span>Commission</span>
                        <span>{Number(p.commission_pay).toLocaleString(undefined, { maximumFractionDigits: 2 })} EGP</span>
                      </div>
                      <div className="border-t border-wa-green/20 my-2" />
                      {p.games && p.games.length > 0 ? (
                        <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                          {p.games.map((g: any, gi: number) => (
                            <div key={g.id || g.booking_code || gi} className="flex justify-between items-baseline gap-3 text-[11px]">
                              <span className="text-wa-green/90 whitespace-nowrap">{g.booking_code || '—'}</span>
                              <span className="text-wa-text/70 whitespace-nowrap">
                                {Number(g.commission_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} EGP
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-wa-text/40 italic">No commissioned games this week</div>
                      )}
                      <div className="border-t border-wa-green/20 my-2" />
                      <div className="text-[10px] uppercase tracking-widest text-wa-text/50">{p.games_count} games</div>
                    </div>
                  </div>
                  <div className="flex flex-col border-l border-wa-text/5 pl-4">
                    <span className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Total Earned</span>
                    <span className="text-xl font-mono font-bold text-wa-text">{totalEarned.toLocaleString(undefined, { maximumFractionDigits: 2 })} EGP</span>
                    {alreadyPaid > 0 && (
                      <span className="text-[10px] text-wa-text/40 font-mono">— {alreadyPaid.toLocaleString(undefined, { maximumFractionDigits: 2 })} paid</span>
                    )}
                  </div>
                  <div className="flex flex-col border-l border-wa-text/5 pl-4">
                    <span className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Due Now</span>
                    <span className={`text-xl font-mono font-bold ${isFullyPaid ? 'text-wa-green/40' : (isOverpaid ? 'text-red-400' : 'text-wa-green')}`}>
                      {remainingBalance > 0 ? remainingBalance.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'} EGP
                    </span>
                  </div>
                </div>

                <div className="min-w-[160px] flex justify-end">
                  {isFullyPaid && !isOverpaid ? (
                    <div className="flex items-center gap-2 text-wa-green bg-wa-green/10 px-4 py-2 rounded-lg border border-wa-green/20">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">SETTLED</span>
                    </div>
                  ) : (
                    <WAButton
                      type="button"
                      onClick={() => setPaymentModal({ isOpen: true, staffPayroll: p, amount: remainingBalance > 0 ? String(remainingBalance) : '', notes: '' })}
                      disabled={isProcessing === p.staff.id}
                      className="bg-wa-green text-wa-bg font-bold flex items-center gap-2 group-hover:scale-105 transition-all"
                    >
                      {isProcessing === p.staff.id ? "PROCESSING..." : "RECORD PAYMENT"}
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

          {payroll.length > 0 && (
            <div className="flex justify-center pt-8 border-t border-wa-green/10 mt-4">
              <WAButton 
                onClick={() => setPushModal({ isOpen: true, isProcessing: false })}
                className="px-12 py-6 text-lg bg-wa-bg border border-wa-green/50 text-wa-green hover:bg-wa-green/10 flex items-center gap-3"
              >
                <Send className="w-5 h-5" />
                PUSH WEEKLY TOTAL TO EXPENSES
              </WAButton>
            </div>
          )}

      {/* Write-Off Confirmation Modal */}
      {writeOffModal && writeOffModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <WAPanel className="max-w-md w-full p-8 border-wa-orange/30 relative shadow-2xl shadow-wa-orange/10">
            <button onClick={() => setWriteOffModal(null)} className="absolute top-6 right-6 opacity-50 hover:opacity-100 transition-opacity">
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-wa-orange/10 rounded border border-wa-orange/30">
                <AlertCircle className="w-6 h-6 text-wa-orange" />
              </div>
              <div>
                <h3 className="font-bold uppercase tracking-widest text-wa-orange">Settlement Write-Off</h3>
                <p className="text-[10px] opacity-50 uppercase tracking-widest font-mono">For {writeOffModal.staffPayroll.staff.full_name}</p>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-6 font-mono text-sm flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="opacity-50">Amount Due</span>
                <span className="font-bold">{writeOffModal.due.toLocaleString(undefined, { maximumFractionDigits: 2 })} EGP</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-50">You Are Paying</span>
                <span className="font-bold text-wa-green">{writeOffModal.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} EGP</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between">
                <span className="opacity-50">
                  {writeOffModal.amount < writeOffModal.due ? 'Written Off (Shortfall)' : 'Excess Noted'}
                </span>
                <span className={writeOffModal.amount < writeOffModal.due ? 'text-wa-orange font-bold' : 'text-wa-green font-bold'}>
                  {Math.abs(writeOffModal.due - writeOffModal.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} EGP
                </span>
              </div>
            </div>

            <p className="text-sm opacity-60 mb-6 leading-relaxed">
              {writeOffModal.amount < writeOffModal.due
                ? `You are paying ${writeOffModal.amount.toLocaleString()} of ${writeOffModal.due.toLocaleString()} EGP. The remaining ${Math.abs(writeOffModal.due - writeOffModal.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} EGP will be written off and this week marked settled.`
                : `You are paying ${writeOffModal.amount.toLocaleString()} of ${writeOffModal.due.toLocaleString()} EGP. The ${Math.abs(writeOffModal.due - writeOffModal.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} EGP excess will be noted. Week marked as settled.`
              }
            </p>

            <div className="flex gap-4">
              <WAButton
                type="button"
                variant="ghost"
                onClick={() => setWriteOffModal(null)}
                className="flex-1 border-wa-text/20"
              >
                CANCEL
              </WAButton>
              <WAButton
                type="button"
                onClick={async () => {
                  const { amount, notes, staffPayroll } = writeOffModal;
                  setWriteOffModal(null);
                  await processPayment(staffPayroll, amount, notes, true);
                }}
                className="flex-1 bg-wa-orange text-black font-bold"
              >
                CONFIRM WRITE-OFF
              </WAButton>
            </div>
          </WAPanel>
        </div>
      )}
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && paymentModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <WAPanel className="max-w-md w-full p-8 border-wa-green/30 relative shadow-2xl shadow-wa-green/10">
            <button onClick={() => setPaymentModal(null)} className="absolute top-6 right-6 opacity-50 hover:opacity-100 transition-opacity">
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-wa-green/10 rounded border border-wa-green/20">
                <DollarSign className="w-6 h-6 text-wa-green" />
              </div>
              <div>
                <h3 className="font-bold uppercase tracking-widest text-wa-green">Record Payment</h3>
                <p className="text-[10px] opacity-50 uppercase tracking-widest font-mono">For {paymentModal.staffPayroll.staff.full_name}</p>
              </div>
            </div>

            <form onSubmit={submitPayment} className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl border border-white/10 mb-2">
                <div>
                  <div className="text-[10px] uppercase opacity-50 mb-1 tracking-widest">Total Earned</div>
                  <div className="font-mono">{Number(paymentModal.staffPayroll.total_calculated_payroll).toLocaleString()} EGP</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase opacity-50 mb-1 tracking-widest">Remaining Balance</div>
                  <div className="font-mono text-wa-green font-bold">{Number(paymentModal.staffPayroll.remaining_balance).toLocaleString()} EGP</div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Payment Amount (EGP)</label>
                <input 
                  type="number" 
                  min="0.01" 
                  step="0.01"
                   max={undefined}
                   required 
                  value={paymentModal.amount} 
                  onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                  className="bg-transparent border border-wa-green/30 rounded-xl p-4 text-xl font-mono text-wa-green outline-none focus:border-wa-green"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Notes (Optional)</label>
                <input 
                  type="text" 
                  value={paymentModal.notes} 
                  onChange={(e) => setPaymentModal({ ...paymentModal, notes: e.target.value })}
                  placeholder="e.g. Cash handed by Admin"
                  className="bg-transparent border border-wa-green/30 rounded-xl p-4 text-sm font-mono outline-none focus:border-wa-green"
                />
              </div>

              <WAButton type="submit" className="w-full bg-wa-green text-black font-bold mt-4 py-4">
                CONFIRM PAYMENT OF {paymentModal.amount || 0} EGP
              </WAButton>

              {Number(paymentModal.staffPayroll.remaining_balance) > 0 && Number(paymentModal.staffPayroll.remaining_balance) <= WRITEOFF_THRESHOLD && (
                <WAButton 
                  type="button" 
                  variant="ghost" 
                  className="w-full border border-wa-orange/50 text-wa-orange hover:bg-wa-orange/10 font-bold py-4 mt-2"
                  onClick={() => {
                    setPaymentModal(null);
                    setWriteOffModal({ 
                      isOpen: true, 
                      amount: 0, 
                      due: Number(paymentModal.staffPayroll.remaining_balance), 
                      staffPayroll: paymentModal.staffPayroll, 
                      notes: 'Balance written off by admin directly' 
                    });
                  }}
                >
                  DROP {Number(paymentModal.staffPayroll.remaining_balance).toLocaleString()} EGP BALANCE
                </WAButton>
              )}
            </form>
          </WAPanel>
        </div>
      )}

      {/* Push to Expenses Modal */}
      {pushModal && pushModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <WAPanel className="max-w-xl w-full p-8 border-wa-green/30 relative shadow-2xl shadow-wa-green/10 max-h-[90vh] flex flex-col">
            <button onClick={() => setPushModal(null)} className="absolute top-6 right-6 opacity-50 hover:opacity-100 transition-opacity disabled:opacity-20" disabled={pushModal.isProcessing}>
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-wa-green/10 rounded border border-wa-green/20">
                <Send className="w-6 h-6 text-wa-green" />
              </div>
              <div>
                <h3 className="font-bold uppercase tracking-widest text-wa-green">Push to Expenses Ledger</h3>
                <p className="text-[10px] opacity-50 uppercase tracking-widest font-mono">Week of {format(currentWeek, "MMM d, yyyy")}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 mb-6">
              <table className="w-full text-left text-sm font-mono border-collapse">
                <thead>
                  <tr className="border-b border-wa-green/20 text-[10px] uppercase tracking-widest opacity-50">
                    <th className="py-2">Staff</th>
                    <th className="py-2 text-right">Total Paid</th>
                    <th className="py-2 text-right">Prev Pushed</th>
                    <th className="py-2 text-right text-wa-green">Net New</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll.map(p => {
                    const totalPaid = Number(p.total_paid_so_far || 0);
                    const prevPushed = Number(p.previously_pushed_to_expenses || 0);
                    const netNew = totalPaid - prevPushed;
                    
                    if (netNew <= 0) return null; // Only show positive net new

                    return (
                      <tr key={p.staff.id} className="border-b border-white/5">
                        <td className="py-3">{p.staff.full_name}</td>
                        <td className="py-3 text-right">{totalPaid.toLocaleString()}</td>
                        <td className="py-3 text-right">{prevPushed.toLocaleString()}</td>
                        <td className="py-3 text-right text-wa-green font-bold">+{netNew.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {payroll.filter(p => (Number(p.total_paid_so_far || 0) - Number(p.previously_pushed_to_expenses || 0)) > 0).length === 0 && (
                <div className="text-center py-8 opacity-50 italic text-sm">No new payments to push. Everything is up to date.</div>
              )}
            </div>

            <WAButton 
              onClick={confirmPush} 
              disabled={pushModal.isProcessing || payroll.filter(p => (Number(p.total_paid_so_far || 0) - Number(p.previously_pushed_to_expenses || 0)) > 0).length === 0} 
              className="w-full bg-wa-green text-black font-bold py-4 flex justify-center items-center gap-2"
            >
              {pushModal.isProcessing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> PUSHING TO LEDGER...</>
              ) : (
                <><Send className="w-4 h-4" /> CONFIRM PUSH</>
              )}
            </WAButton>
          </WAPanel>
        </div>
      )}

      {/* History Modal */}
      {historyModal && historyModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <WAPanel className="max-w-lg w-full p-8 border-wa-green/30 relative shadow-2xl shadow-wa-green/10 max-h-[80vh] flex flex-col">
            <button onClick={() => setHistoryModal(null)} className="absolute top-6 right-6 opacity-50 hover:opacity-100 transition-opacity">
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-wa-green/10 rounded border border-wa-green/20">
                <History className="w-6 h-6 text-wa-green" />
              </div>
              <div>
                <h3 className="font-bold uppercase tracking-widest text-wa-green">Payment Ledger</h3>
                <p className="text-[10px] opacity-50 uppercase tracking-widest font-mono">For {historyModal.staffPayroll.staff.full_name}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2">
              {historyModal.staffPayroll.payment_history?.map((payment: any, index: number) => (
                <div key={payment.id} className="p-4 border border-wa-green/10 bg-white/5 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="font-mono text-wa-green font-bold text-lg">{Number(payment.amount_paid).toLocaleString()} EGP</div>
                    <div className="text-[10px] opacity-50 uppercase tracking-widest font-mono mt-1">
                      {format(new Date(payment.paid_at), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                    {payment.notes && (
                      <div className="text-xs mt-2 italic opacity-70">"{payment.notes}"</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] bg-white/10 px-2 py-1 rounded font-mono uppercase inline-block">
                      {payment.payment_method}
                    </div>
                  </div>
                </div>
              ))}
              
              {(!historyModal.staffPayroll.payment_history || historyModal.staffPayroll.payment_history.length === 0) && (
                <div className="text-center p-8 opacity-50 italic text-sm">No payment history found.</div>
              )}
            </div>
          </WAPanel>
        </div>
      )}
    </div>
  );
}
