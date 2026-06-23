"use client";

import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";

type QuickFilter = "this_week" | "this_month" | "last_month";

interface Props {
  fromDate: string;
  toDate: string;
  onSelect: (from: string, to: string) => void;
}

function computeRange(filter: QuickFilter): { from: string; to: string } {
  const now = new Date();
  if (filter === "this_week") {
    return {
      from: format(startOfWeek(now, { weekStartsOn: 0 }), "yyyy-MM-dd"),
      to: format(endOfWeek(now, { weekStartsOn: 0 }), "yyyy-MM-dd"),
    };
  }
  if (filter === "this_month") {
    return {
      from: format(startOfMonth(now), "yyyy-MM-dd"),
      to: format(endOfMonth(now), "yyyy-MM-dd"),
    };
  }
  // last_month
  const lastMonth = subMonths(now, 1);
  return {
    from: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
    to: format(endOfMonth(lastMonth), "yyyy-MM-dd"),
  };
}

const FILTERS: { key: QuickFilter; label: string }[] = [
  { key: "this_week", label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
];

export function SalariesFilterBar({ fromDate, toDate, onSelect }: Props) {
  function isActive(filter: QuickFilter): boolean {
    const range = computeRange(filter);
    return range.from === fromDate && range.to === toDate;
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {FILTERS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => {
            const range = computeRange(key);
            onSelect(range.from, range.to);
          }}
          className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${
            isActive(key)
              ? "border-wa-green bg-wa-green/20 text-wa-green"
              : "border-wa-green/20 text-wa-text/40 hover:border-wa-green/40 hover:text-wa-text/70"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
