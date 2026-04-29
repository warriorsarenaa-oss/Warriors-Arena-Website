"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, X, Trash2, GripVertical, Image as ImageIcon } from "lucide-react";
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
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<any>(null);
  const [formData, setFormData] = useState({
    name_en: "", name_ar: "", description_en: "", description_ar: "", icon_url: "", hero_image_url: ""
  });
  const [pricing, setPricing] = useState<{duration_minutes: number, price_per_player: number}[]>([
    { duration_minutes: 30, price_per_player: 150 }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'icon_url' | 'hero_image_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(field);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `games/${fileName}`;

      const { data, error } = await supabaseBrowser.storage
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

  const loadAdminGames = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/games");
      if (res.ok) setGames(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminGames();
  }, []);

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = games.findIndex((g) => g.id === active.id);
      const newIndex = games.findIndex((g) => g.id === over.id);
      
      const newGames = arrayMove(games, oldIndex, newIndex);
      setGames(newGames);
      
      // Update display_order in background
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
        icon_url: game.icon_url || "", hero_image_url: game.hero_image_url || ""
      });
      setPricing(game.game_pricing ? game.game_pricing.map((p: any) => ({
        duration_minutes: p.duration_minutes || 30,
        price_per_player: p.price_per_player || 0
      })) : [{ duration_minutes: 30, price_per_player: 150 }]);
    } else {
      setEditingGame(null);
      setFormData({
        name_en: "", name_ar: "", description_en: "", description_ar: "", icon_url: "", hero_image_url: ""
      });
      setPricing([{ duration_minutes: 30, price_per_player: 150 }]);
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
          body: JSON.stringify({ ...formData, pricing })
        });
      } else {
        res = await fetch(`/api/v1/admin/games`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, pricing, display_order: games.length })
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save game");
      }

      setIsModalOpen(false);
      await loadAdminGames();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save game");
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
      console.error(err);
      alert("Failed to delete game");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-heading uppercase tracking-widest text-wa-green mb-2">
            GAMES CATALOG
          </h1>
          <p className="text-wa-text/60 uppercase text-xs tracking-wider">
            Manage experiences and metadata
          </p>
        </div>
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-wa-bg border border-wa-green/50 p-6 rounded-lg max-w-2xl w-full relative my-8">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-wa-text/50 hover:text-wa-text">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold uppercase tracking-widest font-heading text-wa-green mb-6">
              {editingGame ? "Edit Game" : "Create Game"}
            </h2>

            <form onSubmit={handleSave} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70">Name (EN)</label>
                  <input type="text" required value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70">Name (AR)</label>
                  <input type="text" required value={formData.name_ar} onChange={e => setFormData({...formData, name_ar: e.target.value})} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none text-right" dir="rtl" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70">Description (EN)</label>
                  <textarea value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none h-24 resize-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70">Description (AR)</label>
                  <textarea value={formData.description_ar} onChange={e => setFormData({...formData, description_ar: e.target.value})} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none h-24 resize-none text-right" dir="rtl" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70">Icon (SVG/PNG)</label>
                  <div className="flex gap-2">
                    <input type="text" value={formData.icon_url} onChange={e => setFormData({...formData, icon_url: e.target.value})} placeholder="/games/laser-tag.svg" className="flex-1 bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none" />
                    <label className="bg-wa-text/10 p-2 rounded cursor-pointer hover:bg-wa-text/20 transition-colors">
                      <Plus className="w-5 h-5" />
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'icon_url')} />
                    </label>
                  </div>
                  {uploading === 'icon_url' && <p className="text-[10px] text-wa-green animate-pulse">Uploading...</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70">Hero Image (JPG/PNG)</label>
                  <div className="flex gap-2">
                    <input type="text" value={formData.hero_image_url} onChange={e => setFormData({...formData, hero_image_url: e.target.value})} placeholder="/games/laser-tag-hero.jpg" className="flex-1 bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none" />
                    <label className="bg-wa-text/10 p-2 rounded cursor-pointer hover:bg-wa-text/20 transition-colors">
                      <Plus className="w-5 h-5" />
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'hero_image_url')} />
                    </label>
                  </div>
                  {uploading === 'hero_image_url' && <p className="text-[10px] text-wa-green animate-pulse">Uploading...</p>}
                </div>
              </div>

                <div className="border border-wa-green/20 p-4 rounded bg-wa-green/5 flex flex-col gap-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-wa-green">Pricing Tiers</h3>
                  <p className="text-xs opacity-70 mb-2">Configure durations and rates per player.</p>
                  
                  {pricing.map((p, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <select 
                        value={p.duration_minutes || 30} 
                        onChange={e => {
                          const newP = [...pricing]; 
                          newP[idx].duration_minutes = parseInt(e.target.value) || 30; 
                          setPricing(newP);
                        }} 
                        className="bg-wa-bg border border-wa-text/20 p-2 rounded outline-none"
                      >
                        <option value={30}>30 Minutes</option>
                        <option value={60}>60 Minutes</option>
                      </select>
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
                        className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none w-32" 
                        placeholder="EGP" 
                      />
                      <span className="text-xs uppercase opacity-70">per player</span>
                      {pricing.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => setPricing(pricing.filter((_, i) => i !== idx))}
                          className="text-wa-error hover:opacity-70 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {pricing.length < 5 && (
                    <button type="button" onClick={() => setPricing([...pricing, {duration_minutes: 60, price_per_player: 0}])} className="text-wa-green text-xs uppercase tracking-widest underline w-fit">
                      + Add another tier
                    </button>
                  )}
                </div>

              <div className="flex justify-between mt-4">
                {editingGame ? (
                  <button type="button" onClick={handleDelete} className="text-wa-red hover:underline text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Delete Game Permanently
                  </button>
                ) : <div></div>}
                <div className="flex gap-4">
                  <WAButton type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>CANCEL</WAButton>
                  <WAButton type="submit" disabled={isSaving} className="bg-wa-green text-wa-bg font-bold">{isSaving ? "SAVING..." : "SAVE GAME"}</WAButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
