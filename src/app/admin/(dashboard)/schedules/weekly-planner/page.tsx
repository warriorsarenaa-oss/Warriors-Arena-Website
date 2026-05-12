"use client";

import React, { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Save, Send, Clock, Trash2, User, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";
import { SectionHeader } from "@/components/UI/SectionHeader";
import { toast } from "sonner";

interface Staff {
  id: string;
  full_name: string;
  hourly_rate: number;
  staff_color?: string;
}

interface Shift {
  id: string;
  staff_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  hours_planned: number;
  status: "pending" | "confirmed" | "rejected";
  notes?: string;
  staff_name?: string;
}

interface Schedule {
  id: string;
  week_start: string;
  week_end: string;
  is_published: boolean;
  notes?: string;
}

export default function WeeklyPlannerPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

  useEffect(() => {
    fetchData();
  }, [currentWeekStart]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startStr = format(currentWeekStart, "yyyy-MM-dd");
      
      const staffRes = await fetch("/api/v1/admin/users?role=staff&role=manager");
      const staffData = await staffRes.json();
      setStaffList(Array.isArray(staffData) ? staffData : []);

      const schedRes = await fetch(`/api/v1/admin/schedules?week_start=${startStr}`);
      const schedData = await schedRes.json();
      const currentSched = Array.isArray(schedData) && schedData.length > 0 ? schedData[0] : null;
      setSchedule(currentSched);

      if (currentSched) {
        const shiftsRes = await fetch(`/api/v1/admin/schedules/${currentSched.id}/shifts`);
        const shiftsData = await shiftsRes.json();
        setShifts(Array.isArray(shiftsData) ? shiftsData : []);
      } else {
        setShifts([]);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load schedule data");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const handleNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));

  const createSchedule = async () => {
    try {
      const res = await fetch("/api/v1/admin/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: format(currentWeekStart, "yyyy-MM-dd"),
          week_end: format(weekEnd, "yyyy-MM-dd"),
        }),
      });
      if (res.ok) {
        toast.success("Schedule created");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to create schedule");
    }
  };

  const addShift = async (staffId: string, date: Date, start: string, end: string) => {
    if (!schedule) return;
    try {
      const res = await fetch(`/api/v1/admin/schedules/${schedule.id}/shifts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_id: staffId,
          shift_date: format(date, "yyyy-MM-dd"),
          start_time: start,
          end_time: end,
          status: "pending"
        }),
      });
      if (res.ok) {
        toast.success("Shift added");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to add shift");
    }
  };

  const deleteShift = async (shiftId: string) => {
    if (!confirm("Are you sure you want to delete this shift?")) return;
    try {
      const res = await fetch(`/api/v1/admin/shifts/${shiftId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Shift deleted");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to delete shift");
    }
  };

  const handleSave = async () => {
    if (!schedule) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/schedules/${schedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: schedule.notes }),
      });
      if (res.ok) {
        toast.success("Schedule draft saved");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to save schedule draft");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!schedule) return;
    if (!confirm("Are you sure you want to publish this schedule? This will lock it and make it the basis for payroll.")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/schedules/${schedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: true }),
      });
      if (res.ok) {
        toast.success("Schedule published successfully");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to publish schedule");
    } finally {
      setLoading(false);
    }
  };

  const [editingCell, setEditingCell] = useState<{ staffId: string; date: string } | null>(null);
  const [inlineStart, setInlineStart] = useState("18:00");
  const [inlineEnd, setInlineEnd] = useState("21:00");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed": return <CheckCircle2 className="w-3 h-3 text-wa-green" />;
      case "rejected": return <XCircle className="w-3 h-3 text-wa-red" />;
      default: return <AlertCircle className="w-3 h-3 text-wa-orange" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title="Weekly Staff Planner" 
        line="Coordinate mission support and staff coverage"
      />

      {/* Week Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-wa-panel-2 p-6 border border-wa-line rounded-lg">
        <div className="flex items-center gap-6">
          <WAButton variant="ghost" size="sm" onClick={handlePrevWeek}>
            <ChevronLeft className="w-5 h-5 mr-1" /> Prev Week
          </WAButton>
          <div className="text-center">
            <div className="text-wa-green font-archivo text-lg tracking-wider uppercase">
              {format(currentWeekStart, "MMM d")} — {format(weekEnd, "MMM d, yyyy")}
            </div>
            <div className="text-wa-text-dim text-xs font-mono mt-1">
              STATUS: {schedule ? (schedule.is_published ? "PUBLISHED" : "DRAFT") : "NO SCHEDULE"}
            </div>
          </div>
          <WAButton variant="ghost" size="sm" onClick={handleNextWeek}>
            Next Week <ChevronRight className="w-5 h-5 ml-1" />
          </WAButton>
        </div>

        <div className="flex items-center gap-3">
          {!schedule ? (
            <WAButton onClick={createSchedule}>
              <Plus className="w-4 h-4 mr-2" /> Initialize Week
            </WAButton>
          ) : !schedule.is_published && (
            <>
              <WAButton variant="ghost" onClick={handleSave} disabled={loading}>
                <Save className="w-4 h-4 mr-2" /> Save Draft
              </WAButton>
              <WAButton onClick={handlePublish} disabled={loading}>
                <Send className="w-4 h-4 mr-2" /> Publish Schedule
              </WAButton>
            </>
          )}
        </div>
      </div>

      {/* Planner Grid */}
      <WAPanel className="overflow-x-auto p-0">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-wa-line bg-wa-bg/50">
              <th className="p-4 text-left border-r border-wa-line w-56 text-wa-text-dim text-[10px] uppercase tracking-widest font-mono sticky left-0 z-30 bg-wa-bg/95 backdrop-blur">
                Personnel
              </th>
              {weekDays.map((day) => (
                <th key={day.toString()} className="p-4 text-center border-r border-wa-line min-w-[160px]">
                  <div className="text-wa-text font-archivo text-xs uppercase tracking-tighter">
                    {format(day, "EEEE")}
                  </div>
                  <div className="text-wa-green font-mono text-sm mt-1">
                    {format(day, "MMM d")}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staffList.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-wa-text-dim font-mono text-sm">
                  {loading ? "LOADING SYSTEM PERSONNEL..." : "NO STAFF MEMBERS REGISTERED"}
                </td>
              </tr>
            ) : (
              staffList.map((staff) => (
                <tr key={staff.id} className="border-b border-wa-line hover:bg-wa-text/5 transition-colors">
                  <td className="p-4 border-r border-wa-line bg-wa-bg/30 sticky left-0 z-20 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-wa-bg border"
                        style={{ backgroundColor: staff.staff_color || '#22c55e', borderColor: staff.staff_color || '#22c55e' }}
                      >
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-wa-text font-archivo text-sm uppercase truncate max-w-[120px]">{staff.full_name}</div>
                        <div className="text-wa-text-dim text-[10px] font-mono">{staff.hourly_rate} EGP/HR</div>
                        <div className="mt-1 flex flex-col gap-0.5">
                          <div className="text-wa-green/80 text-[9px] font-mono uppercase tracking-tighter">
                            Wk: {shifts.filter(s => s.staff_id === staff.id).reduce((sum, s) => sum + Number(s.hours_planned), 0).toFixed(1)}h
                          </div>
                          <div className="text-wa-green text-[9px] font-mono font-bold uppercase tracking-tighter">
                            Pay: {Math.round(shifts.filter(s => s.staff_id === staff.id).reduce((sum, s) => sum + (Number(s.hours_planned) * staff.hourly_rate), 0))} EGP
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  {weekDays.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const dayShifts = shifts.filter(s => s.staff_id === staff.id && s.shift_date === dateStr);
                    const isEditing = editingCell?.staffId === staff.id && editingCell?.date === dateStr;

                    return (
                      <td key={day.toString()} className="p-2 border-r border-wa-line align-top group min-h-[120px]">
                        <div className="space-y-2 flex flex-col h-full">
                          <div className="flex-1 space-y-2">
                            {dayShifts.map((shift) => (
                              <div 
                                key={shift.id} 
                                className="bg-wa-green/10 border border-wa-green/30 p-2 rounded relative group/shift hover:bg-wa-green/20 transition-all"
                              >
                                <div className="text-[10px] text-wa-green font-mono uppercase flex items-center justify-between">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(shift.status)}
                                    <button 
                                      onClick={() => deleteShift(shift.id)}
                                      className="text-wa-red hover:scale-125 transition-all p-0.5"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className="text-[9px] text-wa-text-dim mt-1 font-mono uppercase flex justify-between items-center">
                                  <span>{shift.hours_planned} HOURS</span>
                                </div>
                              </div>
                            ))}
                            
                            {dayShifts.length === 0 && !isEditing && (
                              <div className="flex items-center justify-center h-10 text-[9px] text-wa-text-dim/20 font-mono uppercase tracking-widest italic">
                                OFF
                              </div>
                            )}
                          </div>
                          
                          {schedule && !schedule.is_published && (
                            <div className="mt-auto">
                              {isEditing ? (
                                <div className="bg-wa-green/5 border border-wa-green/30 p-2 rounded space-y-2 animate-in zoom-in-95 duration-200">
                                  <div className="grid grid-cols-2 gap-1">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[8px] uppercase opacity-40 font-mono">From</span>
                                      <input 
                                        type="time" 
                                        value={inlineStart} 
                                        onChange={e => setInlineStart(e.target.value)}
                                        className="bg-wa-bg border border-wa-green/20 text-[10px] p-1 rounded outline-none focus:border-wa-green"
                                      />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[8px] uppercase opacity-40 font-mono">To</span>
                                      <input 
                                        type="time" 
                                        value={inlineEnd} 
                                        onChange={e => setInlineEnd(e.target.value)}
                                        className="bg-wa-bg border border-wa-green/20 text-[10px] p-1 rounded outline-none focus:border-wa-green"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <button 
                                      onClick={() => {
                                        addShift(staff.id, day, inlineStart, inlineEnd);
                                        setEditingCell(null);
                                      }}
                                      className="flex-1 bg-wa-green text-wa-bg text-[9px] font-bold py-1 rounded"
                                    >
                                      SAVE
                                    </button>
                                    <button 
                                      onClick={() => setEditingCell(null)}
                                      className="px-2 bg-wa-text/10 text-wa-text/50 text-[9px] font-bold py-1 rounded"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setEditingCell({ staffId: staff.id, date: dateStr });
                                    setInlineStart("18:00");
                                    setInlineEnd("21:00");
                                  }}
                                  className="w-full py-2 border border-dashed border-wa-line text-wa-text-dim text-[10px] uppercase font-mono hover:border-wa-green hover:text-wa-green hover:bg-wa-green/5 transition-all opacity-40 group-hover:opacity-100 flex items-center justify-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> ADD SHIFT
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </WAPanel>

      {/* Weekly Summary */}
      {schedule && (
        <WAPanel className="bg-wa-panel-2 border-wa-green/20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex-1 w-full">
              <h3 className="text-wa-green font-archivo text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Personnel Payout Forecast (Base)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffList.filter(s => shifts.some(sh => sh.staff_id === s.id)).map(staff => {
                  const staffShifts = shifts.filter(s => s.staff_id === staff.id);
                  const totalHours = staffShifts.reduce((sum, s) => sum + Number(s.hours_planned), 0);
                  const totalPay = totalHours * staff.hourly_rate;
                  return (
                    <div key={staff.id} className="bg-wa-bg/30 p-3 rounded border border-wa-line/50 flex justify-between items-center">
                      <div>
                        <div className="text-wa-text text-[10px] uppercase font-archivo">{staff.full_name}</div>
                        <div className="text-wa-text-dim text-[9px] font-mono">{totalHours.toFixed(1)}h × {staff.hourly_rate} EGP</div>
                      </div>
                      <div className="text-wa-green font-mono text-sm font-bold">{Math.round(totalPay)} EGP</div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-wa-green/5 p-6 rounded-lg border border-wa-green/30 min-w-[280px] w-full md:w-auto">
              <div className="text-wa-text-dim text-[10px] uppercase font-mono mb-4 tracking-widest border-b border-wa-green/20 pb-2">Global Coverage & Cost</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-wa-text-dim text-xs font-archivo uppercase">Total Man-Hours:</span>
                  <span className="text-wa-green font-mono text-xl">{shifts.reduce((sum, s) => sum + Number(s.hours_planned), 0).toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-wa-text-dim text-xs font-archivo uppercase">Total Base Payroll:</span>
                  <span className="text-wa-green font-mono text-xl">
                    {Math.round(shifts.reduce((sum, s) => {
                      const staff = staffList.find(st => st.id === s.staff_id);
                      return sum + (Number(s.hours_planned) * (staff?.hourly_rate || 0));
                    }, 0))} EGP
                  </span>
                </div>
              </div>
            </div>
          </div>
        </WAPanel>
      )}
    </div>
  );
}
