"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock, Calendar, AlertTriangle, Plus, Trash2, X } from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";

/**
 * DB schema reminder:
 *   scope IN ('default', 'day_of_week', 'exact_date')
 *   day_of_week INT  0=Sunday 1=Monday … 6=Saturday
 *   exact_date  DATE e.g. "2026-12-25"
 */

type OperatingHour = {
  id: string;
  scope: "default" | "day_of_week" | "exact_date";
  day_of_week: number | null;
  exact_date: string | null;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
};

const DAYS: { name: string; dow: number }[] = [
  { name: "Sunday",    dow: 0 },
  { name: "Monday",    dow: 1 },
  { name: "Tuesday",   dow: 2 },
  { name: "Wednesday", dow: 3 },
  { name: "Thursday",  dow: 4 },
  { name: "Friday",    dow: 5 },
  { name: "Saturday",  dow: 6 },
];

type ModalMode = "default" | { type: "day_of_week"; dow: number } | { type: "exact_date"; date: string };

export default function HoursPage() {
  const [hours, setHours] = useState<OperatingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDate, setPreviewDate] = useState(""); // Initialize empty for hydration stability
  const [previewResult, setPreviewResult] = useState<any>(null);

  // Set initial date on client mount
  useEffect(() => {
    setPreviewDate(format(new Date(), "yyyy-MM-dd"));
  }, []);

  // Modal
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [editOpenTime, setEditOpenTime] = useState("18:00");
  const [editCloseTime, setEditCloseTime] = useState("21:00");
  const [editIsClosed, setEditIsClosed] = useState(false);
  const [useCustom, setUseCustom] = useState(false);
  const [editExactDate, setEditExactDate] = useState("");

  const fetchHours = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/hours");
      if (res.ok) setHours(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resolvePreview = async () => {
    if (!previewDate) return;
    try {
      const res = await fetch(`/api/v1/admin/hours/resolve?date=${previewDate}`);
      if (res.ok) {
        const data = await res.json();
        // fn_resolve_operating_hours returns an array; take first item
        setPreviewResult(Array.isArray(data) ? data[0] ?? null : data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchHours(); }, []);
  useEffect(() => { resolvePreview(); }, [previewDate, hours]);

  // ── helpers ──────────────────────────────────────────────────
  const defaultRow = hours.find(h => h.scope === "default");
  const findDow = (dow: number) =>
    hours.find(h => h.scope === "day_of_week" && h.day_of_week === dow) ?? null;
  const exactDates = hours
    .filter(h => h.scope === "exact_date")
    .sort((a, b) => (a.exact_date ?? "").localeCompare(b.exact_date ?? ""));

  const formatTime = (t: string | null) => (t ? t.substring(0, 5) : "--:--");

  const defaultOpen  = defaultRow?.open_time  ? formatTime(defaultRow.open_time)  : "18:00";
  const defaultClose = defaultRow?.close_time ? formatTime(defaultRow.close_time) : "21:00";

  // ── open modal helpers ────────────────────────────────────────
  const openDefault = () => {
    setModalMode("default");
    setUseCustom(true);
    setEditIsClosed(defaultRow?.is_closed ?? false);
    setEditOpenTime(defaultRow?.open_time ? formatTime(defaultRow.open_time) : "18:00");
    setEditCloseTime(defaultRow?.close_time ? formatTime(defaultRow.close_time) : "21:00");
  };

  const openDow = (dow: number) => {
    const override = findDow(dow);
    setModalMode({ type: "day_of_week", dow });
    setUseCustom(!!override);
    setEditIsClosed(override?.is_closed ?? false);
    setEditOpenTime(override?.open_time ? formatTime(override.open_time) : defaultOpen);
    setEditCloseTime(override?.close_time ? formatTime(override.close_time) : defaultClose);
  };

  const openNewExactDate = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    setModalMode({ type: "exact_date", date: today });
    setEditExactDate(today);
    setUseCustom(true);
    setEditIsClosed(true);
    setEditOpenTime("18:00");
    setEditCloseTime("21:00");
  };

  const openExistingExactDate = (row: OperatingHour) => {
    setModalMode({ type: "exact_date", date: row.exact_date! });
    setEditExactDate(row.exact_date!);
    setUseCustom(true);
    setEditIsClosed(row.is_closed);
    setEditOpenTime(row.open_time ? formatTime(row.open_time) : "18:00");
    setEditCloseTime(row.close_time ? formatTime(row.close_time) : "21:00");
  };

  // ── save ─────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalMode) return;

    try {
      if (!useCustom && modalMode !== "default") {
        // "Use default hours" — delete any existing override
        if (typeof modalMode === "object" && modalMode.type === "day_of_week") {
          const existing = findDow(modalMode.dow);
          if (existing) {
            const res = await fetch(`/api/v1/admin/hours/${existing.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete override");
          }
        }
      } else {
        // Build payload for the API
        let payload: Record<string, unknown>;
        if (modalMode === "default") {
          payload = { scope: "default", is_closed: editIsClosed, open_time: editIsClosed ? null : `${editOpenTime}:00`, close_time: editIsClosed ? null : `${editCloseTime}:00` };
        } else if (modalMode.type === "day_of_week") {
          payload = { scope: "day_of_week", day_of_week: modalMode.dow, is_closed: editIsClosed, open_time: editIsClosed ? null : `${editOpenTime}:00`, close_time: editIsClosed ? null : `${editCloseTime}:00` };
        } else {
          // exact_date
          payload = { scope: "exact_date", exact_date: editExactDate, is_closed: editIsClosed, open_time: editIsClosed ? null : `${editOpenTime}:00`, close_time: editIsClosed ? null : `${editCloseTime}:00` };
        }

        const res = await fetch("/api/v1/admin/hours", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Save failed");
        }
      }

      setModalMode(null);
      await fetchHours();
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this override?")) return;
    try {
      const res = await fetch(`/api/v1/admin/hours/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Delete failed");
      }
      await fetchHours();
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  const closeModal = () => setModalMode(null);

  // ── render ────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      <div className="flex-1 flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold font-heading uppercase tracking-widest text-wa-green mb-2">
            OPERATING HOURS
          </h1>
          <p className="text-wa-text/60 uppercase text-xs tracking-wider">
            Manage venue availability (exact date › day of week › default)
          </p>
        </div>

        {/* Default Hours */}
        <WAPanel className="p-6 border border-wa-green/20 bg-wa-bg/50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold uppercase tracking-widest text-wa-green">Default Schedule</h2>
              <p className="text-wa-text/80 mt-1 text-sm">Applies to all days without a specific override.</p>
            </div>
            <WAButton onClick={openDefault} className="bg-wa-green text-wa-bg font-bold">
              EDIT DEFAULT
            </WAButton>
          </div>
          <div className="mt-4 p-4 border border-wa-green/10 bg-wa-green/5 rounded flex items-center gap-4">
            <Clock className="w-6 h-6 text-wa-green" />
            <span className="text-xl font-bold font-mono">
              {loading ? "..." : defaultRow
                ? defaultRow.is_closed ? "CLOSED" : `${formatTime(defaultRow.open_time)} — ${formatTime(defaultRow.close_time)}`
                : "Not configured"}
            </span>
          </div>
        </WAPanel>

        {/* Day of Week Overrides */}
        <div>
          <h2 className="text-lg font-bold uppercase tracking-widest text-wa-text mb-4">Day Overrides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {DAYS.map(({ name, dow }) => {
              const override = findDow(dow);
              let borderClass = "border-wa-green/20 text-wa-text";
              let label = `${defaultOpen} — ${defaultClose} (default)`;

              if (override) {
                if (override.is_closed) {
                  borderClass = "border-wa-error bg-wa-error/10 text-wa-error";
                  label = "CLOSED";
                } else {
                  borderClass = "border-wa-orange bg-wa-orange/10 text-wa-orange";
                  label = `${formatTime(override.open_time)} — ${formatTime(override.close_time)}`;
                }
              }

              return (
                <div
                  key={dow}
                  onClick={() => openDow(dow)}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-wa-text/5 transition-colors group relative ${borderClass}`}
                >
                  <div className="font-bold uppercase tracking-widest mb-1">{name}</div>
                  <div className="text-sm opacity-80">{label}</div>
                  {override && (
                    <div className="text-[10px] uppercase tracking-widest opacity-50 mt-1">override active</div>
                  )}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs uppercase tracking-widest underline">
                    Edit
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exact Date Overrides */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-wa-text">Specific Date Overrides</h2>
            <WAButton onClick={openNewExactDate} variant="ghost" size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> ADD DATE
            </WAButton>
          </div>

          <WAPanel className="p-0 overflow-hidden border-wa-green/20">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-wa-green/20 text-wa-text/60 uppercase tracking-widest text-xs">
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exactDates.length === 0 ? (
                  <tr><td colSpan={3} className="p-4 text-center opacity-50 italic">No specific date overrides configured</td></tr>
                ) : exactDates.map(row => (
                  <tr key={row.id} className="border-b border-wa-green/10">
                    <td className="p-4 font-bold font-mono">{row.exact_date}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-widest ${
                        row.is_closed ? "bg-wa-error/20 text-wa-error" : "bg-wa-orange/20 text-wa-orange"
                      }`}>
                        {row.is_closed ? "CLOSED" : `${formatTime(row.open_time)} — ${formatTime(row.close_time)}`}
                      </span>
                    </td>
                    <td className="p-4 flex gap-3">
                      <button onClick={() => openExistingExactDate(row)} className="text-wa-green hover:underline uppercase text-xs">Edit</button>
                      <button onClick={() => handleDelete(row.id)} className="text-wa-error hover:opacity-80">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </WAPanel>
        </div>
      </div>

      {/* Live Preview Sidebar */}
      <div className="w-full lg:w-80 shrink-0">
        <div className="sticky top-24">
          <WAPanel className="p-6 border border-wa-green/50 bg-wa-bg/80 backdrop-blur-md">
            <h3 className="text-wa-green font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Live Preview
            </h3>

            <div className="flex flex-col gap-2 mb-6">
              <label className="text-xs uppercase tracking-widest opacity-70">Select Date</label>
              <input
                type="date"
                value={previewDate}
                onChange={e => setPreviewDate(e.target.value)}
                className="bg-transparent border border-wa-green/30 p-2 rounded focus:border-wa-green outline-none w-full"
              />
            </div>

            <div className="border-t border-wa-green/20 pt-4">
              <p className="text-xs uppercase tracking-widest opacity-60 mb-2">Resolution Result</p>
              {previewResult ? (
                <div>
                  <div className={`text-xl font-bold font-mono mb-2 ${previewResult.is_closed ? "text-wa-error" : "text-wa-text"}`}>
                    {previewResult.is_closed
                      ? "CLOSED"
                      : `${previewResult.open_time?.substring(0, 5)} — ${previewResult.close_time?.substring(0, 5)}`}
                  </div>
                  <div className="flex items-center gap-2 text-xs opacity-70 bg-wa-bg p-2 border border-wa-green/10 rounded">
                    <AlertTriangle className="w-3 h-3 text-wa-orange" />
                    Source: <span className="font-bold text-wa-orange uppercase tracking-wider">{previewResult.source_scope ?? previewResult.source}</span>
                  </div>
                </div>
              ) : (
                <div className="animate-pulse h-6 bg-wa-text/20 rounded w-3/4" />
              )}
            </div>
          </WAPanel>
        </div>
      </div>

      {/* Edit Modal */}
      {modalMode !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-wa-bg border border-wa-green/50 p-6 rounded-lg max-w-md w-full relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-wa-text/50 hover:text-wa-text">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold uppercase tracking-widest font-heading text-wa-green mb-6">
              {modalMode === "default"
                ? "Default Hours"
                : typeof modalMode === "object" && modalMode.type === "day_of_week"
                  ? `${DAYS.find(d => d.dow === modalMode.dow)?.name} Hours`
                  : "Date Override"}
            </h2>

            <form onSubmit={handleSave} className="flex flex-col gap-6">
              {/* Exact date picker */}
              {typeof modalMode === "object" && modalMode.type === "exact_date" && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70">Exact Date</label>
                  <input
                    type="date"
                    value={editExactDate}
                    onChange={e => setEditExactDate(e.target.value)}
                    className="bg-transparent border border-wa-text/20 p-2 rounded outline-none focus:border-wa-green"
                    required
                  />
                </div>
              )}

              {/* Custom vs default toggle for day overrides */}
              {typeof modalMode === "object" && modalMode.type === "day_of_week" && (
                <div className="flex items-center gap-4 border border-wa-text/20 p-3 rounded">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" checked={!useCustom} onChange={() => { setUseCustom(false); setEditIsClosed(false); }} className="accent-wa-green" />
                    Use Default Hours
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" checked={useCustom} onChange={() => setUseCustom(true)} className="accent-wa-orange" />
                    Custom Override
                  </label>
                </div>
              )}

              {/* Time pickers — shown for default always, for others when useCustom */}
              {(modalMode === "default" || useCustom) && (
                <>
                  <label className="flex items-center gap-3 p-3 border border-wa-error/30 bg-wa-error/5 rounded cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={editIsClosed}
                      onChange={e => setEditIsClosed(e.target.checked)}
                      className="w-4 h-4 accent-wa-error"
                    />
                    <span className="text-sm font-bold uppercase tracking-widest text-wa-error">Mark as Closed</span>
                  </label>

                  {!editIsClosed && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase tracking-widest opacity-70">Open Time</label>
                        <input
                          type="time"
                          value={editOpenTime}
                          onChange={e => setEditOpenTime(e.target.value)}
                          className="bg-transparent border border-wa-text/20 p-2 rounded outline-none focus:border-wa-green font-mono"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase tracking-widest opacity-70">Close Time</label>
                        <input
                          type="time"
                          value={editCloseTime}
                          onChange={e => setEditCloseTime(e.target.value)}
                          className="bg-transparent border border-wa-text/20 p-2 rounded outline-none focus:border-wa-green font-mono"
                          required
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

                <div className="flex flex-col gap-2 w-full">
                  <WAButton type="submit" className="bg-wa-green text-wa-bg font-bold w-full">
                    SAVE CHANGES
                  </WAButton>
                  
                  {/* Revert button for active overrides */}
                  {((typeof modalMode === "object" && modalMode.type === "day_of_week" && findDow(modalMode.dow)) ||
                    (typeof modalMode === "object" && modalMode.type === "exact_date" && hours.find(h => h.scope === 'exact_date' && h.exact_date === editExactDate))) && (
                    <WAButton 
                      type="button" 
                      variant="orange"
                      className="w-full font-bold"
                      onClick={async () => {
                        const targetId = typeof modalMode === "object" && modalMode.type === "day_of_week" 
                          ? findDow(modalMode.dow)?.id 
                          : hours.find(h => h.scope === 'exact_date' && h.exact_date === editExactDate)?.id;
                        
                        if (targetId) {
                          await handleDelete(targetId);
                          setModalMode(null);
                        }
                      }}
                    >
                      REVERT TO DEFAULT
                    </WAButton>
                  )}
                  
                  <WAButton type="button" variant="ghost" onClick={closeModal} className="w-full">
                    CANCEL
                  </WAButton>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
