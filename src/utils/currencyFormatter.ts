/**
 * Currency Formatting Utilities for Bangladesh Bank / Commercial Banking System (BDT ৳)
 */

export const CURRENCY_SYMBOL = '৳';
export const CURRENCY_CODE = 'BDT';

/**
 * Formats a numeric amount in Bangladeshi Taka (BDT ৳).
 * e.g. 1500000 -> "৳1,500,000"
 */
export function formatTaka(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '৳0';
  return `৳${Math.round(amount).toLocaleString('en-US')}`;
}

/**
 * Formats large amounts compactly in Millions / Lakhs / Crores:
 * e.g. 25000000 -> "৳25.0M" or "৳2.5 Cr"
 */
export function formatTakaCompact(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '৳0';
  const abs = Math.abs(amount);

  if (abs >= 1000000) {
    return `৳${(amount / 1000000).toFixed(2)}M`;
  }
  if (abs >= 1000) {
    return `৳${(amount / 1000).toFixed(0)}k`;
  }
  return `৳${Math.round(amount)}`;
}
