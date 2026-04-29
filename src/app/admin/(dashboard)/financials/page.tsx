"use client";

import React, { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { DollarSign, TrendingUp, TrendingDown, Plus, X, Trash2, Loader2, AlertCircle, User as UserIcon } from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";

export default function FinancialsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [overview, setOverview] = useState<any>({ realized_revenue: 0, total_expenses: 0, profit: 0, daily_revenue_data: [] });
  const [expenses, setExpenses] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [showDetailedLogs, setShowDetailedLogs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = `?from=${fromDate}&to=${toDate}`;
      
      // Fetch Overview
      const ovRes = await fetch(`/api/v1/admin/financials/overview${query}`);
      if (ovRes.ok) setOverview(await ovRes.json());

      // Fetch Expenses
      const expRes = await fetch(`/api/v1/admin/financials/expenses${query}`);
      if (expRes.ok) setExpenses(await expRes.json());

      // Fetch Salaries
      const salRes = await fetch(`/api/v1/admin/financials/salaries${query}`);
      if (salRes.ok) setSalaries(await salRes.json());
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    // API logic for delete could be added here
    alert("Delete functionality coming in next phase.");
  };

  const totalPayroll = salaries.reduce((sum, s) => sum + s.total_payout, 0);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading uppercase tracking-widest text-wa-green mb-2">FINANCIALS</h1>
          <p className="text-wa-text/60 uppercase text-xs tracking-wider">Revenue, expenses, and payroll</p>
        </div>
        
        <div className="flex gap-4 items-end bg-wa-bg/30 border border-wa-green/20 p-4 rounded-xl">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest opacity-50 font-bold">From</label>
            <input 
              type="date" 
              value={fromDate} 
              onChange={e => setFromDate(e.target.value)} 
              className="bg-transparent border border-wa-green/20 p-2 rounded text-xs outline-none focus:border-wa-green"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest opacity-50 font-bold">To</label>
            <input 
              type="date" 
              value={toDate} 
              onChange={e => setToDate(e.target.value)} 
              className="bg-transparent border border-wa-green/20 p-2 rounded text-xs outline-none focus:border-wa-green"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-8 border-b border-wa-green/10">
        {['overview', 'expenses', 'salaries'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 uppercase tracking-widest text-xs font-bold border-b-2 transition-all relative ${
              activeTab === tab ? 'border-wa-green text-wa-green' : 'border-transparent text-wa-text/40 hover:text-wa-text'
            }`}
          >
            {tab}
            {activeTab === tab && <div className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-wa-green blur-sm opacity-50"></div>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4 opacity-50">
          <Loader2 className="w-8 h-8 animate-spin text-wa-green" />
          <p className="uppercase tracking-[0.3em] text-[10px]">Synchronizing Financial Records...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <WAPanel className="p-6 border-wa-green/30 bg-wa-green/5">
                  <div className="flex items-center gap-3 mb-2 opacity-70">
                    <TrendingUp className="w-4 h-4 text-wa-green" />
                    <h3 className="uppercase tracking-widest text-[10px] font-bold">Realized Revenue</h3>
                  </div>
                  <div className="text-3xl font-bold font-mono text-wa-green">{overview.realized_revenue.toLocaleString()} EGP</div>
                </WAPanel>
                
                <WAPanel className="p-6 border-wa-error/30 bg-wa-error/5">
                  <div className="flex items-center gap-3 mb-2 opacity-70">
                    <TrendingDown className="w-4 h-4 text-wa-error" />
                    <h3 className="uppercase tracking-widest text-[10px] font-bold">Total Expenses</h3>
                  </div>
                  <div className="text-3xl font-bold font-mono text-wa-error">{overview.total_expenses.toLocaleString()} EGP</div>
                </WAPanel>

                <WAPanel className={`p-6 border ${overview.profit >= 0 ? 'border-wa-green/50 bg-wa-green/10' : 'border-wa-error/50 bg-wa-error/10'}`}>
                  <div className="flex items-center gap-3 mb-2 opacity-70">
                    <DollarSign className={`w-4 h-4 ${overview.profit >= 0 ? 'text-wa-green' : 'text-wa-error'}`} />
                    <h3 className="uppercase tracking-widest text-[10px] font-bold">Net Profit</h3>
                  </div>
                  <div className={`text-3xl font-bold font-mono ${overview.profit >= 0 ? 'text-wa-green' : 'text-wa-error'}`}>
                    {overview.profit.toLocaleString()} EGP
                  </div>
                </WAPanel>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
               <div className="flex justify-between items-center">
                 <h2 className="font-bold uppercase tracking-widest text-wa-green text-sm">Operation Expenses Log</h2>
                 <WAButton 
                   onClick={() => setIsExpenseModalOpen(true)}
                   className="bg-wa-green text-wa-bg font-bold flex items-center gap-2 text-xs h-10 px-6"
                 >
                   <Plus className="w-4 h-4"/> ADD EXPENSE
                 </WAButton>
               </div>
               
               <WAPanel className="overflow-hidden border-wa-green/10 bg-wa-bg/30">
                 <table className="w-full text-left text-xs">
                    <thead className="bg-wa-green/5 text-wa-green font-bold uppercase tracking-widest border-b border-wa-green/10">
                      <tr>
                        <th className="p-4">Date</th>
                        <th className="p-4">Description</th>
                        <th className="p-4 text-right">Amount</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.length === 0 ? (
                        <tr><td colSpan={4} className="p-12 text-center italic opacity-30">No expenses recorded for this period.</td></tr>
                      ) : expenses.map(exp => (
                        <tr key={exp.id} className="border-b border-wa-green/5 hover:bg-wa-green/5 transition-colors">
                          <td className="p-4 font-mono opacity-60">{exp.expense_date || exp.date}</td>
                          <td className="p-4 font-bold">{exp.title || exp.description}</td>
                          <td className="p-4 text-right font-bold text-wa-error">{Number(exp.amount).toLocaleString()} EGP</td>
                          <td className="p-4 text-center">
                            <button onClick={() => handleDeleteExpense(exp.id)} className="text-wa-error/50 hover:text-wa-error transition-colors">
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </WAPanel>
            </div>
          )}

          {activeTab === 'salaries' && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300">
               <div className="flex justify-between items-center">
                 <h2 className="font-bold uppercase tracking-widest text-wa-green text-sm">Payroll & Commissions</h2>
                 <div className="flex gap-4 items-center">
                    <div className="text-right">
                      <div className="text-[10px] uppercase opacity-40 font-bold">Estimated Period Payout</div>
                      <div className="text-lg font-bold font-mono text-wa-green">{totalPayroll.toLocaleString()} EGP</div>
                    </div>
                    <WAButton 
                      variant="ghost"
                      onClick={() => setShowDetailedLogs(!showDetailedLogs)}
                      className="border border-wa-green/30 text-wa-green font-bold h-10 px-6 text-xs hover:bg-wa-green/10"
                    >
                      {showDetailedLogs ? "VIEW SUMMARY" : "DETAILED LOGS"}
                    </WAButton>
                 </div>
               </div>

               {showDetailedLogs ? (
                 <div className="flex flex-col gap-6">
                    <WAPanel className="overflow-hidden border-wa-green/10 bg-wa-bg/30">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-wa-green/5 text-wa-green font-bold uppercase tracking-widest border-b border-wa-green/10">
                          <tr>
                            <th className="p-4">Staff</th>
                            <th className="p-4">Booking</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Earned At</th>
                            <th className="p-4 text-right">Commission</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salaries.flatMap(s => s.logs).length === 0 ? (
                            <tr><td colSpan={5} className="p-12 text-center italic opacity-30">No commission logs found for this period.</td></tr>
                          ) : salaries.flatMap(s => s.logs.map((log: any) => ({ ...log, username: s.username }))).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                            <tr key={log.id} className="border-b border-wa-green/5 hover:bg-wa-green/5 transition-colors">
                              <td className="p-4 font-bold text-wa-green uppercase">{log.username}</td>
                              <td className="p-4 font-mono">{log.booking_code}</td>
                              <td className="p-4 opacity-70">{log.customer}</td>
                              <td className="p-4 font-mono opacity-50">{new Date(log.date).toLocaleDateString()}</td>
                              <td className="p-4 text-right font-bold text-wa-green">+{Number(log.amount).toLocaleString()} EGP</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </WAPanel>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {salaries.map(staff => (
                      <WAPanel key={staff.id} className="p-6 border-wa-green/10 bg-wa-bg/40 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-wa-green/10 rounded-full flex items-center justify-center border border-wa-green/20">
                              <UserIcon className="w-5 h-5 text-wa-green" />
                            </div>
                            <div>
                              <h3 className="font-bold uppercase tracking-widest text-sm">{staff.username}</h3>
                              <p className="text-[10px] opacity-40 uppercase">Performance Payout</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <span className="text-[8px] px-1.5 py-0.5 bg-wa-green/20 text-wa-green rounded font-bold uppercase">Active Period</span>
                          </div>
                        </div>

                        <div className="space-y-3 mt-2">
                           <div className="flex justify-between text-xs border-b border-wa-green/5 pb-2">
                             <span className="opacity-50 uppercase tracking-widest text-[10px]">Base Salary</span>
                             <span className="font-mono">{staff.base_salary.toLocaleString()} EGP</span>
                           </div>
                           <div className="flex justify-between text-xs border-b border-wa-green/5 pb-2">
                             <span className="opacity-50 uppercase tracking-widest text-[10px]">Total Commissions ({staff.commission_count})</span>
                             <span className="font-mono text-wa-green">+{staff.total_commission.toLocaleString()} EGP</span>
                           </div>
                           <div className="flex justify-between items-end pt-2">
                             <span className="font-bold uppercase tracking-widest text-[10px] text-wa-green">Total Payout</span>
                             <span className="text-2xl font-bold font-mono text-wa-green">{staff.total_payout.toLocaleString()} EGP</span>
                           </div>
                        </div>
                      </WAPanel>
                    ))}
                    {salaries.length === 0 && (
                      <div className="col-span-full p-20 text-center opacity-30 italic">No staff records found.</div>
                    )}
                 </div>
               )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {isExpenseModalOpen && <AddExpenseModal onClose={() => setIsExpenseModalOpen(false)} onSuccess={fetchData} />}
      {isSalaryModalOpen && <SalaryModal onClose={() => setIsSalaryModalOpen(false)} />}
    </div>
  );
}

function AddExpenseModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd")
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/financials/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const errData = await res.json();
        alert(`Failed to save expense: ${errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error while saving expense.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <WAPanel className="max-w-md w-full p-8 border-wa-green/50 bg-wa-bg relative shadow-2xl shadow-wa-green/10">
        <button onClick={onClose} className="absolute top-4 right-4 text-wa-text/30 hover:text-wa-text transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-wa-green mb-8">Register Expense</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Amount (EGP)</label>
            <input 
              type="number" 
              required 
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              className="bg-wa-bg border border-wa-green/20 p-3 rounded outline-none focus:border-wa-green text-wa-green font-bold text-lg"
              placeholder="0.00"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Description</label>
            <input 
              type="text" 
              required 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="bg-wa-bg border border-wa-green/20 p-3 rounded outline-none focus:border-wa-green text-sm"
              placeholder="e.g., Electricity bill, Rent, Maintenance"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Date</label>
            <input 
              type="date" 
              required 
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="bg-wa-bg border border-wa-green/20 p-3 rounded outline-none focus:border-wa-green text-xs"
            />
          </div>

          <WAButton 
            disabled={loading} 
            type="submit" 
            className="w-full bg-wa-green text-wa-bg font-bold py-4 mt-4 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? 'PROCESSING...' : 'CONFIRM EXPENSE'}
          </WAButton>
        </form>
      </WAPanel>
    </div>
  );
}

function SalaryModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <WAPanel className="max-w-lg w-full p-8 border-wa-green/50 bg-wa-bg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-wa-text/30 hover:text-wa-text">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-wa-green mb-6">Salary Computation</h2>
        
        <div className="bg-wa-green/5 border border-wa-green/20 p-6 rounded-lg mb-6">
          <div className="flex items-center gap-4 text-wa-green mb-4">
             <AlertCircle className="w-6 h-6" />
             <p className="text-xs uppercase tracking-widest font-bold">Protocol Active</p>
          </div>
          <p className="text-xs opacity-60 leading-relaxed uppercase">
            The system is scanning for all active staff and calculating total commissions based on verified game completions in the selected interval.
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-8">
           <div className="flex justify-between border-b border-wa-green/10 pb-2">
             <span className="text-[10px] uppercase opacity-50 font-bold">Base Salaries Sum</span>
             <span className="font-mono text-sm">-- EGP</span>
           </div>
           <div className="flex justify-between border-b border-wa-green/10 pb-2 text-wa-green">
             <span className="text-[10px] uppercase font-bold">Computed Commissions</span>
             <span className="font-mono text-sm">-- EGP</span>
           </div>
           <div className="flex justify-between font-bold pt-2">
             <span className="text-[10px] uppercase tracking-widest">Total Payroll Amount</span>
             <span className="font-mono text-lg text-wa-green">-- EGP</span>
           </div>
        </div>

        <WAButton onClick={onClose} className="w-full bg-wa-green text-wa-bg font-bold">
           GENERATE PAYROLL REPORT
        </WAButton>
      </WAPanel>
    </div>
  );
}

// Add these icons if missing from imports
import { Activity } from "lucide-react";

