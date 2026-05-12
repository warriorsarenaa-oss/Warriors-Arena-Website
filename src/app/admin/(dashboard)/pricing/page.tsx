"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { DollarSign, X, History, AlertTriangle } from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";

export default function PricingPage() {
  const [pricing, setPricing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPrice, setEditPrice] = useState("");
  const [editType, setEditType] = useState<'time' | 'ammo'>('time');
  const [editAmmo, setEditAmmo] = useState("");
  const [editDisplay, setEditDisplay] = useState("");
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // History State
  const [showHistory, setShowHistory] = useState<string | null>(null);

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/pricing");
      if (res.ok) setPricing(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const handleEdit = (row: any) => {
    setSelectedRow(row);
    setEditPrice(row.price_per_player.toString());
    setEditType(row.pricing_type || 'time');
    setEditAmmo(row.ammo_count?.toString() || "");
    setEditDisplay(row.duration_minutes_display || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRow) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: selectedRow.game_id,
          duration_minutes: selectedRow.duration_minutes,
          price_per_player: parseFloat(editPrice),
          pricing_type: editType,
          ammo_count: editType === 'ammo' ? parseInt(editAmmo) : null,
          duration_minutes_display: editType === 'ammo' ? editDisplay : null
        }),
      });

      if (!res.ok) throw new Error("Failed to update pricing");

      setIsModalOpen(false);
      fetchPricing();
    } catch (err) {
      console.error(err);
      alert("Error saving price");
    } finally {
      setIsSaving(false);
    }
  };

  const activePrices = pricing.filter(p => p.is_active);
  const inactivePrices = pricing.filter(p => !p.is_active);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-heading uppercase tracking-widest text-wa-green mb-2">
          PRICING ENGINE
        </h1>
        <p className="text-wa-text/60 uppercase text-xs tracking-wider">
          Manage game base prices per player
        </p>
      </div>

      <WAPanel className="p-0 overflow-hidden border-wa-green/20">
        <div className="p-4 border-b border-wa-green/20 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-wa-green" />
          <h2 className="font-bold uppercase tracking-widest">Current Active Pricing</h2>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-2 border-wa-green border-t-transparent rounded-full"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-wa-green/20 text-wa-text/60 uppercase tracking-widest text-xs">
                  <th className="p-4">Game</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Ammo / Time</th>
                  <th className="p-4">Current Price</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {activePrices.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center italic opacity-50">No pricing data found</td></tr>
                ) : activePrices.map(row => (
                  <tr key={row.id} className="border-b border-wa-green/10 hover:bg-wa-green/5 transition-colors group">
                    <td className="p-4 font-bold">{(row.games as any)?.name_en || 'Unknown'}</td>
                    <td className="p-4 uppercase text-[10px] font-mono tracking-tighter">
                      <span className={row.pricing_type === 'ammo' ? 'text-wa-orange' : 'text-wa-text/60'}>
                        {row.pricing_type || 'time'}
                      </span>
                    </td>
                    <td className="p-4">
                      {row.pricing_type === 'ammo' 
                        ? `${row.ammo_count} Bullets (${row.duration_minutes_display || 'N/A'})` 
                        : `${row.duration_minutes} min`
                      }
                    </td>
                    <td className="p-4 text-wa-green font-bold text-lg">{row.price_per_player} EGP</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleEdit(row)}
                        className="text-wa-text/70 hover:text-wa-green uppercase text-xs tracking-widest font-bold underline"
                      >
                        EDIT
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WAPanel>

      {/* History Section */}
      <WAPanel className="p-6 border border-wa-text/20 bg-wa-bg/50">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-wa-text/70">
          <History className="w-4 h-4" /> Pricing History
        </h2>
        
        {inactivePrices.length === 0 ? (
          <p className="text-xs italic text-wa-text/50">No historical price changes recorded.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Group by game and duration for simplicity, or just list them */}
            {inactivePrices.map(row => (
              <div key={row.id} className="text-xs p-3 border border-wa-text/10 rounded flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
                <div>
                  <span className="font-bold">{(row.games as any)?.name_en}</span>
                  <span className="mx-2">•</span>
                  <span>{row.duration_minutes} min</span>
                </div>
                <div>
                  <span className="line-through mr-4 text-wa-error">{row.price_per_player} EGP</span>
                  <span className="text-wa-text/50">Changed on {format(new Date(row.created_at), "MMM d, yyyy")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </WAPanel>

      {/* Edit Modal */}
      {isModalOpen && selectedRow && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-wa-bg border border-wa-green/50 p-6 rounded-lg max-w-md w-full relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-wa-text/50 hover:text-wa-text">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold uppercase tracking-widest font-heading text-wa-green mb-2">
              Update Pricing
            </h2>
            <p className="text-sm text-wa-text/80 mb-6">
              {(selectedRow.games as any)?.name_en} - {selectedRow.duration_minutes} Minutes
            </p>

            <div className="bg-wa-orange/10 border border-wa-orange p-3 rounded flex items-start gap-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-wa-orange shrink-0 mt-0.5" />
              <p className="text-xs text-wa-orange uppercase tracking-wider">
                This applies to all future bookings. Existing bookings will keep their original price.
              </p>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70">Pricing Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditType('time')}
                      className={`flex-1 p-2 border rounded text-xs font-bold transition-colors ${editType === 'time' ? 'border-wa-green bg-wa-green/20 text-wa-green' : 'border-wa-text/10 text-wa-text/40'}`}
                    >
                      TIME-BASED
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditType('ammo')}
                      className={`flex-1 p-2 border rounded text-xs font-bold transition-colors ${editType === 'ammo' ? 'border-wa-orange bg-wa-orange/20 text-wa-orange' : 'border-wa-text/10 text-wa-text/40'}`}
                    >
                      AMMO-BASED
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70">New Price Per Player (EGP)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full bg-transparent border border-wa-text/20 p-3 pl-8 rounded outline-none focus:border-wa-green text-lg font-bold"
                      required
                    />
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-wa-text/50" />
                  </div>
                </div>

                {editType === 'ammo' && (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs uppercase tracking-widest opacity-70">Ammo Count (Bullets)</label>
                      <input 
                        type="number"
                        value={editAmmo}
                        onChange={(e) => setEditAmmo(e.target.value)}
                        className="w-full bg-transparent border border-wa-text/20 p-3 rounded outline-none focus:border-wa-green text-sm font-mono"
                        placeholder="e.g. 400"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs uppercase tracking-widest opacity-70">Display Duration (e.g. "30 Min")</label>
                      <input 
                        type="text"
                        value={editDisplay}
                        onChange={(e) => setEditDisplay(e.target.value)}
                        className="w-full bg-transparent border border-wa-text/20 p-3 rounded outline-none focus:border-wa-green text-sm"
                        placeholder="e.g. 30 Min"
                        required
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-4 mt-2">
                <WAButton type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  CANCEL
                </WAButton>
                <WAButton type="submit" disabled={isSaving} className="bg-wa-green text-wa-bg font-bold">
                  {isSaving ? "SAVING..." : "CONFIRM UPDATE"}
                </WAButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
