"use client";

import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  subWeeks,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

type QuickFilter = "this_week" | "last_week" | "this_month" | "last_month" | "all_time";

const CAIRO_TZ = "Africa/Cairo";

interface Props {
  fromDate: string;
  toDate: string;
  onSelect: (from: string, to: string) => void;
}

function computeRange(filter: QuickFilter): { from: string; to: string } {
  const now = new Date();
  if (filter === "this_week") {
    const sun = startOfWeek(now, { weekStartsOn: 0 });
    const sat = endOfWeek(now, { weekStartsOn: 0 });
    return {
      from: formatInTimeZone(sun, CAIRO_TZ, "yyyy-MM-dd"),
      to: formatInTimeZone(sat, CAIRO_TZ, "yyyy-MM-dd"),
    };
  }
  if (filter === "last_week") {
    const sun = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
    const sat = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
    return {
      from: formatInTimeZone(sun, CAIRO_TZ, "yyyy-MM-dd"),
      to: formatInTimeZone(sat, CAIRO_TZ, "yyyy-MM-dd"),
    };
  }
  if (filter === "this_month") {
    return {
      from: formatInTimeZone(startOfMonth(now), CAIRO_TZ, "yyyy-MM-dd"),
      to: formatInTimeZone(endOfMonth(now), CAIRO_TZ, "yyyy-MM-dd"),
    };
  }
  if (filter === "last_month") {
    const lm = subMonths(now, 1);
    return {
      from: formatInTimeZone(startOfMonth(lm), CAIRO_TZ, "yyyy-MM-dd"),
      to: formatInTimeZone(endOfMonth(lm), CAIRO_TZ, "yyyy-MM-dd"),
    };
  }
  // all_time — from project epoch through today Cairo
  return {
    from: "2024-01-01",
    to: formatInTimeZone(now, CAIRO_TZ, "yyyy-MM-dd"),
  };
}

const FILTERS: { key: QuickFilter; label: string }[] = [
  { key: "this_week", label: "This Week" },
  { key: "last_week", label: "Last Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "all_time", label: "All Time" },
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
