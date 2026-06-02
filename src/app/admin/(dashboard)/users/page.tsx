"use client";

import { useState, useEffect } from "react";
import { Plus, X, Trash2, Search, User as UserIcon, Shield, Check, Loader2, Eye, EyeOff } from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";

const PAGE_PERMISSIONS = [
  { label: "Dashboard", keys: ["view_dashboard"] },
  { label: "Reservations", keys: ["view_bookings", "create_booking", "cancel_booking"] },
  { label: "Revenue", keys: ["view_revenue"] },
  { label: "Financials", keys: ["view_financials", "manage_financials"] },
  { label: "Hours", keys: ["manage_hours"] },
  { label: "Pricing", keys: ["manage_pricing"] },
  { label: "Games", keys: ["manage_games"] },
  { label: "Bundles", keys: ["manage_bundles"] },
  { label: "Export", keys: ["export_data"] },
  { label: "Users", keys: ["manage_users"] },
  { label: "Audit Log", keys: ["view_audit"] },
];

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: "", 
    password: "", 
    commission_rate: 0, 
    hourly_rate: 0,
    permissions: [] as string[]
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    fetch('/api/v1/admin/auth/me').then(r => {
      if (r.ok) {
        r.json().then(data => setCurrentUser(data.user));
      }
    }).catch(()=>{});
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/users");
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: user.plain_password || "", // Prefill with stored plain password
        commission_rate: user.commission_rate || 0,
        hourly_rate: user.hourly_rate || 0,
        permissions: user.permissions || []
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: "",
        password: "",
        commission_rate: 0,
        hourly_rate: 0,
        permissions: []
      });
    }
    setIsModalOpen(true);
  };

  const handleTogglePermission = (keys: string[]) => {
    setFormData(prev => {
      const hasAll = keys.every(k => prev.permissions.includes(k));
      let newPerms;
      if (hasAll) {
        newPerms = prev.permissions.filter(k => !keys.includes(k));
      } else {
        newPerms = Array.from(new Set([...prev.permissions, ...keys]));
      }
      return { ...prev, permissions: newPerms };
    });
  };

  const handleToggleActive = async (user: any) => {
    const newActive = !user.is_active;
    setUsers(users.map(u => u.id === user.id ? { ...u, is_active: newActive } : u));
    await fetch(`/api/v1/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: newActive })
    });
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Are you sure you want to permanently delete the user ${user.username}?`)) return;
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      loadData();
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete user: " + err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingUser) {
        const res = await fetch(`/api/v1/admin/users/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({
            username: formData.username,
            commission_rate: formData.commission_rate,
            hourly_rate: formData.hourly_rate,
            permissions: formData.permissions,
            // Include password only if it was changed
            ...(formData.password ? { password: formData.password } : {})
          })
        });
        if (!res.ok) throw new Error(await res.text());
        setIsModalOpen(false);
      } else {
        const res = await fetch(`/api/v1/admin/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if(res.ok) {
           setIsModalOpen(false);
        } else {
           alert(data.error);
        }
      }
      loadData();
    } catch (err: any) {
      console.error(err);
      alert("Failed to save user: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (searchQuery && !u.username.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-heading uppercase tracking-widest text-wa-green mb-2">STAFF MANAGEMENT</h1>
          <p className="text-wa-text/60 uppercase text-xs tracking-wider">Configure access, roles, and compensation</p>
        </div>
        <WAButton onClick={() => openModal()} className="bg-wa-green text-wa-bg font-bold flex items-center gap-2 px-8 py-3">
          <Plus className="w-5 h-5" /> CREATE NEW USER
        </WAButton>
      </div>

      <div className="flex gap-4">
        <div className="flex items-center gap-3 bg-wa-bg/30 border border-wa-green/20 p-4 rounded-xl flex-1 max-w-sm">
          <Search className="w-4 h-4 text-wa-green/50" />
          <input 
            type="text" 
            placeholder="Search username..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="bg-transparent outline-none w-full text-sm uppercase tracking-widest" 
          />
        </div>
      </div>

      <WAPanel className="p-0 overflow-hidden border-wa-green/10 bg-wa-bg/20 backdrop-blur-md">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-wa-green/20 text-wa-green/60 uppercase tracking-[0.2em] text-[10px] bg-wa-green/5">
              <th className="p-6 w-12"></th>
              <th className="p-6">Username</th>
              <th className="p-6 text-center">Permissions</th>
              <th className="p-6 text-right">Comm Rate (%)</th>
              <th className="p-6 text-right">Hourly Rate</th>
              <th className="p-6 w-24 text-center">Active</th>
              <th className="p-6 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className="border-b border-wa-green/5 hover:bg-wa-green/5 transition-colors">
                <td className="p-6"><div className="w-10 h-10 bg-wa-green/10 rounded-full flex items-center justify-center border border-wa-green/20"><UserIcon className="w-5 h-5 text-wa-green" /></div></td>
                <td className="p-6">
                  <div className="font-bold text-lg font-mono tracking-wider">{user.username}</div>
                  <div className="text-[10px] opacity-40 uppercase tracking-widest">{user.email}</div>
                </td>
                <td className="p-6 text-center">
                  <div className="flex flex-wrap justify-center gap-1 max-w-[200px] mx-auto">
                    {PAGE_PERMISSIONS.map(p => {
                      const hasAccess = p.keys.every(k => user.permissions?.includes(k));
                      if (!hasAccess) return null;
                      return (
                        <div key={p.label} className="text-[8px] px-1.5 py-0.5 bg-wa-green/20 text-wa-green rounded border border-wa-green/30 uppercase font-bold">
                          {p.label}
                        </div>
                      )
                    })}
                    {(user.permissions?.length || 0) === 0 && <span className="text-[10px] opacity-30 italic">No Access</span>}
                  </div>
                </td>
                <td className="p-6 text-right font-mono text-wa-green font-bold">{user.commission_rate || 0}%</td>
                <td className="p-6 text-right font-mono font-bold">{(user.hourly_rate || 0).toLocaleString()} EGP/h</td>
                <td className="p-6 text-center">
                  <label className="flex items-center justify-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={user.is_active} onChange={() => handleToggleActive(user)} />
                    <div className="relative w-10 h-5 bg-wa-text/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-wa-bg after:border-wa-text/20 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-wa-green"></div>
                  </label>
                </td>
                <td className="p-6 text-right flex items-center justify-end gap-2">
                  <WAButton onClick={() => openModal(user)} variant="ghost" className="text-wa-green text-[10px] uppercase tracking-widest font-bold h-8 px-4 border border-wa-green/20 hover:border-wa-green">Edit</WAButton>
                  {currentUser?.id !== user.id && (
                    <WAButton onClick={() => handleDeleteUser(user)} variant="ghost" className="text-red-500 text-[10px] uppercase tracking-widest font-bold h-8 px-4 border border-red-500/20 hover:border-red-500 hover:bg-red-500/10">Delete</WAButton>
                  )}
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
               <tr><td colSpan={7} className="p-20 text-center flex flex-col items-center gap-4">
                 <Loader2 className="w-8 h-8 animate-spin text-wa-green/20" />
                 <p className="italic opacity-30 uppercase tracking-[0.3em] text-[10px]">Analyzing staff registry...</p>
               </td></tr>
            )}
          </tbody>
        </table>
        </div>
      </WAPanel>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <WAPanel className="max-w-2xl w-full p-8 border-wa-green/50 bg-wa-bg relative shadow-2xl shadow-wa-green/10 max-h-[90dvh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-wa-text/30 hover:text-wa-text transition-colors">
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-wa-green/10 rounded-lg border border-wa-green/30">
                <Shield className="w-6 h-6 text-wa-green" />
              </div>
              <div>
                <h2 className="text-2xl font-bold uppercase tracking-[0.2em] font-heading text-wa-green">
                  {editingUser ? "Edit Credentials" : "Initialize User"}
                </h2>
                <p className="text-[10px] text-wa-text/40 uppercase tracking-widest">Configure security & compensation protocols</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">Username (Identifier)</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})} 
                    placeholder="john_doe"
                    className="bg-wa-bg border border-wa-green/20 p-4 rounded-xl focus:border-wa-green outline-none disabled:opacity-40 font-mono tracking-wider" 
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">
                    {editingUser ? "Password (Edit to change)" : "Password *"}
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required={!editingUser} 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      placeholder="••••••••"
                      className="w-full bg-wa-bg border border-wa-green/20 p-4 rounded-xl focus:border-wa-green outline-none font-mono pr-12" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-wa-green/50 hover:text-wa-green transition-colors z-10"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50 text-wa-green">Commission Rate (%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    required 
                    value={formData.commission_rate} 
                    onChange={e => setFormData({...formData, commission_rate: parseFloat(e.target.value)})} 
                    className="bg-wa-bg border border-wa-green/20 p-4 rounded-xl focus:border-wa-green outline-none font-mono text-xl text-wa-green font-bold" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">Hourly Rate (EGP/h)</label>
                  <input 
                    type="number" 
                    min="0" 
                    required 
                    value={formData.hourly_rate} 
                    onChange={e => setFormData({...formData, hourly_rate: parseFloat(e.target.value)})} 
                    className="bg-wa-bg border border-wa-green/20 p-4 rounded-xl focus:border-wa-green outline-none font-mono text-xl" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">Page-Level Access Permissions</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PAGE_PERMISSIONS.map(p => {
                    const isSelected = p.keys.every(k => formData.permissions.includes(k));
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handleTogglePermission(p.keys)}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          isSelected 
                            ? 'bg-wa-green/20 border-wa-green text-wa-green' 
                            : 'bg-white/5 border-white/10 text-wa-text/40 grayscale'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest">{p.label}</span>
                        {isSelected ? <Check className="w-3 h-3" /> : <div className="w-3 h-3" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-4">
                <WAButton 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-8 border-wa-text/20"
                >
                  ABORT
                </WAButton>
                <WAButton 
                  type="submit" 
                  disabled={isSaving} 
                  className="bg-wa-green text-wa-bg font-bold px-12 py-4 shadow-lg shadow-wa-green/20"
                >
                  {isSaving ? "SYNCHRONIZING..." : (editingUser ? "COMMIT CHANGES" : "AUTHORIZE USER")}
                </WAButton>
              </div>
            </form>
          </WAPanel>
        </div>
      )}
    </div>
  );
}
