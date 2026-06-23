/**
 * Round a monetary EGP value to 2 decimal places.
 * Use for ALL arithmetic involving EGP amounts to avoid IEEE-754 drift.
 */
export function roundEGP(amount: number | null | undefined): number {
  if (amount == null || isNaN(amount)) return 0;
  return Math.round(amount * 100) / 100;
}

/**
 * Format an EGP value for display. Always 2 decimal places.
 * Use for ALL EGP amounts shown in UI components.
 */
export function formatEGP(amount: number | null | undefined): string {
  return roundEGP(amount).toFixed(2);
}
