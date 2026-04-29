"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";

export default function ExportPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate) {
      alert("From and To dates are required");
      return;
    }

    setIsExporting(true);
    try {
      const url = new URL("/api/v1/admin/export/xlsx", window.location.origin);
      url.searchParams.append("from", fromDate);
      url.searchParams.append("to", toDate);

      window.location.href = url.toString();
    } catch (err) {
      console.error(err);
      alert("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-heading uppercase tracking-widest text-wa-green mb-2">DATA EXPORT</h1>
        <p className="text-wa-text/60 uppercase text-xs tracking-wider">Generate financial and booking reports</p>
      </div>

      <WAPanel className="p-8 border border-wa-green/20">
        <form onSubmit={handleExport} className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest opacity-70">From Date *</label>
              <input type="date" required value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-transparent border border-wa-text/20 p-3 rounded focus:border-wa-green outline-none" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest opacity-70">To Date *</label>
              <input type="date" required value={toDate} onChange={e => setToDate(e.target.value)} className="bg-transparent border border-wa-text/20 p-3 rounded focus:border-wa-green outline-none" />
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <label className="text-xs uppercase tracking-widest opacity-70">Export Format</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer p-4 border border-wa-green bg-wa-green/10 rounded">
                <input type="radio" checked readOnly className="accent-wa-green" />
                <span className="font-bold">Excel (.xlsx)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <WAButton type="submit" disabled={isExporting} className="bg-wa-green text-wa-bg font-bold flex items-center gap-2 px-8 py-4 text-lg">
              <Download className="w-5 h-5" /> {isExporting ? "PREPARING EXPORT..." : "DOWNLOAD EXPORT"}
            </WAButton>
          </div>
        </form>
      </WAPanel>
    </div>
  );
}
