"use client";

import { useState, useEffect } from "react";
import { Plus, X, Trash2, GripVertical, Target, Image as ImageIcon } from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";
import { supabaseBrowser } from "@/lib/db/supabase-browser";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
        <div className="w-12 h-12 bg-wa-text/10 rounded overflow-hidden flex items-center justify-center border border-wa-green/10">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name_en} className="w-full h-full object-cover" />
          ) : (
            <Target className="w-6 h-6 text-wa-text/30" />
          )}
        </div>
      </td>
      <td className="p-4 font-bold">{item.name_en}</td>
      <td className="p-4 font-bold text-right" dir="rtl">{item.name_ar}</td>
      <td className="p-4">
        <span className="text-wa-green font-mono">+{item.additional_price_per_player} EGP</span>
      </td>
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

export default function MissionsPage() {
  const [missions, setMissions] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<any>(null);
  const [formData, setFormData] = useState({
    name_en: "", name_ar: "", description_en: "", description_ar: "", 
    rules_en: "", rules_ar: "", image_url: "", 
    additional_price_per_player: 0, duration_bonus_minutes: 0,
    min_players: 2, max_players: 6, compatible_games: [] as string[]
  });
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [missionsRes, gamesRes] = await Promise.all([
        fetch("/api/v1/admin/missions"),
        fetch("/api/v1/games")
      ]);
      if (missionsRes.ok) setMissions(await missionsRes.json());
      if (gamesRes.ok) setGames(await gamesRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = missions.findIndex((m) => m.id === active.id);
      const newIndex = missions.findIndex((m) => m.id === over.id);
      
      const newMissions = arrayMove(missions, oldIndex, newIndex);
      setMissions(newMissions);
      
      // Update sort_order in background
      newMissions.forEach(async (m, idx) => {
        if (m.sort_order !== idx) {
          await fetch(`/api/v1/admin/missions/${m.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sort_order: idx })
          });
        }
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `mission_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `missions/${fileName}`;

      const { error } = await supabaseBrowser.storage
        .from('games-assets')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabaseBrowser.storage
        .from('games-assets')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Failed to upload image: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const openModal = (mission?: any) => {
    if (mission) {
      setEditingMission(mission);
      setFormData({
        name_en: mission.name_en, name_ar: mission.name_ar || "",
        description_en: mission.description_en || "", description_ar: mission.description_ar || "",
        rules_en: mission.rules_en || "", rules_ar: mission.rules_ar || "",
        image_url: mission.image_url || "",
        additional_price_per_player: mission.additional_price_per_player || 0,
        duration_bonus_minutes: mission.duration_bonus_minutes || 0,
        min_players: mission.min_players || 2,
        max_players: mission.max_players || 6,
        compatible_games: mission.compatible_games || []
      });
    } else {
      setEditingMission(null);
      setFormData({
        name_en: "", name_ar: "", description_en: "", description_ar: "", 
        rules_en: "", rules_ar: "", image_url: "", 
        additional_price_per_player: 0, duration_bonus_minutes: 0,
        min_players: 2, max_players: 6, compatible_games: []
      });
    }
    setIsModalOpen(true);
  };

  const handleToggleActive = async (mission: any) => {
    const newActive = !mission.is_active;
    setMissions(missions.map(m => m.id === mission.id ? { ...m, is_active: newActive } : m));
    await fetch(`/api/v1/admin/missions/${mission.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: newActive })
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let res;
      if (editingMission) {
        res = await fetch(`/api/v1/admin/missions/${editingMission.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch(`/api/v1/admin/missions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, sort_order: missions.length })
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save mission");
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save mission");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if(!editingMission) return;
    if(!confirm("Are you sure? This cannot be undone.")) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/missions/${editingMission.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete mission");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCompatibleGame = (gameId: string) => {
    setFormData(prev => {
      const exists = prev.compatible_games.includes(gameId);
      if (exists) {
        return { ...prev, compatible_games: prev.compatible_games.filter(id => id !== gameId) };
      } else {
        return { ...prev, compatible_games: [...prev.compatible_games, gameId] };
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-heading uppercase tracking-widest text-wa-green mb-2">
            SPECIAL MISSIONS
          </h1>
          <p className="text-wa-text/60 uppercase text-xs tracking-wider">
            Manage themed game layers and add-ons
          </p>
        </div>
        <WAButton onClick={() => openModal()} className="bg-wa-green text-wa-bg font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" /> ADD MISSION
        </WAButton>
      </div>

      <WAPanel className="p-0 overflow-hidden border-wa-green/20">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-wa-green/20 text-wa-text/60 uppercase tracking-widest text-xs bg-wa-bg">
                <th className="p-4 w-12"></th>
                <th className="p-4 w-16">Image</th>
                <th className="p-4">Name (EN)</th>
                <th className="p-4 text-right">Name (AR)</th>
                <th className="p-4">Add-on Price</th>
                <th className="p-4 w-24">Active</th>
                <th className="p-4 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              <SortableContext items={missions.map(m => m.id)} strategy={verticalListSortingStrategy}>
                {missions.map(mission => (
                  <SortableItem key={mission.id} id={mission.id} item={mission} onEdit={openModal} onToggleActive={handleToggleActive} />
                ))}
              </SortableContext>
            </tbody>
          </table>
          </div>
        </DndContext>
      </WAPanel>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-wa-bg border border-wa-green/50 p-6 rounded-lg max-w-2xl w-full relative my-8">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-wa-text/50 hover:text-wa-text">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold uppercase tracking-widest font-heading text-wa-green mb-6">
              {editingMission ? "Edit Mission" : "Create Mission"}
            </h2>

            <form onSubmit={handleSave} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70">Name (EN)</label>
                  <input type="text" required value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70 text-right">Name (AR)</label>
                  <input type="text" value={formData.name_ar} onChange={e => setFormData({...formData, name_ar: e.target.value})} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none text-right" dir="rtl" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70">Description (EN)</label>
                  <textarea value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none h-20 resize-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70 text-right">Description (AR)</label>
                  <textarea value={formData.description_ar} onChange={e => setFormData({...formData, description_ar: e.target.value})} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none h-20 resize-none text-right" dir="rtl" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70">Mission Image</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-wa-text/10 rounded overflow-hidden flex items-center justify-center border border-wa-green/20">
                      {formData.image_url ? (
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-wa-text/20" />
                      )}
                    </div>
                    <label className="bg-wa-green/10 text-wa-green text-xs font-bold px-4 py-2 rounded cursor-pointer hover:bg-wa-green/20 transition-colors uppercase tracking-widest">
                      {uploading ? "Uploading..." : "Upload Image"}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                   <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest opacity-70">Add-on Price (EGP)</label>
                    <input type="number" required value={formData.additional_price_per_player} onChange={e => setFormData({...formData, additional_price_per_player: parseFloat(e.target.value) || 0})} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest opacity-70">Time Bonus (Min)</label>
                    <input type="number" value={formData.duration_bonus_minutes} onChange={e => setFormData({...formData, duration_bonus_minutes: parseInt(e.target.value) || 0})} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70">Min Players</label>
                  <input type="number" required value={formData.min_players} onChange={e => setFormData({...formData, min_players: parseInt(e.target.value) || 2})} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70">Max Players</label>
                  <input type="number" required value={formData.max_players} onChange={e => setFormData({...formData, max_players: parseInt(e.target.value) || 6})} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest opacity-70">Compatible Games (Leave empty for all)</label>
                <div className="flex flex-wrap gap-2">
                  {games.map(game => (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => toggleCompatibleGame(game.id)}
                      className={`px-3 py-1 text-[10px] uppercase font-mono border transition-colors ${
                        formData.compatible_games.includes(game.id)
                          ? "bg-wa-green text-wa-bg border-wa-green"
                          : "bg-wa-text/5 text-wa-text/40 border-wa-text/10 hover:border-wa-text/30"
                      }`}
                    >
                      {game.name_en}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between mt-4">
                {editingMission ? (
                  <button type="button" onClick={handleDelete} className="text-wa-error hover:underline text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Delete Mission
                  </button>
                ) : <div></div>}
                <div className="flex gap-4">
                  <WAButton type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>CANCEL</WAButton>
                  <WAButton type="submit" disabled={isSaving || uploading} className="bg-wa-green text-wa-bg font-bold">{isSaving ? "SAVING..." : "SAVE MISSION"}</WAButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
