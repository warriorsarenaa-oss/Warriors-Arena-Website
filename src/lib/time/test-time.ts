import { formatCairoTime, formatCairoDate, cairoNow } from "./cairo";

console.log("18:00 ->", formatCairoTime("18:00"));
console.log("06:00 ->", formatCairoTime("06:00"));
console.log("Date ->", formatCairoDate(new Date()));
console.log("Now ->", cairoNow().toISOString());
