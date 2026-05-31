"use client";

import React, { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { CalendarCheck, Plus, Pencil, Trash2, Loader2, Ghost } from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";

export default function EventsPage() {
  const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/events?from=${fromDate}&to=${toDate}`);
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [fromDate, toDate]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/v1/admin/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchEvents();
      } else {
        alert("Failed to delete event.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  };

  const openEditModal = (event: any) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const totalRevenue = events.reduce((sum, e) => sum + Number(e.total_revenue), 0);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading uppercase tracking-widest text-wa-green mb-2">EVENTS</h1>
          <p className="text-wa-text/60 uppercase text-xs tracking-wider">B2B events and corporate bookings</p>
        </div>
        
        <div className="flex gap-4 items-end bg-wa-bg/30 border border-wa-green/20 p-4 rounded-xl flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest opacity-50 font-bold">From</label>
            <input 
              type="date" 
              value={fromDate} 
              onChange={e => setFromDate(e.target.value)} 
              className="bg-transparent border border-wa-green/20 p-2 rounded text-xs outline-none focus:border-wa-green transition-colors text-wa-green font-mono [color-scheme:dark]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest opacity-50 font-bold">To</label>
            <input 
              type="date" 
              value={toDate} 
              onChange={e => setToDate(e.target.value)} 
              className="bg-transparent border border-wa-green/20 p-2 rounded text-xs outline-none focus:border-wa-green transition-colors text-wa-green font-mono [color-scheme:dark]"
            />
          </div>
          <WAButton onClick={openCreateModal} className="bg-wa-green text-wa-bg font-bold flex items-center gap-2 h-[38px] px-6 text-xs w-full md:w-auto mt-2 md:mt-0">
            <Plus className="w-4 h-4" /> NEW EVENT
          </WAButton>
        </div>
      </div>

      <WAPanel className="p-6 border-wa-green/30 bg-wa-green/5 max-w-sm">
        <div className="flex items-center gap-3 mb-2 opacity-70">
          <CalendarCheck className="w-4 h-4 text-wa-green" />
          <h3 className="uppercase tracking-widest text-[10px] font-bold">Total Event Revenue</h3>
        </div>
        <div className="text-2xl font-bold font-mono text-wa-green">{totalRevenue.toLocaleString()} EGP</div>
      </WAPanel>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4 opacity-50">
          <Loader2 className="w-8 h-8 animate-spin text-wa-green" />
          <p className="uppercase tracking-[0.3em] text-[10px]">Loading Events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-wa-line rounded-lg text-wa-text/40">
          <Ghost className="w-12 h-12 mb-4 opacity-20" />
          <p className="uppercase tracking-widest font-mono text-xs">No events recorded for this period.</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <WAPanel className="overflow-hidden border-wa-green/10 bg-wa-bg/30">
              <table className="w-full text-left text-xs">
                 <thead className="bg-wa-green/5 text-wa-green font-bold uppercase tracking-widest border-b border-wa-green/10">
                   <tr>
                     <th className="p-4">Date</th>
                     <th className="p-4">Title</th>
                     <th className="p-4">Client</th>
                     <th className="p-4 text-right">Revenue</th>
                     <th className="p-4">Notes</th>
                     <th className="p-4 text-center">Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {events.map(e => (
                     <tr key={e.id} className="border-b border-wa-green/5 hover:bg-wa-green/5 transition-colors">
                       <td className="p-4 font-mono opacity-60 whitespace-nowrap">{e.event_date}</td>
                       <td className="p-4 font-bold">{e.title}</td>
                       <td className="p-4">
                         {e.client_name || <span className="opacity-30">-</span>}
                         {e.client_phone && <div className="font-mono text-[10px] opacity-50 mt-1">{e.client_phone}</div>}
                       </td>
                       <td className="p-4 text-right font-bold text-wa-green whitespace-nowrap">{Number(e.total_revenue).toLocaleString()} EGP</td>
                       <td className="p-4 text-[10px] opacity-60 max-w-xs truncate">{e.notes || '-'}</td>
                       <td className="p-4 text-center whitespace-nowrap">
                         <button onClick={() => openEditModal(e)} className="text-wa-text/50 hover:text-wa-text transition-colors mx-2 p-1">
                           <Pencil className="w-4 h-4" />
                         </button>
                         <button onClick={() => handleDelete(e.id)} className="text-wa-error/50 hover:text-wa-error transition-colors mx-2 p-1">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
              </table>
            </WAPanel>
          </div>

          <div className="md:hidden flex flex-col gap-4">
            {events.map(e => (
              <WAPanel key={e.id} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start border-b border-wa-green/10 pb-2">
                  <div>
                    <div className="font-bold">{e.title}</div>
                    <div className="font-mono text-xs opacity-60 mt-1">{e.event_date}</div>
                  </div>
                  <div className="text-right font-bold text-wa-green">{Number(e.total_revenue).toLocaleString()} EGP</div>
                </div>
                {(e.client_name || e.client_phone) && (
                  <div className="text-xs">
                    {e.client_name && <div><span className="opacity-50 text-[10px] uppercase tracking-widest mr-2">Client:</span> {e.client_name}</div>}
                    {e.client_phone && <div><span className="opacity-50 text-[10px] uppercase tracking-widest mr-2">Phone:</span> <span className="font-mono">{e.client_phone}</span></div>}
                  </div>
                )}
                {e.notes && (
                  <div className="text-[10px] opacity-60 italic border-l-2 border-wa-green/20 pl-2 py-1">
                    {e.notes}
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2 border-t border-wa-green/10">
                  <WAButton variant="ghost" onClick={() => openEditModal(e)} className="px-3 py-1 h-auto text-xs"><Pencil className="w-3 h-3 mr-1" /> Edit</WAButton>
                  <WAButton variant="ghost" onClick={() => handleDelete(e.id)} className="px-3 py-1 h-auto text-xs text-wa-error hover:text-wa-error hover:bg-wa-error/10"><Trash2 className="w-3 h-3 mr-1" /> Delete</WAButton>
                </div>
              </WAPanel>
            ))}
          </div>
        </>
      )}

      {isModalOpen && (
        <EventModal 
          event={editingEvent} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchEvents();
          }} 
        />
      )}
    </div>
  );
}

function EventModal({ event, onClose, onSuccess }: { event: any, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    event_date: event?.event_date || format(new Date(), "yyyy-MM-dd"),
    title: event?.title || "",
    client_name: event?.client_name || "",
    client_phone: event?.client_phone || "",
    total_revenue: event?.total_revenue ? String(event.total_revenue) : "",
    notes: event?.notes || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const payload = {
        ...formData,
        total_revenue: Number(formData.total_revenue)
      };

      const url = event ? `/api/v1/admin/events/${event.id}` : '/api/v1/admin/events';
      const method = event ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSuccess();
      } else {
        const errData = await res.json();
        setError(`Failed to save event: ${errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      setError("Network error while saving event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <WAPanel className="max-w-lg w-full mx-4 p-8 border-wa-green/50 bg-wa-bg relative shadow-2xl">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-wa-text/30 hover:text-wa-text transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-wa-green mb-6">
          {event ? "Edit Event" : "Create Event"}
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <div className="text-wa-error text-xs bg-wa-error/10 p-3 rounded font-bold">{error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Event Date</label>
              <input 
                type="date" 
                required 
                value={formData.event_date}
                onChange={e => setFormData({...formData, event_date: e.target.value})}
                className="bg-transparent border border-wa-green/20 p-2 rounded text-sm outline-none focus:border-wa-green transition-colors text-wa-green font-mono [color-scheme:dark]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Total Revenue (EGP)</label>
              <input 
                type="number" 
                required 
                min="0.01"
                step="0.01"
                value={formData.total_revenue}
                onChange={e => setFormData({...formData, total_revenue: e.target.value})}
                className="bg-transparent border border-wa-green/20 p-2 rounded text-sm outline-none focus:border-wa-green transition-colors font-mono text-wa-green"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Event Title</label>
            <input 
              type="text" 
              required 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="bg-transparent border border-wa-green/20 p-2 rounded text-sm outline-none focus:border-wa-green transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Client Name <span className="opacity-50">(Optional)</span></label>
              <input 
                type="text" 
                value={formData.client_name}
                onChange={e => setFormData({...formData, client_name: e.target.value})}
                className="bg-transparent border border-wa-green/20 p-2 rounded text-sm outline-none focus:border-wa-green transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Client Phone <span className="opacity-50">(Optional)</span></label>
              <input 
                type="text" 
                value={formData.client_phone}
                onChange={e => setFormData({...formData, client_phone: e.target.value})}
                className="bg-transparent border border-wa-green/20 p-2 rounded text-sm outline-none focus:border-wa-green transition-colors font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Notes <span className="opacity-50">(Optional)</span></label>
            <textarea 
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="bg-transparent border border-wa-green/20 p-2 rounded text-sm outline-none focus:border-wa-green transition-colors resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <WAButton type="button" variant="ghost" onClick={onClose} disabled={loading}>
              CANCEL
            </WAButton>
            <WAButton type="submit" disabled={loading} className="bg-wa-green text-wa-bg font-bold min-w-[120px] flex justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (event ? "UPDATE" : "CREATE")}
            </WAButton>
          </div>
        </form>
      </WAPanel>
    </div>
  );
}
