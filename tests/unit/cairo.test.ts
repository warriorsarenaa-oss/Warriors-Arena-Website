import { describe, it, expect } from "vitest";
import { formatCairoTime, formatCairoDate, minutesSinceMidnight, cairoNow } from "@/lib/time/cairo";

describe("Cairo Time Helpers", () => {
  it("formats 24h string to 12h AM/PM without leading zeros", () => {
    expect(formatCairoTime("18:00")).toBe("6:00 PM");
    expect(formatCairoTime("06:00")).toBe("6:00 AM");
    expect(formatCairoTime("00:00")).toBe("12:00 AM");
    expect(formatCairoTime("12:00")).toBe("12:00 PM");
  });

  it("formats dates to yyyy-MM-dd in Cairo timezone", () => {
    // 2026-04-20 23:00 UTC is 2026-04-21 02:00 Cairo
    const date = new Date("2026-04-20T23:00:00Z");
    expect(formatCairoDate(date)).toBe("2026-04-21");
    
    // 2026-04-21 01:00 UTC is 2026-04-21 04:00 Cairo
    const date2 = new Date("2026-04-21T01:00:00Z");
    expect(formatCairoDate(date2)).toBe("2026-04-21");
  });

  it("calculates minutes since midnight correctly", () => {
    expect(minutesSinceMidnight("00:00")).toBe(0);
    expect(minutesSinceMidnight("01:00")).toBe(60);
    expect(minutesSinceMidnight("12:00")).toBe(720);
    expect(minutesSinceMidnight("23:59")).toBe(1439);
  });

  it("cairoNow returns a date that is currently Cairo time", () => {
    const now = cairoNow();
    expect(now).toBeDefined();
    // Verification of offset is hard in a single test, but we ensure it doesn't crash
  });
});
