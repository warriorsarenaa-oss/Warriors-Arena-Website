/**
 * TIME SLOT UTILITIES
 * Used for generating and resolving booking slots based on operating hours.
 */

/**
 * Generates an array of time strings (HH:mm:ss) between start and end with a given interval.
 */
export function generateTimeSlots(start: string, end: string, intervalMinutes: number = 30): string[] {
  const slots: string[] = [];
  
  // Handle empty or invalid inputs
  if (!start || !end) return slots;

  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  let currentTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  while (currentTotal <= endTotal) {
    const h = Math.floor(currentTotal / 60);
    const m = currentTotal % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
    currentTotal += intervalMinutes;
  }

  return slots;
}
