import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const COLORS = {
  background: '#0f172a',
  surface: '#1e293b',
  surfaceElevated: '#273549',
  border: '#334155',
  primary: '#3b82f6',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  textSubtle: '#64748b',
} as const

export function getRecoveryColor(score: number): string {
  if (score >= 85) return COLORS.green
  if (score >= 60) return COLORS.amber
  return COLORS.red
}

export function getRecoveryLabel(score: number): string {
  if (score >= 85) return 'Train Hard'
  if (score >= 60) return 'Moderate'
  if (score >= 40) return 'Active Recovery'
  return 'Rest Today'
}

export function formatHoursMinutes(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
