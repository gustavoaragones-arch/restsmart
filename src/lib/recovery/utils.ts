/**
 * Global numeric safety utilities for recovery engine
 * Prevents NaN, negative decay, and undefined propagation
 */

export function clamp(value: number, min: number, max: number): number {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export function safeNumber(value: unknown, fallback: number): number {
  if (value == null) return fallback;
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

export function hoursBetween(date1: string | Date, date2: string | Date): number {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;
  const ms = d2.getTime() - d1.getTime();
  if (Number.isNaN(ms)) return 0;
  const hours = ms / (1000 * 60 * 60);
  return hours < 0 ? 0 : hours;
}

export function normalizeTo100(value: number, maxPossible: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(maxPossible) || maxPossible <= 0) return 0;
  const ratio = value / maxPossible;
  return clamp(ratio * 100, 0, 100);
}
