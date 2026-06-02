"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { format } from "date-fns";

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/audit");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const toggleExpand = (id: string) => {
    if (expandedId === id) setExpandedId(null);
    else setExpandedId(id);
  };

  const renderState = (state: any) => {
    if (!state) return <span className="opacity-30 italic uppercase text-[10px]">No Data</span>;
    
    // If state is not an object (e.g. string or null), just show it
    if (typeof state !== 'object') return <span className="font-mono text-xs">{String(state)}</span>;

    return (
      <div className="flex flex-col gap-2">
        {Object.entries(state).map(([key, value]) => (
          <div key={key} className="flex flex-col border-b border-wa-green/5 pb-1 last:border-0">
            <span className="uppercase text-[9px] opacity-40 font-bold tracking-widest leading-none mb-1">{key.replace(/_/g, ' ')}</span>
            <span className="font-mono text-[11px] text-wa-green font-bold break-all leading-tight">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-heading uppercase tracking-widest text-wa-green mb-2">AUDIT LOG</h1>
        <p className="text-wa-text/60 uppercase text-xs tracking-wider">System activity trail</p>
      </div>

      <WAPanel className="p-0 overflow-hidden border-wa-green/20">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-wa-green/20 text-wa-text/60 uppercase tracking-widest text-xs bg-wa-bg">
                <th className="p-4 w-48">Timestamp</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4 w-12 text-center">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center italic opacity-50">Loading audit logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center italic opacity-50">No activity recorded.</td></tr>
              ) : logs.map(log => (
                <React.Fragment key={log.id}>
                  <tr className="border-b border-wa-green/10 hover:bg-wa-text/5 cursor-pointer" onClick={() => toggleExpand(log.id)}>
                    <td className="p-4 font-mono text-xs opacity-70 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}
                    </td>
                    <td className="p-4 font-bold">{(log.users as any)?.full_name || log.actor_user_id}</td>
                    <td className="p-4"><span className="px-2 py-1 bg-wa-green/10 text-wa-green rounded text-xs uppercase tracking-widest">{log.action.replace(/_/g, ' ')}</span></td>
                    <td className="p-4"><span className="text-xs uppercase opacity-70">{log.entity_type}</span> <span className="font-mono text-xs ml-2">{log.entity_id}</span></td>
                    <td className="p-4 text-center">
                      <button className="text-wa-green hover:text-white transition-colors">
                        {expandedId === log.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr className="bg-black/20 border-b border-wa-green/20">
                      <td colSpan={5} className="p-6">
                        <div className="grid grid-cols-2 gap-8">
                          <div className="bg-wa-bg/30 p-4 border border-wa-green/5">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-wa-error mb-4 border-b border-wa-error/20 pb-2">PRE-TRANSACTION</h4>
                            {renderState(log.before_state)}
                          </div>
                          <div className="bg-wa-bg/30 p-4 border border-wa-green/5">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-wa-green mb-4 border-b border-wa-green/20 pb-2">POST-TRANSACTION</h4>
                            {renderState(log.after_state)}
                          </div>
                        </div>
                        <div className="mt-4 flex gap-4 text-[9px] opacity-30 font-mono uppercase tracking-widest">
                          <span>IP: {log.ip_address}</span>
                          <span>Network Agent: {log.user_agent?.substring(0,80)}...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </WAPanel>
    </div>
  );
}
