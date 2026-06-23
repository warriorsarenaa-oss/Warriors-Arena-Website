"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  User as UserIcon,
} from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { formatEGP } from "@/lib/utils/format";
import type { SalaryCardData } from "@/features/salaries/types";

const STATUS_CONFIG = {
  settled: {
    label: "SETTLED",
    Icon: CheckCircle2,
    badgeClass: "text-wa-green bg-wa-green/20 border-wa-green/30",
  },
  partial: {
    label: "PARTIAL",
    Icon: AlertCircle,
    badgeClass: "text-wa-orange bg-wa-orange/20 border-wa-orange/30",
  },
  unpaid: {
    label: "UNPAID",
    Icon: Clock,
    badgeClass: "text-red-400 bg-red-400/20 border-red-400/30",
  },
} as const;

export function SalaryCard({ data }: { data: SalaryCardData }) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const { label, Icon: StatusIcon, badgeClass } = STATUS_CONFIG[data.status];
  const remaining = data.totalCalculated - data.totalPaid;

  return (
    <WAPanel className="p-6 border-wa-green/10 bg-wa-bg/40 flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-wa-green/10 rounded-full flex items-center justify-center border border-wa-green/20 shrink-0">
            <UserIcon className="w-5 h-5 text-wa-green" />
          </div>
          <div>
            <h3 className="font-bold uppercase tracking-widest text-sm leading-tight">
              {data.displayName}
            </h3>
            <p className="text-[10px] opacity-40 uppercase mt-0.5">
              @{data.username}
            </p>
          </div>
        </div>
        <span
          className={`flex items-center gap-1 text-[8px] px-2 py-1 rounded-full border font-bold uppercase shrink-0 ${badgeClass}`}
        >
          <StatusIcon className="w-3 h-3" />
          {label}
        </span>
      </div>

      {/* Breakdown rows */}
      <div className="space-y-2 mt-1">
        <div className="flex justify-between text-xs border-b border-wa-green/5 pb-2">
          <span className="opacity-50 uppercase tracking-widest text-[10px]">
            Hours Pay ({data.totalHours}h)
          </span>
          <span className="font-mono">{formatEGP(data.totalHoursPay)} EGP</span>
        </div>
        <div className="flex justify-between text-xs border-b border-wa-green/5 pb-2">
          <span className="opacity-50 uppercase tracking-widest text-[10px]">
            Commissions ({data.totalMissions} missions)
          </span>
          <span className="font-mono text-wa-green">
            +{formatEGP(data.totalCommission)} EGP
          </span>
        </div>
        <div className="flex justify-between text-xs border-b border-wa-green/5 pb-2">
          <span className="opacity-50 uppercase tracking-widest text-[10px]">
            Total Owed
          </span>
          <span className="font-mono">{formatEGP(data.totalCalculated)} EGP</span>
        </div>
        <div className="flex justify-between items-end pt-1">
          <span className="font-bold uppercase tracking-widest text-[10px] text-wa-green">
            Total Paid
          </span>
          <span className="text-2xl font-bold font-mono text-wa-green">
            {formatEGP(data.totalPaid)} EGP
          </span>
        </div>
        {remaining > 0.01 && (
          <div className="flex justify-between text-xs pt-1">
            <span className="opacity-50 uppercase tracking-widest text-[10px] text-wa-orange">
              Remaining
            </span>
            <span className="font-mono text-wa-orange font-bold">
              {formatEGP(remaining)} EGP
            </span>
          </div>
        )}
      </div>

      {/* Payment history accordion */}
      {data.paymentHistory.length > 0 && (
        <div className="border-t border-wa-green/10 pt-3 mt-1">
          <button
            type="button"
            onClick={() => setHistoryOpen((o) => !o)}
            className="flex items-center justify-between w-full text-[10px] uppercase tracking-widest opacity-50 hover:opacity-80 transition-opacity"
          >
            <span>
              Payment History ({data.paymentHistory.length}{" "}
              {data.paymentHistory.length === 1 ? "push" : "pushes"})
            </span>
            {historyOpen ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {historyOpen && (
            <div className="mt-3 flex flex-col gap-2">
              {data.paymentHistory.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-1 p-3 bg-wa-bg rounded border border-wa-line text-xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono opacity-50">{p.date}</span>
                    <span className="font-bold font-mono text-wa-green">
                      {formatEGP(p.amount)} EGP
                    </span>
                  </div>
                  {p.notes && (
                    <p className="text-[10px] opacity-40 italic leading-relaxed">
                      {p.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </WAPanel>
  );
}
