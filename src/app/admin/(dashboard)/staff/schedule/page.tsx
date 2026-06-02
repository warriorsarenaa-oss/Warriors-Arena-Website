"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Calendar, Clock, User as UserIcon, Save } from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SchedulePage() {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [staff, setStaff] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("22:00");

  const loadData = async () => {
    setLoading(true);
    try {
      const weekStartStr = format(currentWeek, "yyyy-MM-dd");
      const [staffRes, shiftsRes] = await Promise.all([
        fetch("/api/v1/admin/staff"),
        fetch(`/api/v1/admin/staff/schedule?week_start=${weekStartStr}`)
      ]);
      
      if (staffRes.ok) setStaff(await staffRes.json());
      if (shiftsRes.ok) setShifts(await shiftsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [currentWeek]);

  const handleAddShift = () => {
    if (!selectedDay || !selectedStaff) return;

    const newShift = {
      staff_id: selectedStaff,
      shift_date: format(selectedDay, "yyyy-MM-dd"),
      start_time: startTime + ":00",
      end_time: endTime + ":00",
      staff: { full_name: staff.find(s => s.id === selectedStaff)?.full_name }
    };

    setShifts([...shifts, newShift]);
    setIsModalOpen(false);
  };

  const handleRemoveShift = (staffId: string, date: string) => {
    setShifts(shifts.filter(s => !(s.staff_id === staffId && s.shift_date === date)));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/admin/staff/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: format(currentWeek, "yyyy-MM-dd"),
          week_end: format(addDays(currentWeek, 6), "yyyy-MM-dd"),
          shifts: shifts
        })
      });
      if (!res.ok) throw new Error("Failed to save schedule");
      alert("Schedule saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving schedule");
    } finally {
      setIsSaving(false);
    }
  };

  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeek, i));

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-heading uppercase tracking-widest text-wa-green mb-2">STAFF SCHEDULE</h1>
          <p className="text-wa-text/60 uppercase text-xs tracking-wider">Weekly shift planning and deployment</p>
        </div>
        <div className="flex gap-4">
            <WAButton onClick={handleSave} disabled={isSaving} className="bg-wa-green text-wa-bg font-bold flex items-center gap-2">
                <Save className="w-4 h-4" /> {isSaving ? "SAVING..." : "PUBLISH SCHEDULE"}
            </WAButton>
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

      <WAPanel className="p-0 overflow-hidden border-wa-green/10 bg-wa-bg/20 backdrop-blur-md">
        <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm border-collapse">
                <thead>
                    <tr className="border-b border-wa-green/20 text-wa-green/60 uppercase tracking-[0.2em] text-[10px] bg-wa-green/5">
                        <th className="p-4 border-r border-wa-green/20 w-40">Staff Member</th>
                        {weekDays.map(day => (
                            <th key={day.toISOString()} className="p-4 text-center">
                                <div className="font-bold">{format(day, "EEEE")}</div>
                                <div className="opacity-60">{format(day, "MMM d")}</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {staff.map(member => (
                        <tr key={member.id} className="border-b border-wa-green/5">
                            <td className="p-4 border-r border-wa-green/20 bg-wa-green/5">
                                <div className="flex items-center gap-2">
                                    <UserIcon className="w-4 h-4 text-wa-green/50" />
                                    <span className="font-bold uppercase tracking-widest text-xs">{member.full_name}</span>
                                </div>
                            </td>
                            {weekDays.map(day => {
                                const dateStr = format(day, "yyyy-MM-dd");
                                const shift = shifts.find(s => s.staff_id === member.id && s.shift_date === dateStr);
                                
                                return (
                                    <td key={dateStr} className="p-2 text-center h-24">
                                        {shift ? (
                                            <div className="group relative bg-wa-green/20 border border-wa-green/30 p-2 rounded-lg text-[10px] font-mono flex flex-col gap-1 items-center">
                                                <div className="text-wa-green font-bold">{shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}</div>
                                                <button 
                                                    onClick={() => handleRemoveShift(member.id, dateStr)}
                                                    className="absolute -top-1 -right-1 bg-wa-error text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => {
                                                    setSelectedDay(day);
                                                    setSelectedStaff(member.id);
                                                    setIsModalOpen(true);
                                                }}
                                                className="w-full h-full border border-dashed border-wa-text/10 rounded-lg hover:border-wa-green/50 hover:bg-wa-green/5 transition-all text-wa-text/20 hover:text-wa-green flex items-center justify-center"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </WAPanel>

      {isModalOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <WAPanel className="max-w-md w-full p-8 border-wa-green/50 bg-wa-bg relative shadow-2xl">
                  <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-wa-text/30 hover:text-wa-text">
                      <X className="w-6 h-6" />
                  </button>
                  
                  <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-wa-green mb-6">Create Shift</h2>
                  
                  <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase tracking-widest opacity-50">Staff Member</label>
                          <div className="p-3 bg-wa-bg border border-wa-green/20 rounded-xl font-bold uppercase">
                              {staff.find(s => s.id === selectedStaff)?.full_name}
                          </div>
                      </div>

                      <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase tracking-widest opacity-50">Shift Date</label>
                          <div className="p-3 bg-wa-bg border border-wa-green/20 rounded-xl font-bold uppercase">
                              {selectedDay && format(selectedDay, "EEEE, MMM d")}
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                              <label className="text-[10px] uppercase tracking-widest opacity-50">Start Time</label>
                              <div className="flex items-center gap-2 bg-wa-bg border border-wa-green/20 p-3 rounded-xl">
                                  <Clock className="w-4 h-4 text-wa-green" />
                                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-transparent outline-none font-mono w-full" />
                              </div>
                          </div>
                          <div className="flex flex-col gap-2">
                              <label className="text-[10px] uppercase tracking-widest opacity-50">End Time</label>
                              <div className="flex items-center gap-2 bg-wa-bg border border-wa-green/20 p-3 rounded-xl">
                                  <Clock className="w-4 h-4 text-wa-green" />
                                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-transparent outline-none font-mono w-full" />
                              </div>
                          </div>
                      </div>

                      <WAButton onClick={handleAddShift} className="bg-wa-green text-wa-bg font-bold mt-4">
                          CONFIRM SHIFT
                      </WAButton>
                  </div>
              </WAPanel>
          </div>
      )}
    </div>
  );
}
