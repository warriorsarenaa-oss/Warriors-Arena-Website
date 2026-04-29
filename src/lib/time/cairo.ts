import { formatInTimeZone, toDate, fromZonedTime } from "date-fns-tz";
import { format, parse, isValid } from "date-fns";

const CAIRO_TZ = "Africa/Cairo";

/**
 * CAIRO TIME ZONE UTILITIES
 * 
 * Warriors Arena operates strictly in the Africa/Cairo timezone.
 * These helpers ensure we handle the UTC offset correctly, especially
 * around midnight when Cairo and UTC can be on different days.
 */

/**
 * Returns the current date and time in Cairo as a Date object.
 */
export function cairoNow(): Date {
  return toDate(new Date(), { timeZone: CAIRO_TZ });
}

/**
 * Formats a date into a Cairo-localized ISO-style date string (yyyy-mm-dd).
 * Essential for database queries and slot lookups.
 */
export function formatCairoDate(date: Date | string | number): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (!isValid(d)) return "Invalid Date";
  return formatInTimeZone(d, CAIRO_TZ, "yyyy-MM-dd");
}

/**
 * Converts a 24-hour time string (HH:mm) to a 12-hour Cairo display string (7:00 PM).
 * Note: No leading zero for hours per R-STYLE (6:00 PM not 06:00 PM).
 */
export function formatCairoTime(time24: string): string {
  try {
    // We use a dummy date for parsing the time string
    const date = parse(time24, "HH:mm", new Date());
    if (!isValid(date)) return time24;
    return format(date, "h:mm a");
  } catch {
    return time24;
  }
}

/**
 * Parses a Cairo-localized date string into a UTC Date object.
 */
export function parseCairoDate(dateStr: string): Date {
  // Assume dateStr is yyyy-MM-dd
  return fromZonedTime(dateStr, CAIRO_TZ);
}

/**
 * Calculates minutes elapsed since 00:00 for a given HH:mm time string.
 * Used for slot conflict calculations and operating hours comparisons.
 */
export function minutesSinceMidnight(timeStr: string): number {
  const parts = timeStr.split(":");
  if (parts.length !== 2) return 0;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (isNaN(hours) || isNaN(minutes)) return 0;
  
  return (hours * 60) + minutes;
}

/**
 * Formats a Date object into a readable Cairo timestamp for audit logs.
 */
export function formatCairoFull(date: Date): string {
  return formatInTimeZone(date, CAIRO_TZ, "yyyy-MM-dd HH:mm:ss 'GMT'XXX");
}
