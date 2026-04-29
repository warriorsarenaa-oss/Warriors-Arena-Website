"use client";

import { useState, useEffect } from "react";
import { Plus, X, Trash2, GripVertical, Image as ImageIcon } from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabaseBrowser } from "@/lib/db/supabase-browser";

function SortableItem({ id, item, onEdit, onToggleActive }: { id: string, item: any, onEdit: any, onToggleActive: any }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id });
  
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-wa-green/10 bg-wa-bg hover:bg-wa-green/5">
      <td className="p-4" {...attributes} {...listeners}>
        <GripVertical className="w-5 h-5 text-wa-text/30 cursor-grab" />
      </td>
      <td className="p-4">
        {item.image_url ? (
          <img src={item.image_url} alt="bundle" className="w-12 h-8 object-cover rounded" />
        ) : (
          <div className="w-12 h-8 bg-wa-text/10 rounded flex items-center justify-center"><ImageIcon className="w-4 h-4 text-wa-text/50" /></div>
        )}
      </td>
      <td className="p-4 font-bold">{item.title_en}</td>
      <td className="p-4">{(item.games as any)?.name_en}</td>
      <td className="p-4 text-wa-green font-bold">
        {item.pricing_mode === 'per_player' ? `${item.price_value} EGP/player` : `${item.price_value} EGP Total`}
      </td>
      <td className="p-4">
        <span className={`px-2 py-1 rounded text-xs uppercase tracking-widest ${item.visibility === 'public' ? 'bg-wa-green/20 text-wa-green' : 'bg-wa-text/20 text-wa-text/50'}`}>
          {item.visibility}
        </span>
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

export default function BundlesPage() {
  const [bundles, setBundles] = useState<any[]>([]);
  const [gamesList, setGamesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<any>(null);
  const [formData, setFormData] = useState({
    title_en: "", title_ar: "", description_en: "", description_ar: "",
    game_id: "", duration_minutes: 30, player_count: 4, pricing_mode: "per_player", price_value: 0,
    image_url: "", visibility: "public", placement: "landing_featured", starts_at: "", ends_at: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `bundles/${fileName}`;

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
      alert("Failed to upload: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const loadData = async () => {
    setLoading(true);
    try {
      const [gRes, bRes] = await Promise.all([
        fetch("/api/v1/admin/games"),
        fetch("/api/v1/admin/bundles"),
      ]);
      if (gRes.ok) setGamesList(await gRes.json());
      if (bRes.ok) setBundles(await bRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = bundles.findIndex((b) => b.id === active.id);
      const newIndex = bundles.findIndex((b) => b.id === over.id);
      
      const newBundles = arrayMove(bundles, oldIndex, newIndex);
      setBundles(newBundles);
      
      newBundles.forEach(async (b, idx) => {
        if (b.display_order !== idx) {
          await fetch(`/api/v1/admin/bundles/${b.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ display_order: idx })
          });
        }
      });
    }
  };

  const openModal = (bundle?: any) => {
    if (bundle) {
      setEditingBundle(bundle);
      setFormData({
        title_en: bundle.title_en, title_ar: bundle.title_ar, 
        description_en: bundle.description_en || "", description_ar: bundle.description_ar || "",
        game_id: bundle.game_id, duration_minutes: bundle.duration_minutes,
        player_count: bundle.player_count, pricing_mode: bundle.pricing_mode, price_value: bundle.price_value,
        image_url: bundle.image_url || "", visibility: bundle.visibility, placement: bundle.placement || "landing_featured",
        starts_at: bundle.starts_at ? bundle.starts_at.substring(0,10) : "", ends_at: bundle.ends_at ? bundle.ends_at.substring(0,10) : ""
      });
    } else {
      setEditingBundle(null);
      setFormData({
        title_en: "", title_ar: "", description_en: "", description_ar: "",
        game_id: gamesList[0]?.id || "", duration_minutes: 30, player_count: 4, pricing_mode: "per_player", price_value: 0,
        image_url: "", visibility: "public", placement: "landing_featured", starts_at: "", ends_at: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleToggleActive = async (bundle: any) => {
    const newActive = !bundle.is_active;
    setBundles(bundles.map(b => b.id === bundle.id ? { ...b, is_active: newActive } : b));
    await fetch(`/api/v1/admin/bundles/${bundle.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: newActive })
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        starts_at: formData.starts_at || null,
        ends_at: formData.ends_at || null,
        display_order: editingBundle ? undefined : bundles.length
      };

      let res;
      if (editingBundle) {
        res = await fetch(`/api/v1/admin/bundles/${editingBundle.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/v1/admin/bundles`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save bundle");
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save bundle");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if(!editingBundle) return;
    if(!confirm("Are you sure? This will PERMANENTLY REMOVE this bundle. This cannot be undone.")) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/bundles/${editingBundle.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete bundle");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-heading uppercase tracking-widest text-wa-green mb-2">BUNDLES</h1>
          <p className="text-wa-text/60 uppercase text-xs tracking-wider">Manage packages and promotions</p>
        </div>
        <WAButton onClick={() => openModal()} className="bg-wa-green text-wa-bg font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" /> ADD BUNDLE
        </WAButton>
      </div>

      <WAPanel className="p-0 overflow-hidden border-wa-green/20">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-wa-green/20 text-wa-text/60 uppercase tracking-widest text-xs bg-wa-bg">
                <th className="p-4 w-12"></th>
                <th className="p-4 w-20">Image</th>
                <th className="p-4">Title (EN)</th>
                <th className="p-4">Game</th>
                <th className="p-4">Pricing</th>
                <th className="p-4 w-24">Visibility</th>
                <th className="p-4 w-24">Active</th>
                <th className="p-4 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              <SortableContext items={bundles.map(b => b.id)} strategy={verticalListSortingStrategy}>
                {bundles.map(bundle => (
                  <SortableItem key={bundle.id} id={bundle.id} item={bundle} onEdit={openModal} onToggleActive={handleToggleActive} />
                ))}
              </SortableContext>
            </tbody>
          </table>
          </div>
        </DndContext>
      </WAPanel>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-wa-bg border border-wa-green/50 p-4 md:p-6 rounded-lg max-w-5xl w-full relative my-8 flex flex-col lg:flex-row gap-8">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-wa-text/50 hover:text-wa-text">
              <X className="w-5 h-5" />
            </button>

            <div className="flex-1">
              <h2 className="text-xl font-bold uppercase tracking-widest font-heading text-wa-green mb-6">
                {editingBundle ? "Edit Bundle" : "Create Bundle"}
              </h2>

              <form id="bundleForm" onSubmit={handleSave} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest opacity-70">Title (EN)</label>
                    <input type="text" required value={formData.title_en} onChange={e => setFormData({...formData, title_en: e.target.value})} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest opacity-70">Title (AR)</label>
                    <input type="text" required value={formData.title_ar} onChange={e => setFormData({...formData, title_ar: e.target.value})} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none text-right" dir="rtl" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest opacity-70">Game</label>
                    <select required value={formData.game_id} onChange={e => setFormData({...formData, game_id: e.target.value})} className="bg-wa-bg border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none">
                      <option value="">Select a game...</option>
                      {gamesList.map(g => <option key={g.id} value={g.id}>{g.name_en}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest opacity-70">Duration</label>
                    <select required value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value)})} className="bg-wa-bg border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none">
                      <option value={30}>30 Minutes</option>
                      <option value={60}>60 Minutes</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest opacity-70">Player Count</label>
                    <input type="number" min="1" max="50" required value={formData.player_count} onChange={e => setFormData({...formData, player_count: parseInt(e.target.value)})} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none" />
                  </div>
                </div>

                <div className="border border-wa-green/30 p-4 rounded bg-wa-green/5">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-wa-green mb-4">Pricing Mode</h3>
                  <div className="flex gap-6 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={formData.pricing_mode === 'per_player'} onChange={() => setFormData({...formData, pricing_mode: 'per_player'})} className="accent-wa-green" />
                      Per-Player Pricing
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={formData.pricing_mode === 'fixed_total'} onChange={() => setFormData({...formData, pricing_mode: 'fixed_total'})} className="accent-wa-green" />
                      Fixed Total Pricing
                    </label>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="flex flex-col gap-2 flex-1">
                      <label className="text-xs uppercase tracking-widest opacity-70">
                        {formData.pricing_mode === 'per_player' ? "Price per player" : "Total bundle price"} (EGP)
                      </label>
                      <input type="number" min="0" required value={formData.price_value} onChange={e => setFormData({...formData, price_value: parseFloat(e.target.value)})} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none text-xl font-bold text-wa-green" />
                    </div>
                    <div className="flex-1 bg-wa-bg p-3 border border-wa-text/10 rounded mt-5">
                      <span className="text-xs opacity-70 uppercase tracking-widest">Live Calc: </span>
                      {formData.pricing_mode === 'per_player' 
                        ? <span className="font-bold">For {formData.player_count} players: {formData.player_count} × {formData.price_value} = {formData.player_count * formData.price_value} EGP</span>
                        : <span className="font-bold">Flat rate for up to {formData.player_count} players: {formData.price_value} EGP</span>
                      }
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest opacity-70">Visibility</label>
                    <select value={formData.visibility} onChange={e => setFormData({...formData, visibility: e.target.value})} className="bg-wa-bg border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none">
                      <option value="public">Public</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest opacity-70">Placement</label>
                    <select value={formData.placement} onChange={e => setFormData({...formData, placement: e.target.value})} className="bg-wa-bg border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none">
                      <option value="landing_featured">Featured (Top)</option>
                      <option value="landing_secondary">Secondary (Bottom)</option>
                      <option value="booking_flow_sidebar">Booking Sidebar</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest opacity-70">Bundle Image</label>
                    <div className="flex gap-2">
                      <input type="text" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} placeholder="URL or upload..." className="flex-1 bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green outline-none text-xs" />
                      <label className="bg-wa-text/10 p-2 rounded cursor-pointer hover:bg-wa-text/20 transition-colors shrink-0">
                        <Plus className="w-4 h-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                      </label>
                    </div>
                    {uploading && <p className="text-[10px] text-wa-green animate-pulse">Uploading...</p>}
                  </div>
                </div>
              </form>
            </div>

            <div className="w-80 shrink-0 flex flex-col gap-6">
              <div className="border border-wa-green/20 p-4 rounded bg-wa-bg sticky top-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-wa-text/50 mb-4">Live Preview Card</h3>
                <div className="border border-wa-text/10 rounded-xl overflow-hidden bg-white/5">
                  <div className="h-32 bg-wa-text/10 flex items-center justify-center overflow-hidden">
                    {formData.image_url ? <img src={formData.image_url} className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 opacity-20" />}
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-lg mb-1">{formData.title_en || "Bundle Title"}</h4>
                    <p className="text-xs text-wa-text/60 mb-4">{gamesList.find(g => g.id === formData.game_id)?.name_en || "Game"} Squad | {formData.player_count} Players • {formData.duration_minutes} Min</p>
                    <div className="flex justify-between items-center">
                      <span className="text-wa-green font-bold">
                        {formData.pricing_mode === 'per_player' ? `${formData.price_value} EGP/player` : `${formData.price_value} EGP`}
                      </span>
                      <button disabled className="bg-wa-green/20 text-wa-green px-3 py-1 rounded text-xs uppercase tracking-widest">Book</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-auto">
                {editingBundle ? (
                  <button type="button" onClick={handleDelete} className="text-wa-red hover:underline text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Delete Permanently
                  </button>
                ) : <div></div>}
                <div className="flex gap-4 w-full md:w-auto">
                  <WAButton type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 md:flex-none">CANCEL</WAButton>
                  <WAButton type="submit" form="bundleForm" disabled={isSaving} className="bg-wa-green text-wa-bg font-bold flex-1 md:flex-none">{isSaving ? "SAVING..." : "SAVE"}</WAButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
