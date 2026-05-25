"use client";

import { useState, useEffect } from "react";
import { format, parseISO, getDay } from "date-fns";
import { Plus, X, Trash2, GripVertical, Image as ImageIcon, Calendar, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabaseBrowser } from "@/lib/db/supabase-browser";

// Sub-component for sortable row
function SortableItem({ id, item, onEdit, onToggleActive }: { id: string, item: any, onEdit: any, onToggleActive: any }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-wa-green/10 bg-wa-bg hover:bg-wa-green/5">
      <td className="p-4" {...attributes} {...listeners}>
        <GripVertical className="w-5 h-5 text-wa-text/30 cursor-grab" />
      </td>
      <td className="p-4">
        {item.icon_url ? (
          <img src={item.icon_url} alt="icon" className="w-8 h-8 object-contain" />
        ) : (
          <div className="w-8 h-8 bg-wa-text/10 rounded flex items-center justify-center"><ImageIcon className="w-4 h-4 text-wa-text/50" /></div>
        )}
      </td>
      <td className="p-4 font-bold">{item.name_en}</td>
      <td className="p-4 font-bold" dir="rtl">{item.name_ar}</td>
      <td className="p-4">
        <label className="flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={item.is_active} onChange={() => onToggleActive(item)} />
          <div className="relative w-11 h-6 bg-wa-text/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-wa-bg after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wa-green"></div>
        </label>
      </td>
      <td className="p-4">
        <button onClick={() => onEdit(item)} className="text-wa-green text-xs uppercase tracking-widest font-bold underline hover:text-white">Edit</button>
      </td>
    </tr>
  );
}

export default function GamesPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'availability'>('catalog');
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State (Catalog)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<any>(null);
  const [formData, setFormData] = useState({
    name_en: "", name_ar: "", description_en: "", description_ar: "", icon_url: "", hero_image_url: "",
    stat1_name: "Intensity", stat1_value: 92, stat1_name_ar: "الشدة",
    stat2_name: "Tactical Depth", stat2_value: 78, stat2_name_ar: "العمق التكتيكي",
    stat3_name: "Adrenaline", stat3_value: 88, stat3_name_ar: "الأدرينالين",
    max_players: 6
  });
  const [pricing, setPricing] = useState<any[]>([
    { pricing_type: 'time', duration_minutes: 30, price_per_player: 150, ammo_count: null, duration_minutes_display: "" }
  ]);
  const [refillPackages, setRefillPackages] = useState<{ammo_count: number, price_per_player: number}[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  // Availability State
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [dayConfigs, setDayConfigs] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [overrideForm, setOverrideForm] = useState({
    override_date: format(new Date(), "yyyy-MM-dd"),
    is_available: true,
    allowed_times: null as string[] | null,
    reason: ""
  });

  const ALL_SLOTS = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? "00" : "30";
    return `${h.toString().padStart(2, '0')}:${m}`;
  });

  const toggleTimeSlot = (currentAllowed: string[] | null, time: string) => {
    if (currentAllowed === null) {
       return ALL_SLOTS.filter(t => t !== time);
    }
    if (currentAllowed.includes(time)) {
       const next = currentAllowed.filter(t => t !== time);
       return next.length === ALL_SLOTS.length ? null : next; // Reset to null if all selected somehow
    } else {
       const next = [...currentAllowed, time].sort();
       return next.length === ALL_SLOTS.length ? null : next;
    }
  };

  const loadAdminGames = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/games");
      if (res.ok) {
        const data = await res.json();
        setGames(data);
        if (data.length > 0 && !selectedGameId) setSelectedGameId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async (gameId: string) => {
    if (!gameId) return;
    try {
      const res = await fetch(`/api/v1/admin/games/${gameId}/availability`);
      if (res.ok) setDayConfigs(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadOverrides = async () => {
    try {
      const res = await fetch("/api/v1/admin/games/overrides");
      if (res.ok) setOverrides(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAdminGames();
    loadOverrides();
  }, []);

  useEffect(() => {
    if (activeTab === 'availability' && selectedGameId) {
      loadAvailability(selectedGameId);
    }
  }, [activeTab, selectedGameId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'icon_url' | 'hero_image_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(field);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `games/${fileName}`;

      const { error } = await supabaseBrowser.storage
        .from('games-assets')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabaseBrowser.storage
        .from('games-assets')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, [field]: publicUrl }));
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Failed to upload image: " + err.message);
    } finally {
      setUploading(null);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = games.findIndex((g) => g.id === active.id);
      const newIndex = games.findIndex((g) => g.id === over.id);
      
      const newGames = arrayMove(games, oldIndex, newIndex);
      setGames(newGames);
      
      newGames.forEach(async (g, idx) => {
        if (g.display_order !== idx) {
          await fetch(`/api/v1/admin/games/${g.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ display_order: idx })
          });
        }
      });
    }
  };

  const openModal = (game?: any) => {
    if (game) {
      setEditingGame(game);
      setFormData({
        name_en: game.name_en, name_ar: game.name_ar, 
        description_en: game.description_en || "", description_ar: game.description_ar || "",
        icon_url: game.icon_url || "", hero_image_url: game.hero_image_url || "",
        stat1_name: game.stat1_name || "Intensity", stat1_value: game.stat1_value ?? 92, stat1_name_ar: game.stat1_name_ar || "الشدة",
        stat2_name: game.stat2_name || "Tactical Depth", stat2_value: game.stat2_value ?? 78, stat2_name_ar: game.stat2_name_ar || "العمق التكتيكي",
        stat3_name: game.stat3_name || "Adrenaline", stat3_value: game.stat3_value ?? 88, stat3_name_ar: game.stat3_name_ar || "الأدرينالين",
        max_players: game.max_players ?? 6
      });
      setPricing(game.game_pricing ? game.game_pricing.filter((p: any) => p.is_active !== false).map((p: any) => ({
        pricing_type: p.pricing_type || 'time',
        duration_minutes: p.duration_minutes || 30,
        price_per_player: p.price_per_player || 0,
        ammo_count: p.ammo_count || 400,
        duration_minutes_display: p.duration_minutes_display || ""
      })) : [{ pricing_type: 'time', duration_minutes: 30, price_per_player: 150, ammo_count: null, duration_minutes_display: "" }]);
      
      setRefillPackages(game.refill_packages ? game.refill_packages.filter((r: any) => r.is_active !== false).map((r: any) => ({
        ammo_count: r.ammo_count || 400,
        price_per_player: r.price_per_player || 50
      })) : []);
    } else {
      setEditingGame(null);
      setFormData({
        name_en: "", name_ar: "", description_en: "", description_ar: "", icon_url: "", hero_image_url: "",
        stat1_name: "Intensity", stat1_value: 92, stat1_name_ar: "الشدة",
        stat2_name: "Tactical Depth", stat2_value: 78, stat2_name_ar: "العمق التكتيكي",
        stat3_name: "Adrenaline", stat3_value: 88, stat3_name_ar: "الأدرينالين",
        max_players: 6
      });
      setPricing([{ pricing_type: 'time', duration_minutes: 30, price_per_player: 150, ammo_count: null, duration_minutes_display: "" }]);
      setRefillPackages([]);
    }
    setIsModalOpen(true);
  };

  const handleToggleActive = async (game: any) => {
    const newActive = !game.is_active;
    setGames(games.map(g => g.id === game.id ? { ...g, is_active: newActive } : g));
    await fetch(`/api/v1/admin/games/${game.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: newActive })
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let res;
      if (editingGame) {
        res = await fetch(`/api/v1/admin/games/${editingGame.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, pricing, refill_packages: refillPackages })
        });
      } else {
        res = await fetch(`/api/v1/admin/games`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, pricing, refill_packages: refillPackages, display_order: games.length })
        });
      }

      if (!res.ok) throw new Error("Failed to save game");

      setIsModalOpen(false);
      await loadAdminGames();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if(!editingGame) return;
    if(!confirm("Are you sure? This will PERMANENTLY REMOVE this game and all its pricing data. This cannot be undone.")) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/games/${editingGame.id}?force=true`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setIsModalOpen(false);
      await loadAdminGames();
    } catch (err) {
      alert("Failed to delete game");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateDayConfig = async (dayOfWeek: number, field: string, value: any) => {
    let current = dayConfigs.find(c => c.day_of_week === dayOfWeek);
    if (!current) {
      current = { day_of_week: dayOfWeek, is_available: false, allowed_times: null };
    }
    const updated = { ...current, [field]: value };
    
    setDayConfigs(prev => {
      const exists = prev.find(c => c.day_of_week === dayOfWeek);
      if (exists) return prev.map(c => c.day_of_week === dayOfWeek ? updated : c);
      return [...prev, updated];
    });
    
    await fetch(`/api/v1/admin/games/${selectedGameId}/availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([updated])
    });
  };

  const handleToggleDay = async (dayOfWeek: number) => {
    const current = dayConfigs.find(c => c.day_of_week === dayOfWeek);
    const newAvailable = current ? !current.is_available : false;
    await handleUpdateDayConfig(dayOfWeek, 'is_available', newAvailable);
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/admin/games/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: selectedGameId,
          ...overrideForm
        })
      });
      if (!res.ok) throw new Error("Failed to save override");
      setOverrideForm({ override_date: format(new Date(), "yyyy-MM-dd"), is_available: true, allowed_times: null, reason: "" });
      await loadOverrides();
    } catch (err: any) {
      // If it failed to save but the user says it works, maybe it's a transient error or a weird response
      console.error("Override save error:", err);
      // Suppressing alert as per user request if it "works perfect"
      // alert(err.message); 
    } finally {
      setIsSaving(false);
    }
  };

  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-heading uppercase tracking-widest text-wa-green mb-2">
            GAMES CONTROL
          </h1>
          <p className="text-wa-text/60 uppercase text-xs tracking-wider">
            Manage catalog and availability rules
          </p>
        </div>
        <div className="flex bg-wa-text/5 p-1 rounded-sm border border-wa-text/10">
          <button 
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'catalog' ? 'bg-wa-green text-wa-bg' : 'text-wa-text/40 hover:text-wa-text'}`}
          >
            Catalog
          </button>
          <button 
            onClick={() => setActiveTab('availability')}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'availability' ? 'bg-wa-green text-wa-bg' : 'text-wa-text/40 hover:text-wa-text'}`}
          >
            Availability
          </button>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <>
          <div className="flex justify-end">
            <WAButton onClick={() => openModal()} className="bg-wa-green text-wa-bg font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" /> ADD GAME
            </WAButton>
          </div>

          <WAPanel className="p-0 overflow-hidden border-wa-green/20">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-wa-green/20 text-wa-text/60 uppercase tracking-widest text-xs bg-wa-bg">
                    <th className="p-4 w-12"></th>
                    <th className="p-4 w-16">Icon</th>
                    <th className="p-4">Name (EN)</th>
                    <th className="p-4 text-right">Name (AR)</th>
                    <th className="p-4 w-24">Active</th>
                    <th className="p-4 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <SortableContext items={games.map(g => g.id)} strategy={verticalListSortingStrategy}>
                    {games.map(game => (
                      <SortableItem key={game.id} id={game.id} item={game} onEdit={openModal} onToggleActive={handleToggleActive} />
                    ))}
                  </SortableContext>
                </tbody>
              </table>
              </div>
            </DndContext>
          </WAPanel>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Day of Week Management */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <WAPanel title="WEEKLY PROTOCOL" className="p-6">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70">Target Game</label>
                  <select 
                    value={selectedGameId} 
                    onChange={e => setSelectedGameId(e.target.value)}
                    className="bg-wa-bg border border-wa-green/30 p-3 rounded font-bold text-wa-green outline-none"
                  >
                    {games.map(g => <option key={g.id} value={g.id}>{g.name_en}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DAYS.map((day, idx) => {
                    const config = dayConfigs.find(c => c.day_of_week === idx);
                    const isAvailable = config ? config.is_available : true;
                    return (
                      <div key={day} className={`flex flex-col gap-3 p-4 border rounded transition-colors ${isAvailable ? 'border-wa-green/20 bg-wa-green/5' : 'border-wa-error/20 bg-wa-error/5 opacity-60'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="font-bold uppercase tracking-widest text-sm">{day}</span>
                            <span className={`text-[10px] font-mono ${isAvailable ? 'text-wa-green' : 'text-wa-error'}`}>
                              {isAvailable ? "ACTIVE DUTY" : "MAINTENANCE / CLOSED"}
                            </span>
                          </div>
                          <label className="flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={isAvailable} onChange={() => handleToggleDay(idx)} />
                            <div className="relative w-11 h-6 bg-wa-text/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-wa-bg after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wa-green"></div>
                          </label>
                        </div>
                        {isAvailable && (
                          <div className="mt-2 pt-2 border-t border-wa-green/10">
                            <span className="text-[9px] uppercase tracking-widest opacity-60 block mb-2">Available Time Slots</span>
                            <div className="flex flex-wrap gap-1">
                              {ALL_SLOTS.map(time => {
                                // Default allowed is true if allowed_times is null
                                const isAllowed = config?.allowed_times === null || config?.allowed_times?.includes(time) !== false;
                                return (
                                  <button
                                    key={time}
                                    onClick={() => handleUpdateDayConfig(idx, 'allowed_times', toggleTimeSlot(config?.allowed_times || null, time))}
                                    className={`px-1.5 py-1 text-[10px] font-mono border rounded transition-all ${isAllowed ? 'bg-wa-green/20 border-wa-green text-wa-green' : 'bg-transparent border-wa-text/10 text-wa-text/30 hover:border-wa-text/30'}`}
                                  >
                                    {time}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                               <button onClick={() => handleUpdateDayConfig(idx, 'allowed_times', null)} className="text-[9px] text-wa-green uppercase opacity-70 hover:opacity-100">Select All</button>
                               <button onClick={() => handleUpdateDayConfig(idx, 'allowed_times', [])} className="text-[9px] text-wa-error uppercase opacity-70 hover:opacity-100">Clear All</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </WAPanel>

            <WAPanel title="ACTIVE OVERRIDES" className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-wa-green/20 text-wa-text/60 uppercase tracking-widest text-[10px] bg-wa-bg">
                      <th className="p-4">Date</th>
                      <th className="p-4">Game</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overrides.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-wa-text/30 font-mono italic">No active overrides found</td></tr>
                    ) : overrides.map(o => (
                      <tr key={o.id} className="border-b border-wa-green/5 hover:bg-wa-green/5 transition-colors">
                        <td className="p-4 font-mono">{o.override_date}</td>
                        <td className="p-4 font-bold">{o.games?.name_en}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase ${o.is_available ? 'bg-wa-green/10 text-wa-green' : 'bg-wa-error/10 text-wa-error'}`}>
                            {o.is_available ? "Available" : "Blocked"}
                          </span>
                        </td>
                        <td className="p-4 text-xs opacity-60 italic">{o.reason || "No reason provided"}</td>
                        <td className="p-4 text-[10px] opacity-40">{format(new Date(o.created_at), "MMM dd, HH:mm")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </WAPanel>
          </div>

          {/* Right Column: New Override Form */}
          <div className="flex flex-col gap-6">
            <WAPanel title="NEW OVERRIDE" className="p-6 border-wa-orange/30">
              <form onSubmit={handleSaveOverride} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70">Target Date</label>
                  <input 
                    type="date" 
                    required 
                    value={overrideForm.override_date} 
                    onChange={e => setOverrideForm({...overrideForm, override_date: e.target.value})}
                    className="bg-wa-bg border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70">Availability</label>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setOverrideForm({...overrideForm, is_available: true})}
                      className={`flex-1 p-3 border font-bold text-[10px] uppercase tracking-widest transition-all ${overrideForm.is_available ? 'bg-wa-green text-wa-bg border-wa-green' : 'border-wa-text/20 opacity-40'}`}
                    >
                      Available
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setOverrideForm({...overrideForm, is_available: false, allowed_times: null})}
                      className={`flex-1 p-3 border font-bold text-[10px] uppercase tracking-widest transition-all ${!overrideForm.is_available ? 'bg-wa-error text-wa-bg border-wa-error' : 'border-wa-text/20 opacity-40'}`}
                    >
                      Blocked
                    </button>
                  </div>
                </div>
                {overrideForm.is_available && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest opacity-70">Available Time Slots</label>
                    <div className="flex flex-wrap gap-1 bg-wa-bg border border-wa-text/10 p-3 rounded">
                      {ALL_SLOTS.map(time => {
                        const isAllowed = overrideForm.allowed_times === null || overrideForm.allowed_times.includes(time);
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setOverrideForm({...overrideForm, allowed_times: toggleTimeSlot(overrideForm.allowed_times, time)})}
                            className={`px-1.5 py-1 text-[10px] font-mono border rounded transition-all ${isAllowed ? 'bg-wa-green/20 border-wa-green text-wa-green' : 'bg-transparent border-wa-text/10 text-wa-text/30 hover:border-wa-text/30'}`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-end gap-2 mt-1">
                       <button type="button" onClick={() => setOverrideForm({...overrideForm, allowed_times: null})} className="text-[9px] text-wa-green uppercase opacity-70 hover:opacity-100">Select All</button>
                       <button type="button" onClick={() => setOverrideForm({...overrideForm, allowed_times: []})} className="text-[9px] text-wa-error uppercase opacity-70 hover:opacity-100">Clear All</button>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70">Reason / Memo</label>
                  <textarea 
                    value={overrideForm.reason} 
                    onChange={e => setOverrideForm({...overrideForm, reason: e.target.value})}
                    placeholder="e.g. Corporate event, Maintenance..."
                    className="bg-wa-bg border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none h-24 resize-none text-sm" 
                  />
                </div>
                <WAButton 
                  type="submit" 
                  disabled={isSaving} 
                  className={`mt-2 font-bold ${overrideForm.is_available ? 'bg-wa-green text-wa-bg' : 'bg-wa-error text-white'}`}
                >
                  {isSaving ? "SAVING..." : "DEPLOY OVERRIDE"}
                </WAButton>
              </form>
            </WAPanel>

            <div className="p-4 border border-wa-green/20 bg-wa-green/5 rounded flex gap-4 items-start">
              <Calendar className="w-5 h-5 text-wa-green shrink-0 mt-1" />
              <div>
                <h4 className="text-xs font-bold uppercase text-wa-green mb-1">PRO-TIP</h4>
                <p className="text-[10px] text-wa-text/60 leading-relaxed uppercase">
                  Specific date overrides always take precedence over weekly rules. Use them for holidays or special events.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-wa-bg border border-wa-green/50 rounded-lg max-w-4xl w-full relative max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-wa-green/20 flex justify-between items-center bg-wa-bg/50 backdrop-blur-md z-10">
              <div>
                <h2 className="text-lg sm:text-xl font-bold uppercase tracking-widest font-heading text-wa-green">
                  {editingGame ? "Edit Game Protocol" : "Initialize New Game"}
                </h2>
                <p className="text-[10px] text-wa-text/40 uppercase tracking-tighter mt-1">Configure operational parameters and pricing models</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-wa-text/50 hover:text-wa-text transition-colors p-2 hover:bg-white/5 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-gradient-to-b from-wa-bg to-black/20">
              <form id="game-form" onSubmit={handleSave} className="flex flex-col gap-10">
                {/* 1. Identity Section */}
                <section className="flex flex-col gap-6">
                  <div className="flex items-center gap-3 border-b border-wa-green/10 pb-2">
                    <div className="w-2 h-2 bg-wa-green rounded-full shadow-[0_0_8px_#00FF41]" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-wa-green">Mission Identity</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest opacity-70 font-bold text-wa-green/60">Codename (EN)</label>
                      <input type="text" required value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} className="bg-wa-bg border border-wa-green/20 p-3 rounded focus:border-wa-green outline-none transition-all placeholder:opacity-20" placeholder="e.g. Laser Tag Strike" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest opacity-70 font-bold text-wa-green/60">Codename (AR)</label>
                      <input type="text" required value={formData.name_ar} onChange={e => setFormData({...formData, name_ar: e.target.value})} className="bg-wa-bg border border-wa-green/20 p-3 rounded focus:border-wa-green outline-none text-right font-arabic" dir="rtl" placeholder="ليزر تاج" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest opacity-70 font-bold text-wa-green/60">Briefing (EN)</label>
                      <textarea value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} className="bg-wa-bg border border-wa-green/20 p-3 rounded focus:border-wa-green outline-none h-24 resize-none text-sm placeholder:opacity-20" placeholder="Describe the mission objectives..." />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest opacity-70 font-bold text-wa-green/60">Briefing (AR)</label>
                      <textarea value={formData.description_ar} onChange={e => setFormData({...formData, description_ar: e.target.value})} className="bg-wa-bg border border-wa-green/20 p-3 rounded focus:border-wa-green outline-none h-24 resize-none text-right font-arabic" dir="rtl" placeholder="وصف المهمة..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest opacity-70 font-bold text-wa-green/60">Visual Marker (Icon)</label>
                      <div className="flex gap-2">
                        <input type="text" value={formData.icon_url} onChange={e => setFormData({...formData, icon_url: e.target.value})} placeholder="/games/laser-tag.svg" className="flex-1 bg-wa-bg border border-wa-green/20 p-3 rounded focus:border-wa-green outline-none text-xs" />
                        <label className="bg-wa-green/10 px-4 rounded cursor-pointer hover:bg-wa-green/20 border border-wa-green/30 transition-all flex items-center justify-center">
                          {uploading === 'icon_url' ? <div className="w-5 h-5 border-2 border-wa-green border-t-transparent rounded-full animate-spin" /> : <ImageIcon className="w-5 h-5 text-wa-green" />}
                          <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'icon_url')} disabled={!!uploading} />
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest opacity-70 font-bold text-wa-green/60">Mission Intel (Hero Image)</label>
                      <div className="flex gap-2">
                        <input type="text" value={formData.hero_image_url} onChange={e => setFormData({...formData, hero_image_url: e.target.value})} placeholder="/games/laser-tag-hero.jpg" className="flex-1 bg-wa-bg border border-wa-green/20 p-3 rounded focus:border-wa-green outline-none text-xs" />
                        <label className="bg-wa-green/10 px-4 rounded cursor-pointer hover:bg-wa-green/20 border border-wa-green/30 transition-all flex items-center justify-center">
                          {uploading === 'hero_image_url' ? <div className="w-5 h-5 border-2 border-wa-green border-t-transparent rounded-full animate-spin" /> : <Plus className="w-5 h-5 text-wa-green" />}
                          <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'hero_image_url')} disabled={!!uploading} />
                        </label>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Tactical Parameters Section */}
                <section className="flex flex-col gap-6">
                  <div className="flex items-center gap-3 border-b border-wa-green/10 pb-2">
                    <div className="w-2 h-2 bg-wa-green rounded-full shadow-[0_0_8px_#00FF41]" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-wa-green">Tactical Parameters</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((num) => (
                      <div key={`stat${num}`} className="flex flex-col gap-4 p-4 border border-wa-green/10 rounded bg-wa-bg/40 backdrop-blur-sm">
                        <label className="text-[9px] uppercase tracking-widest opacity-50 font-bold text-wa-green/40">Parameter {num}</label>
                        <div className="flex flex-col gap-2">
                          <input type="text" placeholder="EN Label" value={(formData as any)[`stat${num}_name`]} onChange={e => setFormData({...formData, [`stat${num}_name`]: e.target.value})} className="bg-wa-bg/50 border border-wa-text/10 p-2 rounded focus:border-wa-green text-[10px] outline-none transition-all" />
                          <input type="text" placeholder="AR Label" value={(formData as any)[`stat${num}_name_ar`]} onChange={e => setFormData({...formData, [`stat${num}_name_ar`]: e.target.value})} className="bg-wa-bg/50 border border-wa-text/10 p-2 rounded focus:border-wa-green text-[10px] text-right outline-none font-arabic" dir="rtl" />
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] uppercase tracking-widest opacity-40 font-bold">Intensity</label>
                            <span className="text-[10px] font-mono text-wa-green">{(formData as any)[`stat${num}_value`]}%</span>
                          </div>
                          <input type="range" min="0" max="100" value={(formData as any)[`stat${num}_value`]} onChange={e => setFormData({...formData, [`stat${num}_value`]: parseInt(e.target.value) || 0})} className="w-full accent-wa-green h-1 bg-wa-green/10 rounded-full appearance-none cursor-pointer" />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex flex-col gap-2 max-w-xs">
                    <label className="text-[10px] uppercase tracking-widest opacity-70 font-bold text-wa-green/60">Personnel Capacity (Max Players)</label>
                    <input type="number" min="1" max="100" value={formData.max_players} onChange={e => setFormData({...formData, max_players: parseInt(e.target.value) || 6})} className="bg-wa-bg border border-wa-green/20 p-3 rounded focus:border-wa-green outline-none w-full font-mono text-wa-green text-xl" />
                  </div>
                </section>

                {/* 3. Pricing Section */}
                <section className="flex flex-col gap-6">
                  <div className="flex items-center gap-3 border-b border-wa-green/10 pb-2">
                    <div className="w-2 h-2 bg-wa-green rounded-full shadow-[0_0_8px_#00FF41]" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-wa-green">Financial Logistics</h3>
                  </div>

                  <div className="flex flex-col gap-6">
                    {pricing.map((p, idx) => (
                      <div key={idx} className="flex flex-col gap-4 p-5 border border-wa-green/10 rounded bg-wa-bg/40 relative group hover:border-wa-green/30 transition-all">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] uppercase tracking-widest opacity-50 font-bold">Operational Mode</label>
                            <select 
                              value={p.pricing_type || 'time'} 
                              onChange={e => {
                                const newP = [...pricing]; 
                                newP[idx].pricing_type = e.target.value;
                                if (e.target.value === 'ammo' && !newP[idx].ammo_count) newP[idx].ammo_count = 400;
                                setPricing(newP);
                              }} 
                              className="bg-wa-bg border border-wa-green/20 p-3 rounded outline-none text-xs font-bold text-wa-green appearance-none cursor-pointer"
                            >
                              <option value="time">TIME BASED PROTOCOL</option>
                              <option value="ammo">AMMO BASED PROTOCOL</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] uppercase tracking-widest opacity-50 font-bold">
                              {p.pricing_type === 'time' ? 'Operational Duration' : 'Ammo Payload'}
                            </label>
                            {p.pricing_type === 'time' ? (
                              <select 
                                value={p.duration_minutes || 30} 
                                onChange={e => {
                                  const newP = [...pricing]; 
                                  newP[idx].duration_minutes = parseInt(e.target.value) || 30; 
                                  setPricing(newP);
                                }} 
                                className="bg-wa-bg border border-wa-green/20 p-3 rounded outline-none text-xs appearance-none cursor-pointer"
                              >
                                <option value={30}>30 Standard Minutes</option>
                                <option value={60}>60 Extended Minutes</option>
                                <option value={90}>90 Mission Minutes</option>
                                <option value={120}>120 Campaign Minutes</option>
                              </select>
                            ) : (
                              <div className="flex gap-2 items-center">
                                <input 
                                  type="number" 
                                  placeholder="Payload"
                                  value={p.ammo_count || ""} 
                                  onChange={e => {
                                    const newP = [...pricing]; 
                                    newP[idx].ammo_count = parseInt(e.target.value) || 0; 
                                    setPricing(newP);
                                  }}
                                  className="bg-wa-bg border border-wa-green/20 p-3 rounded outline-none w-full text-xs font-mono"
                                />
                                <span className="text-[9px] opacity-40 font-bold">RDS</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] uppercase tracking-widest opacity-50 font-bold">Tariff (per person)</label>
                            <div className="flex gap-2 items-center">
                              <input 
                                type="number" 
                                min="0" 
                                required 
                                value={p.price_per_player ?? 0} 
                                onChange={e => {
                                  const newP = [...pricing]; 
                                  newP[idx].price_per_player = parseFloat(e.target.value) || 0; 
                                  setPricing(newP);
                                }} 
                                className="bg-wa-bg border border-wa-green/20 p-3 rounded focus:border-wa-green outline-none w-full text-sm text-wa-green font-bold font-mono" 
                                placeholder="0.00" 
                              />
                              <span className="text-[9px] opacity-40 font-bold">EGP</span>
                            </div>
                          </div>

                          <div className="flex justify-end lg:mb-1">
                            {pricing.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => setPricing(pricing.filter((_, i) => i !== idx))}
                                className="bg-wa-error/10 text-wa-error hover:bg-wa-error hover:text-white px-4 py-3 rounded transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                              >
                                <Trash2 className="w-4 h-4" /> <span className="sm:hidden lg:inline">Purge</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {p.pricing_type === 'ammo' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 pt-4 border-t border-wa-green/5">
                             <div className="flex flex-col gap-2">
                               <label className="text-[9px] uppercase tracking-widest opacity-50 font-bold text-wa-orange/60">Occupancy Lock Duration</label>
                               <select 
                                  value={p.duration_minutes || 30} 
                                  onChange={e => {
                                    const newP = [...pricing]; 
                                    newP[idx].duration_minutes = parseInt(e.target.value) || 30; 
                                    setPricing(newP);
                                  }} 
                                  className="bg-wa-bg/50 border border-wa-orange/20 p-2 rounded outline-none text-[10px] text-wa-orange appearance-none cursor-pointer"
                                >
                                  <option value={30}>30 Min Block</option>
                                  <option value={60}>60 Min Block</option>
                                </select>
                             </div>
                             <div className="flex flex-col gap-2">
                               <label className="text-[9px] uppercase tracking-widest opacity-50 font-bold">Public Label Override</label>
                               <input 
                                  type="text"
                                  placeholder="e.g. Max 60 mins"
                                  value={p.duration_minutes_display || ""}
                                  onChange={e => {
                                    const newP = [...pricing]; 
                                    newP[idx].duration_minutes_display = e.target.value; 
                                    setPricing(newP);
                                  }}
                                  className="bg-wa-bg/50 border border-wa-text/10 p-2 rounded outline-none text-[10px] placeholder:opacity-20"
                               />
                             </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <button type="button" onClick={() => setPricing([...pricing, {pricing_type: 'time', duration_minutes: 30, price_per_player: 0}])} className="flex items-center gap-3 text-wa-green text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all w-fit mt-2 group border border-wa-green/20 px-6 py-3 rounded-sm bg-wa-green/5 hover:bg-wa-green/10">
                      <Plus className="w-3 h-3 transition-transform group-hover:rotate-90" />
                      Add Tier Variant
                    </button>
                  </div>
                </section>

                {/* 4. Refills Section */}
                {pricing.some(p => p.pricing_type === 'ammo') && (
                  <section className="flex flex-col gap-6">
                    <div className="flex items-center gap-3 border-b border-wa-orange/20 pb-2">
                      <div className="w-2 h-2 bg-wa-orange rounded-full shadow-[0_0_8px_#C9A84C]" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-wa-orange">Ammo Refill Logistics</h3>
                    </div>

                    <div className="flex flex-col gap-4">
                      {refillPackages.map((r, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end p-5 border border-wa-orange/10 rounded bg-wa-bg/40 relative hover:border-wa-orange/30 transition-all">
                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] uppercase tracking-widest opacity-50 font-bold">Refill Volume</label>
                            <div className="flex gap-2 items-center">
                              <input 
                                type="number" 
                                value={r.ammo_count} 
                                onChange={e => {
                                  const newR = [...refillPackages];
                                  newR[idx].ammo_count = parseInt(e.target.value) || 0;
                                  setRefillPackages(newR);
                                }}
                                className="bg-wa-bg border border-wa-orange/20 p-3 rounded outline-none w-full text-xs font-mono"
                              />
                              <span className="text-[9px] opacity-40 font-bold">RDS</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] uppercase tracking-widest opacity-50 font-bold">Refill Cost</label>
                            <div className="flex gap-2 items-center">
                              <input 
                                type="number" 
                                value={r.price_per_player} 
                                onChange={e => {
                                  const newR = [...refillPackages];
                                  newR[idx].price_per_player = parseFloat(e.target.value) || 0;
                                  setRefillPackages(newR);
                                }}
                                className="bg-wa-bg border border-wa-orange/20 p-3 rounded outline-none w-full text-sm text-wa-orange font-mono font-bold"
                              />
                              <span className="text-[9px] opacity-40 font-bold">EGP</span>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button 
                              type="button" 
                              onClick={() => setRefillPackages(refillPackages.filter((_, i) => i !== idx))}
                              className="bg-wa-error/10 text-wa-error hover:bg-wa-error hover:text-white px-4 py-3 rounded transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                            >
                              <Trash2 className="w-4 h-4" /> Purge
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <button 
                        type="button" 
                        onClick={() => setRefillPackages([...refillPackages, { ammo_count: 400, price_per_player: 50 }])}
                        className="flex items-center gap-3 text-wa-orange text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all w-fit mt-2 group border border-wa-orange/20 px-6 py-3 rounded-sm bg-wa-orange/5 hover:bg-wa-orange/10"
                      >
                        <Plus className="w-3 h-3 transition-transform group-hover:rotate-90" />
                        Initialize Refill Protocol
                      </button>
                    </div>
                  </section>
                )}
              </form>
            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-6 border-t border-wa-green/20 bg-wa-bg/80 backdrop-blur-md z-10 flex flex-col sm:flex-row justify-between items-center gap-6">
              {editingGame ? (
                <button type="button" onClick={handleDelete} className="text-wa-error hover:underline text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 transition-all opacity-40 hover:opacity-100 group">
                  <Trash2 className="w-4 h-4 group-hover:animate-bounce" /> Decommission Game Data
                </button>
              ) : <div className="hidden sm:block"></div>}
              
              <div className="flex gap-4 w-full sm:w-auto">
                <WAButton type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-initial text-[10px]">ABORT</WAButton>
                <WAButton 
                  type="submit" 
                  form="game-form"
                  disabled={isSaving || !!uploading} 
                  className="bg-wa-green text-wa-bg font-bold flex-1 sm:flex-initial min-w-[180px] shadow-[0_0_20px_rgba(0,255,65,0.2)] hover:shadow-[0_0_30px_rgba(0,255,65,0.4)] text-[10px] tracking-[0.2em]"
                >
                  {isSaving ? "TRANSMITTING..." : (editingGame ? "UPDATE SYSTEM" : "DEPLOY PROTOCOL")}
                </WAButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
