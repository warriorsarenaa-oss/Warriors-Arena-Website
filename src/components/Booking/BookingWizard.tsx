"use client";

/**
 * BookingWizard — 5-step reservation flow
 *
 * Steps: 1 Choose Game → 2 Configure → 3 Select Date → 4 Select Time → 5 Your Info → Success
 * Fetches live game + bundle data from Supabase (client-side anon read).
 * No hardcoded prices per AGENTS.md.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { supabaseBrowser } from "@/lib/db/supabase-browser";
import { useParams } from "next/navigation";
import { useBooking } from "@/contexts/BookingContext";
import {
  X,
  ArrowLeft,
  ArrowRight,
  Lock,
  Check,
  Zap,
  Target,
  Sparkles,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIME_SLOTS = [
  "6:00 PM",
  "6:30 PM",
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
  "8:30 PM",
];

// v1: show all slots as available. Real availability check comes in v1.1.
type SlotStatus = "available" | "booked" | "closing";
const SLOT_STATUSES: Record<string, SlotStatus> = {
  "6:00 PM": "available",
  "6:30 PM": "available",
  "7:00 PM": "available",
  "7:30 PM": "available",
  "8:00 PM": "available",
  "8:30 PM": "available",
};

const MAX_PLAYERS = 6;
const MIN_PLAYERS = 2;

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

interface WizardGame {
  id: string;
  name: string;
  slug: string;
  image: string;
  pricePerPlayer: number;
}

interface WizardBundle {
  id: string;
  name: string;
  slug: string;
  priceValue: number;
  pricingMode: "per_player" | "fixed_total";
  playerCount: number;
  durationMinutes: number;
}

type WizardPick =
  | { kind: "game"; item: WizardGame }
  | { kind: "bundle"; item: WizardBundle };

interface SelectedDate {
  d: number;
  m: number;
  y: number;
}

interface ContactInfo {
  name: string;
  phone: string;
  email: string;
}

interface ConfirmedBooking {
  code: string;
  price: number;
  pick: WizardPick;
  players: number;
  duration: number;
  date: SelectedDate;
  time: string;
  info: ContactInfo;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function genCode(): string {
  return "WA-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function fmt(n: number): string {
  return n.toLocaleString("en-EG");
}

function formatDate(d: SelectedDate): string {
  return `${String(d.m + 1).padStart(2, "0")}/${String(d.d).padStart(2, "0")}/${d.y}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Heading({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-6">
      <div
        className="font-mono text-wa-green mb-1"
        style={{ fontSize: 11, letterSpacing: ".25em" }}
      >
        {kicker}
      </div>
      <div
        className="font-archivo uppercase text-wa-text"
        style={{ fontSize: 34, lineHeight: 1 }}
      >
        {title}
      </div>
      {sub && (
        <p
          className="text-wa-text-dim mt-2"
          style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 560 }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function PickCard({
  active,
  onClick,
  icon,
  title,
  price,
  meta,
  orange = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  price: string;
  meta: string;
  orange?: boolean;
}) {
  const accentColor = orange ? "var(--wa-orange)" : "var(--wa-green)";
  const activeShadow = orange
    ? "0 0 0 1px var(--wa-orange), 0 0 24px rgba(255,122,26,.18)"
    : "0 0 0 1px var(--wa-green), 0 0 24px rgba(143,224,74,.18)";

  return (
    <button
      type="button"
      onClick={onClick}
      className="wa-panel text-left cursor-pointer transition-all duration-150"
      style={{
        padding: 16,
        borderColor: active ? accentColor : "var(--wa-line)",
        boxShadow: active ? activeShadow : "none",
        background: active ? "rgba(143,224,74,.04)" : "var(--wa-panel)",
      }}
    >
      <div style={{ color: accentColor }}>{icon}</div>
      <div
        className="font-archivo uppercase text-wa-text mt-2"
        style={{ fontSize: 17 }}
      >
        {title}
      </div>
      <div
        className="font-mono text-wa-text-mute mt-1"
        style={{ fontSize: 10, letterSpacing: ".12em" }}
      >
        {meta}
      </div>
      <div
        className="font-archivo mt-3"
        style={{ fontSize: 19, color: accentColor }}
      >
        {price}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Choose Game
// ---------------------------------------------------------------------------

function StepGame({
  value,
  onChange,
  games,
  bundles,
  loading,
  t,
}: {
  value: WizardPick | null;
  onChange: (p: WizardPick) => void;
  games: WizardGame[];
  bundles: WizardBundle[];
  loading: boolean;
  t: (key: string) => string;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-wa-text-dim font-mono text-xs tracking-widest">
        LOADING ARSENAL...
      </div>
    );
  }

  return (
    <div>
      <Heading kicker="01 / 05" title={t("chooseGame")} sub={t("gameOrBundle")} />

      {games.length > 0 && (
        <>
          <div
            className="font-mono text-wa-text-mute mb-2 mt-4"
            style={{ fontSize: 11, letterSpacing: ".15em" }}
          >
            // {t("singleGames")}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {games.map((g) => (
              <PickCard
                key={g.id}
                active={value?.kind === "game" && value.item.id === g.id}
                onClick={() => onChange({ kind: "game", item: g })}
                icon={<Target size={17} />}
                title={g.name}
                price={`${fmt(g.pricePerPlayer)} EGP`}
                meta={`${t("perPlayer").toUpperCase()}`}
              />
            ))}
          </div>
        </>
      )}

      {bundles.length > 0 && (
        <>
          <div
            className="font-mono text-wa-text-mute mb-2 mt-6"
            style={{ fontSize: 11, letterSpacing: ".15em" }}
          >
            // {t("bundlesLabel")}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {bundles.map((b) => (
              <PickCard
                key={b.id}
                active={value?.kind === "bundle" && value.item.id === b.id}
                onClick={() => onChange({ kind: "bundle", item: b })}
                icon={<Sparkles size={17} />}
                title={b.name}
                price={
                  b.pricingMode === "per_player"
                    ? `${fmt(b.priceValue)} EGP/${t("perPlayer").slice(0, 2)}`
                    : `${fmt(b.priceValue)} EGP`
                }
                meta={`${b.playerCount} PL · ${b.durationMinutes}M`}
                orange
              />
            ))}
          </div>
        </>
      )}

      {games.length === 0 && bundles.length === 0 && (
        <div className="text-wa-text-dim font-mono text-xs tracking-widest py-12 text-center">
          NO GAMES AVAILABLE — PLEASE TRY AGAIN SHORTLY
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Configure (players + duration)
// ---------------------------------------------------------------------------

function IconRoundBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="border border-wa-line grid place-items-center transition-colors"
      style={{
        width: 44,
        height: 44,
        background: disabled ? "var(--wa-panel)" : "var(--wa-panel-2)",
        color: disabled ? "var(--wa-text-mute)" : "var(--wa-green)",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function StepConfigure({
  pick,
  players,
  setPlayers,
  duration,
  setDuration,
  t,
}: {
  pick: WizardPick | null;
  players: number;
  setPlayers: (n: number) => void;
  duration: number;
  setDuration: (n: number) => void;
  t: (key: string) => string;
}) {
  const isBundle = pick?.kind === "bundle";
  const isFixedTotal = isBundle && pick.item.pricingMode === "fixed_total";

  const sub = isBundle ? t("bundleConfig") : t("tuneSquad");

  return (
    <div>
      <Heading kicker="02 / 05" title={t("configure")} sub={sub} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
        {/* Players */}
        <div className="wa-panel p-5">
          <div className="wa-label">{t("players")}</div>
          <div className="flex items-center gap-4 mt-3">
            <IconRoundBtn
              onClick={() => !isFixedTotal && setPlayers(Math.max(MIN_PLAYERS, players - 1))}
              disabled={isFixedTotal}
            >
              <span className="text-lg leading-none">−</span>
            </IconRoundBtn>
            <div className="flex-1 text-center">
              <div
                className="font-archivo text-wa-green"
                style={{ fontSize: 58, lineHeight: 1 }}
              >
                {players}
              </div>
              <div
                className="font-mono text-wa-text-mute mt-1"
                style={{ fontSize: 10, letterSpacing: ".2em" }}
              >
                {t("maxPlayers")}
              </div>
            </div>
            <IconRoundBtn
              onClick={() => !isFixedTotal && setPlayers(Math.min(MAX_PLAYERS, players + 1))}
              disabled={isFixedTotal}
            >
              <span className="text-lg leading-none">+</span>
            </IconRoundBtn>
          </div>
          {isFixedTotal && (
            <div className="wa-tag wa-tag--orange mt-4 w-full justify-center">
              <Lock size={11} />
              {t("fixedTeamBundle")}
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="wa-panel p-5">
          <div className="wa-label">{t("duration")}</div>
          <div className="flex gap-3 mt-3">
            {([30, 60] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => !isBundle && setDuration(d)}
                disabled={isBundle}
                className="wa-panel flex-1 transition-all duration-150"
                style={{
                  padding: "20px 12px",
                  cursor: isBundle ? "not-allowed" : "pointer",
                  color: duration === d ? "#0a0d0a" : "var(--wa-text)",
                  background: duration === d ? "var(--wa-green)" : "var(--wa-panel)",
                  borderColor: duration === d ? "var(--wa-green)" : "var(--wa-line)",
                  opacity: isBundle && duration !== d ? 0.3 : 1,
                  textAlign: "center",
                }}
              >
                <div className="font-archivo" style={{ fontSize: 36, lineHeight: 1 }}>
                  {d}
                </div>
                <div
                  className="font-mono opacity-70 mt-1"
                  style={{ fontSize: 10, letterSpacing: ".18em" }}
                >
                  {t("minutes")}
                </div>
              </button>
            ))}
          </div>
          {isBundle && (
            <div className="wa-tag mt-4 w-full justify-center">
              <Lock size={11} />
              {t("bundleLockedDuration")}
            </div>
          )}
        </div>
      </div>

      {/* Bundle min-player warning */}
      {pick?.kind === "bundle" &&
        pick.item.pricingMode === "per_player" &&
        players < pick.item.playerCount && (
          <div
            className="wa-panel mt-4 p-3"
            style={{
              borderColor: "rgba(255,192,67,.4)",
              background: "rgba(255,192,67,.06)",
            }}
          >
            <div
              className="font-mono text-wa-amber"
              style={{ fontSize: 11, letterSpacing: ".15em" }}
            >
              ⚠ {t("bundleMinWarning")} ({pick.item.playerCount} players min)
            </div>
          </div>
        )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Select Date
// ---------------------------------------------------------------------------

function StepDate({
  value,
  onChange,
  t,
}: {
  value: SelectedDate | null;
  onChange: (d: SelectedDate) => void;
  t: (key: string) => string;
}) {
  const today = useMemo(() => new Date(), []);
  const [monthOffset, setMonthOffset] = useState(0);

  const view = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [today, monthOffset]
  );

  const monthName = view.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstDay = view.getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isPast = useCallback(
    (d: number) => {
      const cand = new Date(view.getFullYear(), view.getMonth(), d);
      const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return cand < today0;
    },
    [view, today]
  );

  // Mondays (day index 1) are closed per reference
  const isClosed = useCallback(
    (d: number) =>
      new Date(view.getFullYear(), view.getMonth(), d).getDay() === 1,
    [view]
  );

  const isSelected = useCallback(
    (d: number) =>
      value !== null &&
      value.d === d &&
      value.m === view.getMonth() &&
      value.y === view.getFullYear(),
    [value, view]
  );

  return (
    <div>
      <Heading kicker="03 / 05" title={t("selectDate")} sub={t("mondayClosed")} />

      {/* Month navigator */}
      <div className="flex items-center justify-between mb-4 mt-3">
        <button
          type="button"
          className="wa-btn wa-btn--ghost wa-btn-sm"
          onClick={() => setMonthOffset((o) => o - 1)}
          disabled={monthOffset <= 0}
          style={{ opacity: monthOffset <= 0 ? 0.3 : 1 }}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="font-archivo uppercase text-wa-text" style={{ fontSize: 26, letterSpacing: ".04em" }}>
          {monthName}
        </div>
        <button
          type="button"
          className="wa-btn wa-btn--ghost wa-btn-sm"
          onClick={() => setMonthOffset((o) => o + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day, i) => (
          <div
            key={i}
            className="font-mono text-wa-text-mute text-center py-2"
            style={{
              fontSize: 9,
              letterSpacing: ".18em",
              borderBottom: "1px solid var(--wa-line)",
              color: i === 1 ? "var(--wa-red)" : undefined,
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid — key resets stagger animation on month change */}
      <div key={monthOffset} className="grid grid-cols-7 gap-2">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const closed = isClosed(d);
          const past = isPast(d);
          const disabled = past || closed;
          const selected = isSelected(d);

          // Build class string
          let cls = "wa-cal-day";
          if (selected) cls += " wa-cal-day--selected";
          else if (closed) cls += " wa-cal-day--closed";
          else if (past) cls += " wa-cal-day--past";

          // Stagger entry animation for visible cells; pop for selected
          const cellAnim = selected
            ? "wa-day-pop 350ms cubic-bezier(.2,1.3,.3,1) both"
            : `wa-cell-in 320ms cubic-bezier(.2,1.1,.2,1) ${Math.min(i * 20, 420)}ms both`;

          return (
            <button
              key={`${monthOffset}-${i}`}
              type="button"
              disabled={disabled}
              onClick={() =>
                !disabled && onChange({ d, m: view.getMonth(), y: view.getFullYear() })
              }
              className={cls}
              style={{ animation: cellAnim }}
            >
              <span style={{ fontSize: 16 }}>{d}</span>
              {closed && !past && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 4,
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: 7,
                    letterSpacing: ".14em",
                    color: "var(--wa-red)",
                    opacity: 0.5,
                  }}
                >
                  CLSD
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-6 flex-wrap">
        {(
          [
            ["var(--wa-green)", "Selected"],
            ["var(--wa-panel)", "Available"],
            ["rgba(8,11,8,.5)", "Closed (Mon)"],
          ] as [string, string][]
        ).map(([color, label]) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="border border-wa-line"
              style={{ width: 12, height: 12, background: color, flexShrink: 0 }}
            />
            <span className="font-mono text-wa-text-dim" style={{ fontSize: 11, letterSpacing: ".1em" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Select Time
// ---------------------------------------------------------------------------

function StepTime({
  value,
  onChange,
  t,
}: {
  value: string | null;
  onChange: (slot: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div>
      <Heading kicker="04 / 05" title={t("selectTime")} sub={t("slotExclusive")} />

      <div className="grid grid-cols-3 gap-3 mt-4">
        {TIME_SLOTS.map((slot) => {
          const status = SLOT_STATUSES[slot] ?? "available";
          const selected = value === slot;
          const isDisabled = status === "booked";

          let slotClass = "wa-slot";
          if (selected) slotClass += " wa-slot--selected";
          else slotClass += ` wa-slot--${status}`;

          return (
            <button
              key={slot}
              type="button"
              className={slotClass}
              disabled={isDisabled}
              onClick={() => status === "available" && onChange(slot)}
              style={{ padding: "18px 8px" }}
            >
              <div className="font-archivo" style={{ fontSize: 20 }}>
                {slot}
              </div>
              <div
                className="font-mono mt-1 opacity-70"
                style={{ fontSize: 10, letterSpacing: ".15em" }}
              >
                {selected
                  ? "LOCKED"
                  : status === "available"
                  ? "AVAILABLE"
                  : status === "booked"
                  ? "BOOKED"
                  : "CLOSING"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-5 mt-5 flex-wrap">
        {(
          [
            ["available", "Available", "var(--wa-green)"],
            ["booked", "Booked", "var(--wa-red)"],
            ["closing", "Closing soon", "var(--wa-amber)"],
          ] as [string, string, string][]
        ).map(([key, label, color]) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className={`wa-slot wa-slot--${key}`}
              style={{ width: 22, height: 22, padding: 0 }}
            />
            <span className="font-mono" style={{ fontSize: 11, color }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Your Info
// ---------------------------------------------------------------------------

function StepInfo({
  info,
  setInfo,
  t,
}: {
  info: ContactInfo;
  setInfo: (i: ContactInfo) => void;
  t: (key: string) => string;
}) {
  return (
    <div>
      <Heading kicker="05 / 05" title={t("yourInfo")} sub={t("justEnough")} />

      <div className="flex flex-col gap-4 mt-2" style={{ maxWidth: 520 }}>
        <div>
          <label className="wa-label">{t("fullName")} *</label>
          <input
            className="wa-input"
            value={info.name}
            onChange={(e) => setInfo({ ...info, name: e.target.value })}
            placeholder="Cpt. Warrior"
          />
        </div>
        <div>
          <label className="wa-label">{t("phone")} *</label>
          <input
            className="wa-input"
            value={info.phone}
            onChange={(e) => setInfo({ ...info, phone: e.target.value })}
            placeholder="+20 122 xxx xxxx"
            type="tel"
          />
        </div>
        <div>
          <label className="wa-label">{t("email")}</label>
          <input
            className="wa-input"
            value={info.email}
            onChange={(e) => setInfo({ ...info, email: e.target.value })}
            placeholder="you@warriors.egy"
            type="email"
          />
        </div>

        {/* Deposit notice */}
        <div
          className="wa-panel p-4 mt-2"
          style={{ borderColor: "rgba(255,122,26,.3)" }}
        >
          <div
            className="font-mono text-wa-orange mb-2"
            style={{ fontSize: 11, letterSpacing: ".18em" }}
          >
            ⚠ {t("depositRequired")}
          </div>
          <div className="text-wa-text-dim" style={{ fontSize: 13, lineHeight: 1.5 }}>
            {t("depositInfo")}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order summary sidebar
// ---------------------------------------------------------------------------

function OrderSummary({
  pick,
  players,
  duration,
  date,
  time,
  price,
  t,
}: {
  pick: WizardPick | null;
  players: number;
  duration: number;
  date: SelectedDate | null;
  time: string | null;
  price: number;
  t: (key: string) => string;
}) {
  return (
    <div
      className="wa-panel wa-panel-clip wa-brackets"
      style={{ padding: 22, position: "sticky", top: 20 }}
    >
      <div
        className="font-mono text-wa-green"
        style={{ fontSize: 11, letterSpacing: ".25em" }}
      >
        // ORDER RECEIPT
      </div>
      <div className="font-archivo uppercase text-wa-text mt-1" style={{ fontSize: 20 }}>
        YOUR BOOKING
      </div>

      <div className="flex flex-col gap-3 mt-5">
        {(
          [
            ["GAME", pick?.item?.name ?? "—"],
            ["PLAYERS", String(players)],
            ["DURATION", `${duration}M`],
            ["DATE", date ? formatDate(date) : "—"],
            ["TIME", time ?? "—"],
          ] as [string, string][]
        ).map(([k, v]) => (
          <div key={k} className="flex justify-between items-baseline gap-2">
            <span
              className="font-mono text-wa-text-mute"
              style={{ fontSize: 11, letterSpacing: ".15em" }}
            >
              {k}
            </span>
            <span className="text-wa-text text-right" style={{ fontSize: 14 }}>
              {v}
            </span>
          </div>
        ))}
      </div>

      <div
        className="my-5"
        style={{ borderTop: "1px dashed var(--wa-line-hot)" }}
      />

      <div className="flex justify-between items-end">
        <div
          className="font-mono text-wa-text-mute"
          style={{ fontSize: 11, letterSpacing: ".2em" }}
        >
          {t("totalPrice")}
        </div>
        <div className="font-archivo text-wa-green" style={{ fontSize: 30 }}>
          {price ? fmt(price) : "—"}{" "}
          <span className="text-wa-text-dim" style={{ fontSize: 12 }}>
            EGP
          </span>
        </div>
      </div>
      <div
        className="font-mono text-wa-text-mute text-right mt-1"
        style={{ fontSize: 10, letterSpacing: ".12em" }}
      >
        {t("depositDue")} · {price ? fmt(Math.round(price / 2)) : "—"} EGP
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({
  step,
  t,
}: {
  step: number;
  t: (key: string) => string;
}) {
  const labels = [
    t("chooseGame"),
    t("configure"),
    t("selectDate"),
    t("selectTime"),
    t("yourInfo"),
  ];

  return (
    <div className="wa-panel" style={{ padding: "14px 20px" }}>
      <div className="flex items-center">
        {labels.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          const dim = !active && !done;

          return (
            <React.Fragment key={i}>
              <div
                className="flex items-center gap-2"
                style={{ opacity: dim ? 0.45 : 1, flex: 1, minWidth: 0 }}
              >
                {/* Number badge */}
                <div
                  className="font-archivo grid place-items-center shrink-0"
                  style={{
                    width: 30,
                    height: 30,
                    fontSize: 12,
                    background: done ? "var(--wa-green)" : "transparent",
                    color: done
                      ? "#0a0d0a"
                      : active
                      ? "var(--wa-green)"
                      : "var(--wa-text-mute)",
                    border: `1px solid ${
                      done || active ? "var(--wa-green)" : "var(--wa-line)"
                    }`,
                    clipPath:
                      "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                  }}
                >
                  {done ? <Check size={13} /> : String(n).padStart(2, "0")}
                </div>

                {/* Label */}
                <div className="hidden sm:block min-w-0">
                  <div
                    className="font-mono text-wa-text-mute"
                    style={{ fontSize: 9, letterSpacing: ".15em" }}
                  >
                    {t("step")} {n}
                  </div>
                  <div
                    className="font-mono truncate"
                    style={{
                      fontSize: 11,
                      color: active ? "var(--wa-green)" : "var(--wa-text)",
                    }}
                  >
                    {label}
                  </div>
                </div>
              </div>

              {/* Connector */}
              {i < labels.length - 1 && (
                <div
                  className="shrink-0 mx-1"
                  style={{
                    width: 16,
                    height: 1,
                    background: done ? "var(--wa-green)" : "var(--wa-line)",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success screen
// ---------------------------------------------------------------------------

function SuccessScreen({
  data,
  onClose,
  t,
}: {
  data: ConfirmedBooking;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const whatsappMessage = encodeURIComponent(
    `Hi Warriors Arena! I have booking code ${data.code}. ` +
      `${data.pick.item.name} · ${data.players} players · ` +
      `${data.date ? formatDate(data.date) : ""} at ${data.time}. ` +
      `Ready to send deposit (${fmt(Math.round(data.price / 2))} EGP).`
  );
  const whatsappUrl = `https://wa.me/201226557592?text=${whatsappMessage}`;

  return (
    <div
      className="fixed inset-0 z-[110] bg-wa-bg overflow-auto"
      style={{ animation: "wa-fadein-up 400ms ease" }}
    >
      {/* Animated background */}
      <div className="wa-anim-grid absolute inset-0" style={{ opacity: 0.5 }} />
      <div className="wa-scanline" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 40% at 50% 35%, rgba(143,224,74,.12), transparent 70%)",
        }}
      />

      <div
        className="relative z-10 max-w-2xl mx-auto px-6"
        style={{ paddingTop: 60, paddingBottom: 60 }}
      >
        {/* Check icon */}
        <div className="text-center">
          <div
            className="bg-wa-green text-wa-bg grid place-items-center mx-auto"
            style={{
              width: 90,
              height: 90,
              clipPath: "polygon(50% 0, 100% 30%, 100% 100%, 0 100%, 0 30%)",
              animation: "wa-count 600ms cubic-bezier(.2,1.1,.2,1) both",
            }}
          >
            <Check size={46} />
          </div>

          <div
            className="font-mono text-wa-green mt-5"
            style={{
              fontSize: 12,
              letterSpacing: ".3em",
              animation: "wa-fadein-up 700ms ease .2s both",
            }}
          >
            {t("transmissionReceived")}
          </div>

          <h1
            className="font-archivo uppercase leading-none mt-2"
            style={{
              fontSize: "clamp(52px, 10vw, 100px)",
              animation: "wa-fadein-up 700ms cubic-bezier(.2,1.1,.2,1) .3s both",
            }}
          >
            YOU&apos;RE{" "}
            <span className="text-wa-green">{t("locked")}</span>
          </h1>
        </div>

        {/* Receipt card */}
        <div
          className="wa-panel wa-panel-clip wa-brackets mt-10 p-7"
          style={{ animation: "wa-fadein-up 800ms ease .5s both" }}
        >
          <div
            className="font-mono text-wa-text-mute"
            style={{ fontSize: 11, letterSpacing: ".25em" }}
          >
            {t("reservationCode").toUpperCase()}
          </div>
          <div
            className="font-archivo text-wa-green mt-1"
            style={{
              fontSize: "clamp(38px, 7vw, 58px)",
              letterSpacing: ".08em",
              textShadow: "0 0 24px rgba(143,224,74,.4)",
              wordBreak: "break-all",
            }}
          >
            {data.code}
          </div>

          {/* Booking details */}
          <div
            className="grid grid-cols-4 gap-4 mt-6 py-5"
            style={{
              borderTop: "1px dashed var(--wa-line-hot)",
              borderBottom: "1px dashed var(--wa-line-hot)",
            }}
          >
            {(
              [
                ["GAME", data.pick.item.name],
                ["PLAYERS", String(data.players)],
                ["DATE", data.date ? `${data.date.m + 1}/${data.date.d}` : "—"],
                ["TIME", data.time],
              ] as [string, string][]
            ).map(([k, v]) => (
              <div key={k}>
                <div
                  className="font-mono text-wa-text-mute"
                  style={{ fontSize: 10, letterSpacing: ".2em" }}
                >
                  {k}
                </div>
                <div className="font-archivo text-wa-text mt-1" style={{ fontSize: 18 }}>
                  {v}
                </div>
              </div>
            ))}
          </div>

          {/* Price + CTAs */}
          <div className="flex items-center justify-between gap-4 mt-5 flex-wrap">
            <div>
              <div
                className="font-mono text-wa-text-mute"
                style={{ fontSize: 10, letterSpacing: ".2em" }}
              >
                TOTAL · 50% DEPOSIT DUE
              </div>
              <div className="font-archivo text-wa-green mt-1" style={{ fontSize: 26 }}>
                {fmt(Math.round(data.price / 2))} /{" "}
                <span className="text-wa-text">{fmt(data.price)}</span>{" "}
                <span className="text-wa-text-dim text-sm">EGP</span>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="wa-btn"
              >
                {t("sendWhatsapp")}
              </a>
            </div>
          </div>
        </div>

        {/* Park notice */}
        <div
          className="wa-panel flex items-start gap-4 mt-4 p-5"
          style={{
            borderColor: "rgba(255,122,26,.3)",
            animation: "wa-fadein-up 800ms ease .7s both",
          }}
        >
          <Shield size={20} className="text-wa-orange shrink-0 mt-0.5" />
          <div className="text-wa-text-dim" style={{ fontSize: 13, lineHeight: 1.5 }}>
            {t("parkFee")}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="wa-btn wa-btn--ghost mt-6"
        >
          {locale === 'ar' ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          {t("backToSite")}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Wizard
// ---------------------------------------------------------------------------

function WizardContent() {
  const t = useTranslations("Landing.Wizard");
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRtl = locale === "ar";
  const { isOpen, seed, closeWizard } = useBooking();

  // Data
  const [games, setGames] = useState<WizardGame[]>([]);
  const [bundles, setBundles] = useState<WizardBundle[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Wizard state
  const [step, setStep] = useState(1);
  const [pick, setPick] = useState<WizardPick | null>(null);
  const [players, setPlayers] = useState(4);
  const [duration, setDuration] = useState(30);
  const [date, setDate] = useState<SelectedDate | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [info, setInfo] = useState<ContactInfo>({ name: "", phone: "", email: "" });
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);

  // Fetch game + bundle data when wizard opens
  useEffect(() => {
    if (!isOpen) return;

    setDataLoading(true);

    Promise.all([
      supabaseBrowser
        .from("games")
        .select("id, slug, name_en, name_ar, hero_image_url, game_pricing(price_per_player)")
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
      supabaseBrowser
        .from("bundles")
        .select(
          "id, slug, title_en, title_ar, price_value, pricing_mode, player_count, duration_minutes"
        )
        .eq("is_active", true)
        .eq("is_visible", true)
        .order("display_order", { ascending: true }),
    ]).then(([gRes, bRes]) => {
      if (!gRes.error && gRes.data) {
        setGames(
          gRes.data.map((g) => {
            const prices = (
              g.game_pricing as { price_per_player: number }[]
            ) ?? [];
            const minPrice =
              prices.length > 0
                ? Math.min(...prices.map((p) => Number(p.price_per_player)))
                : 0;
            return {
              id: g.id as string,
              name: (isRtl ? g.name_ar : g.name_en) || "",
              slug: g.slug as string,
              image: (g.hero_image_url as string) ?? "",
              pricePerPlayer: minPrice,
            };
          })
        );
      }
      if (!bRes.error && bRes.data) {
        setBundles(
          bRes.data.map((b) => ({
            id: b.id as string,
            name: (isRtl ? b.title_ar : b.title_en) || "",
            slug: b.slug as string,
            priceValue: Number(b.price_value),
            pricingMode: (b.pricing_mode as "per_player" | "fixed_total") ?? "per_player",
            playerCount: Number(b.player_count) || 4,
            durationMinutes: Number(b.duration_minutes) || 30,
          }))
        );
      }
      setDataLoading(false);
    });
  }, [isOpen]);

  // Apply seed: pre-select the game/bundle and jump to step 2
  useEffect(() => {
    if (!seed || dataLoading) return;

    if (seed.kind === "game") {
      const found = games.find((g) => g.id === seed.id);
      if (found) {
        setPick({ kind: "game", item: found });
        setStep(2);
      }
    } else {
      const found = bundles.find((b) => b.id === seed.id);
      if (found) {
        setPlayers(found.playerCount);
        setDuration(found.durationMinutes);
        setPick({ kind: "bundle", item: found });
        setStep(2);
      }
    }
  }, [seed, dataLoading, games, bundles]);

  // Reset state when wizard closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setPick(null);
      setPlayers(4);
      setDuration(30);
      setDate(null);
      setTime(null);
      setInfo({ name: "", phone: "", email: "" });
      setConfirmed(null);
    }
  }, [isOpen]);

  // Live price calculation (no hardcoded prices — all from DB data)
  const livePrice = useMemo(() => {
    if (!pick) return 0;
    if (pick.kind === "bundle") {
      return pick.item.pricingMode === "per_player"
        ? pick.item.priceValue * Math.max(players, pick.item.playerCount)
        : pick.item.priceValue;
    }
    // game: 60-min costs 1.6× per AGENTS.md slot mechanics
    const base = duration === 60 ? pick.item.pricePerPlayer * 1.6 : pick.item.pricePerPlayer;
    return Math.round(base * players);
  }, [pick, players, duration]);

  const canProceed = useMemo(() => {
    if (step === 1) return pick !== null;
    if (step === 3) return date !== null;
    if (step === 4) return time !== null;
    if (step === 5) return info.name.trim() !== "" && info.phone.trim() !== "";
    return true;
  }, [step, pick, date, time, info]);

  function handlePickChange(p: WizardPick) {
    setPick(p);
    // Sync duration/players when bundle selected
    if (p.kind === "bundle") {
      setDuration(p.item.durationMinutes);
      if (p.item.pricingMode === "fixed_total") {
        setPlayers(p.item.playerCount);
      }
    }
  }

  function submit() {
    if (!pick || !date || !time) return;
    setConfirmed({
      code: genCode(),
      price: livePrice,
      pick,
      players,
      duration,
      date,
      time,
      info,
    });
  }

  if (!isOpen) return null;

  if (confirmed) {
    return <SuccessScreen data={confirmed} onClose={closeWizard} t={t} />;
  }

  return (
    <div
      className="fixed inset-0 z-[100] overflow-auto"
      style={{
        background: "#050705",
        animation: "wa-fadein-up 280ms ease",
      }}
    >
      <div className="max-w-[1080px] mx-auto px-4 md:px-6" style={{ paddingTop: 28, paddingBottom: 48 }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div
              className="font-mono text-wa-green"
              style={{ fontSize: 11, letterSpacing: ".25em" }}
            >
              // RESERVATION
            </div>
            <div className="font-archivo uppercase text-wa-text" style={{ fontSize: 28, marginTop: 2 }}>
              BOOKING PROTOCOL
            </div>
          </div>
          <button
            type="button"
            onClick={closeWizard}
            className="wa-btn wa-btn--ghost wa-btn-sm flex items-center gap-2"
          >
            <X size={15} /> CLOSE
          </button>
        </div>

        <StepIndicator step={step} t={t} />

        {/* Main grid: step panel + order sidebar */}
        <div
          className="mt-5 grid gap-4"
          style={{
            gridTemplateColumns: "1fr",
          }}
        >
          {/* Small screens stack */}
          <div className="lg:hidden">
            <div className="wa-panel wa-panel-clip" style={{ padding: 24, minHeight: 440 }}>
              {step === 1 && (
                <StepGame
                  value={pick}
                  onChange={handlePickChange}
                  games={games}
                  bundles={bundles}
                  loading={dataLoading}
                  t={t}
                />
              )}
              {step === 2 && (
                <StepConfigure
                  pick={pick}
                  players={players}
                  setPlayers={setPlayers}
                  duration={duration}
                  setDuration={setDuration}
                  t={t}
                />
              )}
              {step === 3 && <StepDate value={date} onChange={setDate} t={t} />}
              {step === 4 && <StepTime value={time} onChange={setTime} t={t} />}
              {step === 5 && <StepInfo info={info} setInfo={setInfo} t={t} />}

              <NavButtons
                step={step}
                canProceed={canProceed}
                onBack={() => setStep((s) => Math.max(1, s - 1))}
                onNext={() => setStep((s) => Math.min(5, s + 1))}
                onSubmit={submit}
                t={t}
                isRtl={isRtl}
              />
            </div>

            <div className="mt-4">
              <OrderSummary
                pick={pick}
                players={players}
                duration={duration}
                date={date}
                time={time}
                price={livePrice}
                t={t}
              />
            </div>
          </div>

          {/* Large screens: 2-column layout */}
          <div
            className="hidden lg:grid gap-4"
            style={{ gridTemplateColumns: "1fr 300px" }}
          >
            <div className="wa-panel wa-panel-clip" style={{ padding: 28, minHeight: 500 }}>
              {step === 1 && (
                <StepGame
                  value={pick}
                  onChange={handlePickChange}
                  games={games}
                  bundles={bundles}
                  loading={dataLoading}
                  t={t}
                />
              )}
              {step === 2 && (
                <StepConfigure
                  pick={pick}
                  players={players}
                  setPlayers={setPlayers}
                  duration={duration}
                  setDuration={setDuration}
                  t={t}
                />
              )}
              {step === 3 && <StepDate value={date} onChange={setDate} t={t} />}
              {step === 4 && <StepTime value={time} onChange={setTime} t={t} />}
              {step === 5 && <StepInfo info={info} setInfo={setInfo} t={t} />}

              <NavButtons
                step={step}
                canProceed={canProceed}
                onBack={() => setStep((s) => Math.max(1, s - 1))}
                onNext={() => setStep((s) => Math.min(5, s + 1))}
                onSubmit={submit}
                t={t}
                isRtl={isRtl}
              />
            </div>

            <OrderSummary
              pick={pick}
              players={players}
              duration={duration}
              date={date}
              time={time}
              price={livePrice}
              t={t}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function NavButtons({
  step,
  canProceed,
  onBack,
  onNext,
  onSubmit,
  t,
  isRtl,
}: {
  step: number;
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  t: (key: string) => string;
  isRtl: boolean;
}) {
  return (
    <div className="flex justify-between items-center gap-3 mt-7">
      <button
        type="button"
        className="wa-btn wa-btn--ghost wa-btn-sm flex items-center gap-2"
        onClick={onBack}
        disabled={step === 1}
        style={{ opacity: step === 1 ? 0.35 : 1 }}
      >
        {isRtl ? <ArrowRight size={13} /> : <ArrowLeft size={13} />}
        {t("back")}
      </button>

      {step < 5 ? (
        <button
          type="button"
          className="wa-btn flex items-center gap-2"
          onClick={onNext}
          disabled={!canProceed}
          style={{ opacity: canProceed ? 1 : 0.4 }}
        >
          {t("next")}
          {isRtl ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
        </button>
      ) : (
        <button
          type="button"
          className="wa-btn flex items-center gap-2"
          onClick={onSubmit}
          disabled={!canProceed}
          style={{ opacity: canProceed ? 1 : 0.4 }}
        >
          <Lock size={13} />
          {t("confirm")}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Portal wrapper — ensures wizard mounts at document.body
// ---------------------------------------------------------------------------

export function BookingWizard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(<WizardContent />, document.body);
}
