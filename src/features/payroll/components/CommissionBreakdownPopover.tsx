"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { Loader2, X } from "lucide-react";
import { roundEGP, formatEGP } from "@/lib/utils/format";
import { formatCairoTime } from "@/lib/time/cairo";

interface CommissionItem {
  id: string;
  booking_code: string;
  game_name: string;
  commission_amount: number;
  commission_source: string;
  booking_date: string;
  start_time: string;
}

interface Props {
  staffId: string;
  weekStart: string;
  weekEnd: string;
  gamesCount: number;
  commissionPay: number;
  className?: string;
}

export function CommissionBreakdownPopover({
  staffId,
  weekStart,
  weekEnd,
  gamesCount,
  commissionPay,
  className,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CommissionItem[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchBreakdown = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({
        staff_id: staffId,
        week_start: weekStart,
        week_end: weekEnd,
      });
      const res = await fetch(`/api/v1/admin/staff/payroll/commission?${params}`);
      if (!res.ok) throw new Error("Failed to load commission data");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setFetchError(err.message || "Error loading commission data");
    } finally {
      setLoading(false);
    }
  }, [staffId, weekStart, weekEnd]);

  const handleClick = () => {
    if (!isOpen) {
      setIsOpen(true);
      if (items === null) fetchBreakdown();
    } else {
      setIsOpen(false);
    }
  };

  // Reset when week changes so stale breakdown data is not shown
  useEffect(() => {
    setItems(null);
    setIsOpen(false);
    setFetchError(null);
  }, [weekStart, weekEnd]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const total = items
    ? roundEGP(items.reduce((acc, item) => acc + item.commission_amount, 0))
    : commissionPay;

  return (
    <div ref={containerRef} className={`flex flex-col relative ${className ?? ""}`}>
      <span className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Commission</span>
      <button
        type="button"
        onClick={handleClick}
        className="font-mono font-bold text-wa-green cursor-pointer text-left w-fit underline decoration-dotted decoration-wa-green/40 underline-offset-4 hover:text-wa-green/80 transition-colors"
      >
        {gamesCount} games
      </button>
      <span className="font-bold text-sm">{formatEGP(commissionPay)} EGP</span>

      {isOpen && (
        <div className="absolute z-50 left-0 top-full mt-2 w-[420px] max-w-[92vw] rounded-xl bg-wa-bg/98 border border-wa-green/30 shadow-2xl shadow-wa-green/10 backdrop-blur-md overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-wa-green/20 bg-wa-green/5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-wa-green">
              Commission Breakdown
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="opacity-40 hover:opacity-100 transition-opacity p-1 -mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-6 text-wa-green/40">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[11px] uppercase tracking-widest">Loading...</span>
              </div>
            )}

            {fetchError && (
              <div className="py-4 text-center">
                <p className="text-red-400 text-xs font-mono mb-3">{fetchError}</p>
                <button
                  type="button"
                  onClick={fetchBreakdown}
                  className="text-[10px] uppercase tracking-widest text-wa-green/60 hover:text-wa-green transition-colors underline"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !fetchError && items !== null && items.length === 0 && (
              <div className="py-6 text-center text-[11px] text-wa-text/40 italic">
                No commissioned games this week
              </div>
            )}

            {!loading && !fetchError && items !== null && items.length > 0 && (
              <>
                <table className="w-full text-left font-mono">
                  <thead>
                    <tr className="text-[9px] uppercase tracking-widest opacity-40 border-b border-white/10">
                      <th className="pb-2 pr-2">Date</th>
                      <th className="pb-2 pr-2">Time</th>
                      <th className="pb-2 pr-2">Game</th>
                      <th className="pb-2 pr-2">Ref</th>
                      <th className="pb-2 pr-2">Source</th>
                      <th className="pb-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px]">
                    {items.map((item, idx) => (
                      <tr key={item.id || idx} className="border-b border-white/5 last:border-0">
                        <td className="py-2 pr-2 text-wa-text/70 whitespace-nowrap">
                          {item.booking_date
                            ? format(parseISO(item.booking_date), "MMM d")
                            : "—"}
                        </td>
                        <td className="py-2 pr-2 text-wa-text/70 whitespace-nowrap">
                          {item.start_time
                            ? formatCairoTime(item.start_time.substring(0, 5))
                            : "—"}
                        </td>
                        <td
                          className="py-2 pr-2 text-wa-text/90 max-w-[80px] truncate"
                          title={item.game_name}
                        >
                          {item.game_name || "—"}
                        </td>
                        <td className="py-2 pr-2 text-wa-green/80 font-bold text-[10px] whitespace-nowrap">
                          {item.booking_code || "—"}
                        </td>
                        <td className="py-2 pr-2 whitespace-nowrap">
                          {item.commission_source === "retroactive" ? (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-wa-orange/20 text-wa-orange border border-wa-orange/30">Retro</span>
                          ) : item.commission_source === "manual" ? (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-400/30">Manual</span>
                          ) : (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-wa-green/15 text-wa-green border border-wa-green/30">Live</span>
                          )}
                        </td>
                        <td className="py-2 text-right text-wa-green font-bold whitespace-nowrap">
                          {formatEGP(item.commission_amount)} EGP
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-between items-center pt-3 mt-1 border-t border-wa-green/20 text-[11px] font-bold font-mono">
                  <span className="uppercase tracking-widest opacity-50">Total</span>
                  <span className="text-wa-green">{formatEGP(total)} EGP</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
