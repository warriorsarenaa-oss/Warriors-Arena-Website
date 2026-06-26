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
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeMobileDayIndex, setActiveMobileDayIndex] = useState(0);
  const [mobileEditShift, setMobileEditShift] = useState<{ staff: Staff; day: Date; shift?: Shift } | null>(null);
  const [mobileStart, setMobileStart] = useState("18:00");
  const [mobileEnd, setMobileEnd] = useState("21:00");

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

  useEffect(() => {
    fetchData();
  }, [currentWeekStart]);

  const fetchData = async (preserveEditMode = false) => {
    setLoading(true);
    const editModeSnapshot = isEditMode;
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
      setIsEditMode(preserveEditMode ? editModeSnapshot : false);
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
        fetchData(true);
      } else {
        toast.error("Failed to add shift");
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
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-wa-panel-2 p-4 sm:p-6 border border-wa-line rounded-lg">
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-6">
          <WAButton variant="ghost" size="sm" onClick={handlePrevWeek} className="px-2 sm:px-4">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-1" /> <span className="hidden xs:inline">Prev</span>
          </WAButton>
          <div className="text-center flex-1 sm:flex-none">
            <div className="text-wa-green font-archivo text-sm sm:text-lg tracking-wider uppercase">
              {format(currentWeekStart, "MMM d")} — {format(weekEnd, "MMM d")}
            </div>
            <div className="text-wa-text-dim text-[10px] font-mono mt-0.5">
              STATUS: {schedule ? (schedule.is_published ? (isEditMode ? "PUBLISHED (EDIT MODE)" : "PUBLISHED") : "DRAFT") : "EMPTY"}
            </div>
          </div>
          <WAButton variant="ghost" size="sm" onClick={handleNextWeek} className="px-2 sm:px-4">
            <span className="hidden xs:inline">Next</span> <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 sm:ml-1" />
          </WAButton>
        </div>

        <div className="flex items-center gap-3">
          {!schedule ? (
            <WAButton onClick={createSchedule}>
              <Plus className="w-4 h-4 mr-2" /> Initialize Week
            </WAButton>
          ) : !schedule.is_published ? (
            <>
              <WAButton variant="ghost" onClick={handleSave} disabled={loading}>
                <Save className="w-4 h-4 mr-2" /> Save Draft
              </WAButton>
              <WAButton onClick={handlePublish} disabled={loading}>
                <Send className="w-4 h-4 mr-2" /> Publish Schedule
              </WAButton>
            </>
          ) : (
            <WAButton 
              variant={isEditMode ? "ghost" : "primary"}
              onClick={() => setIsEditMode(!isEditMode)} 
              disabled={loading}
              className={isEditMode ? "border-wa-orange text-wa-orange" : ""}
            >
              {isEditMode ? "Exit Edit Mode" : "Edit Published Schedule"}
            </WAButton>
          )}
        </div>
      </div>

      {/* Planner Grid (Desktop View) */}
      <div className="hidden md:block">
        <WAPanel className="overflow-x-auto p-0">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-wa-line bg-wa-bg/50">
                <th className="p-4 text-left border-r border-wa-line w-40 sm:w-56 text-wa-text-dim text-[9px] sm:text-[10px] uppercase tracking-widest font-mono sticky left-0 z-30 bg-wa-bg/95 backdrop-blur">
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
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div 
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-wa-bg border shrink-0"
                          style={{ backgroundColor: staff.staff_color || '#22c55e', borderColor: staff.staff_color || '#22c55e' }}
                        >
                          <User className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-wa-text font-archivo text-[11px] sm:text-sm uppercase truncate">{staff.full_name}</div>
                          <div className="text-wa-text-dim text-[8px] sm:text-[10px] font-mono mt-0.5">{staff.hourly_rate} EGP/HR</div>
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
                                      {(!schedule?.is_published || isEditMode) && (
                                        <button 
                                          onClick={() => deleteShift(shift.id)}
                                          className="text-wa-red hover:scale-125 transition-all p-0.5"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
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
                            
                            {schedule && (!schedule.is_published || isEditMode) && (
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
                                        type="button"
                                        onClick={async () => {
                                          await addShift(staff.id, day, inlineStart, inlineEnd);
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
      </div>

      {/* Planner Grid (Mobile View) */}
      <div className="block md:hidden space-y-4">
        {/* Mobile Day Selector (Horizontal list of tabs) */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {weekDays.map((day, idx) => {
            const isSelected = activeMobileDayIndex === idx;
            return (
              <button
                key={day.toString()}
                type="button"
                onClick={() => setActiveMobileDayIndex(idx)}
                className={`flex-1 min-w-[75px] py-3 px-2 border-2 text-center transition-all ${
                  isSelected
                    ? "border-wa-green bg-wa-green/10 text-wa-green shadow-[0_0_10px_rgba(143,224,74,0.15)]"
                    : "border-wa-line bg-wa-panel-2 text-wa-text-dim"
                }`}
              >
                <div className="text-[10px] uppercase font-mono tracking-tighter">
                  {format(day, "eee")}
                </div>
                <div className="text-sm font-bold font-archivo mt-0.5">
                  {format(day, "d")}
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile Staff Cards */}
        <div className="space-y-3">
          {staffList.length === 0 ? (
            <div className="text-center p-8 text-wa-text-dim font-mono text-xs">
              {loading ? "LOADING SYSTEM PERSONNEL..." : "NO STAFF MEMBERS REGISTERED"}
            </div>
          ) : (
            staffList.map((staff) => {
              const activeMobileDay = weekDays[activeMobileDayIndex];
              const activeMobileDateStr = format(activeMobileDay, "yyyy-MM-dd");
              const dayShifts = shifts.filter(s => s.staff_id === staff.id && s.shift_date === activeMobileDateStr);
              
              return (
                <WAPanel key={staff.id} className="p-4 bg-wa-panel border border-wa-line rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-wa-bg border shrink-0"
                        style={{ backgroundColor: staff.staff_color || '#22c55e', borderColor: staff.staff_color || '#22c55e' }}
                      >
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-wa-text font-archivo text-xs uppercase">{staff.full_name}</div>
                        <div className="text-wa-text-dim text-[9px] font-mono mt-0.5">{staff.hourly_rate} EGP/HR</div>
                      </div>
                    </div>

                    {/* Add Shift Button on Mobile */}
                    {schedule && (!schedule.is_published || isEditMode) && (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileEditShift({ staff, day: activeMobileDay });
                          setMobileStart("18:00");
                          setMobileEnd("21:00");
                        }}
                        className="py-2 px-3 border border-dashed border-wa-line text-wa-text-dim text-[10px] uppercase font-mono hover:border-wa-green hover:text-wa-green flex items-center gap-1 rounded"
                      >
                        <Plus className="w-3 h-3" /> Shift
                      </button>
                    )}
                  </div>

                  {/* Day Shifts for this staff */}
                  <div className="mt-3 pt-3 border-t border-wa-line/50 space-y-2">
                    {dayShifts.length === 0 ? (
                      <div className="text-[10px] text-wa-text-dim/30 font-mono uppercase tracking-widest italic py-1">
                        OFF
                      </div>
                    ) : (
                      dayShifts.map((shift) => (
                        <div 
                          key={shift.id} 
                          className="bg-wa-green/5 border border-wa-green/20 p-3 rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs text-wa-green font-mono uppercase flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}
                            </div>
                            <div className="text-[10px] text-wa-text-dim font-mono mt-1 uppercase">
                              {shift.hours_planned} Hours · {Math.round(shift.hours_planned * staff.hourly_rate)} EGP
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {getStatusIcon(shift.status)}
                            {(!schedule?.is_published || isEditMode) && (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMobileEditShift({ staff, day: activeMobileDay, shift });
                                    setMobileStart(shift.start_time.substring(0, 5));
                                    setMobileEnd(shift.end_time.substring(0, 5));
                                  }}
                                  className="px-2 py-1 text-[10px] text-wa-green border border-wa-green/30 bg-wa-green/10 hover:bg-wa-green/20 rounded font-mono uppercase"
                                >
                                  Edit
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => deleteShift(shift.id)}
                                  className="p-2 text-wa-red bg-wa-red/10 hover:bg-wa-red/20 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </WAPanel>
              );
            })
          )}
        </div>
      </div>

      {/* Mobile Bottom Action Sheet for Shift Edit */}
      {mobileEditShift && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/85 backdrop-blur-sm p-0">
          <WAPanel className="w-full rounded-t-[2rem] border-t border-wa-green/20 p-6 flex flex-col gap-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center pb-4 border-b border-wa-line">
              <div>
                <h3 className="text-wa-green font-archivo text-base uppercase tracking-widest">
                  {mobileEditShift.shift ? "Edit Shift" : "Add Shift"}
                </h3>
                <p className="text-[10px] text-wa-text-dim font-mono uppercase mt-1">
                  {mobileEditShift.staff.full_name} · {format(mobileEditShift.day, "EEEE, MMM d")}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setMobileEditShift(null)}
                className="p-2 hover:bg-wa-text/5 text-wa-text/40 hover:text-wa-green rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-wa-text-dim font-mono uppercase">Start Time</label>
                <input 
                  type="time" 
                  value={mobileStart} 
                  onChange={e => setMobileStart(e.target.value)}
                  className="bg-wa-bg border-2 border-wa-line p-3 text-base text-wa-text outline-none focus:border-wa-green min-h-[48px] rounded"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-wa-text-dim font-mono uppercase">End Time</label>
                <input 
                  type="time" 
                  value={mobileEnd} 
                  onChange={e => setMobileEnd(e.target.value)}
                  className="bg-wa-bg border-2 border-wa-line p-3 text-base text-wa-text outline-none focus:border-wa-green min-h-[48px] rounded"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={async () => {
                  if (mobileEditShift.shift) {
                    try {
                      const res = await fetch(`/api/v1/admin/shifts/${mobileEditShift.shift.id}`, { method: "DELETE" });
                      if (res.ok) {
                        await addShift(mobileEditShift.staff.id, mobileEditShift.day, mobileStart, mobileEnd);
                        setMobileEditShift(null);
                      } else {
                        toast.error("Failed to update shift");
                      }
                    } catch (err) {
                      toast.error("Failed to update shift");
                    }
                  } else {
                    await addShift(mobileEditShift.staff.id, mobileEditShift.day, mobileStart, mobileEnd);
                    setMobileEditShift(null);
                  }
                }}
                className="flex-1 bg-wa-green text-wa-bg font-archivo text-xs uppercase py-3.5 tracking-wider font-bold rounded-lg flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Save className="w-4 h-4" /> Save Shift
              </button>
              <button
                type="button"
                onClick={() => setMobileEditShift(null)}
                className="px-5 border border-wa-line text-wa-text-dim font-archivo text-xs uppercase py-3.5 tracking-wider rounded-lg min-h-[48px]"
              >
                Cancel
              </button>
            </div>
          </WAPanel>
        </div>
      )}

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
