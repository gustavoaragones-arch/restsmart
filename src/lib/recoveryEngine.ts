import { differenceInHours } from 'date-fns'
import type {
  RecoveryEngineInput,
  RecoveryEngineOutput,
  MuscleGroup,
  Recommendation
} from '@/types'

// ============================================
// MUSCLE RECOVERY MODEL
// Recovery timelines in hours by group and load
// ============================================

const MUSCLE_SIZE: Record<MuscleGroup, 'small' | 'medium' | 'large'> = {
  arms: 'small',
  calves: 'small',
  chest: 'medium',
  shoulders: 'medium',
  back: 'medium',
  core: 'medium',
  quads: 'large',
  hamstrings: 'large',
  glutes: 'large',
}

const RECOVERY_HOURS: Record<'small' | 'medium' | 'large', Record<'light' | 'moderate' | 'heavy', number>> = {
  small:  { light: 28, moderate: 42, heavy: 54 },
  medium: { light: 36, moderate: 52, heavy: 68 },
  large:  { light: 48, moderate: 66, heavy: 84 },
}

const CNS_RECOVERY_HOURS: Record<'light' | 'moderate' | 'heavy' | 'maximal', number> = {
  light: 24,
  moderate: 48,
  heavy: 72,
  maximal: 120,
}

// ============================================
// HELPERS
// ============================================

function intensityTier(rpe: number | null): 'light' | 'moderate' | 'heavy' {
  if (!rpe) return 'moderate'
  if (rpe <= 4) return 'light'
  if (rpe <= 7) return 'moderate'
  return 'heavy'
}

function cnsTier(rpe: number | null, type: string): 'light' | 'moderate' | 'heavy' | 'maximal' {
  if (type === 'cardio' || type === 'yoga_pilates' || type === 'active_recovery') return 'light'
  if (!rpe) return 'moderate'
  if (rpe >= 10) return 'maximal'
  if (rpe >= 8 || type === 'hiit' || type === 'crossfit') return 'heavy'
  if (rpe >= 5) return 'moderate'
  return 'light'
}

// Sigmoid decay: produces a smooth 0→100 recovery curve
function sigmoidRecovery(hoursElapsed: number, requiredHours: number): number {
  const midpoint = requiredHours * 0.5
  const steepness = 6 / requiredHours
  const raw = 100 / (1 + Math.exp(-steepness * (hoursElapsed - midpoint)))
  return Math.min(100, Math.max(0, Math.round(raw)))
}

// ============================================
// COMPONENT CALCULATORS
// ============================================

function calculateMuscularScore(
  workouts: RecoveryEngineInput['workouts'],
  now: Date
): { score: number; breakdown: Record<MuscleGroup, number> } {
  const allMuscles: MuscleGroup[] = [
    'chest', 'back', 'shoulders', 'arms',
    'quads', 'hamstrings', 'glutes', 'calves', 'core'
  ]

  const breakdown: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>
  allMuscles.forEach(m => { breakdown[m] = 100 })

  for (const workout of workouts) {
    const hoursElapsed = differenceInHours(now, new Date(workout.created_at))
    const tier = intensityTier(workout.intensity_rpe)

    for (const mg of workout.muscle_groups) {
      const muscle = mg.muscle_group as MuscleGroup
      const size = MUSCLE_SIZE[muscle]
      const required = RECOVERY_HOURS[size][tier]
      const recovery = sigmoidRecovery(hoursElapsed, required)
      // Take the worst (lowest) recovery for each muscle
      breakdown[muscle] = Math.min(breakdown[muscle], recovery)
    }
  }

  const scores = Object.values(breakdown)
  const score = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 100

  return { score, breakdown }
}

function calculateCNSScore(
  workouts: RecoveryEngineInput['workouts'],
  now: Date
): number {
  if (!workouts.length) return 100

  let lowestCNS = 100
  for (const workout of workouts) {
    const hoursElapsed = differenceInHours(now, new Date(workout.created_at))
    const tier = cnsTier(workout.intensity_rpe, workout.workout_type)
    const required = CNS_RECOVERY_HOURS[tier]
    const recovery = sigmoidRecovery(hoursElapsed, required)
    lowestCNS = Math.min(lowestCNS, recovery)
  }

  return lowestCNS
}

function calculateSleepScore(
  sleepLogs: RecoveryEngineInput['sleepLogs'],
  targetHours: number
): number {
  if (!sleepLogs.length) return 70

  const last3 = sleepLogs.slice(-3)
  const avgHours = last3.reduce((s, l) => s + l.total_hours, 0) / last3.length
  const totalTarget = targetHours * last3.length
  const totalActual = last3.reduce((s, l) => s + l.total_hours, 0)
  const debtHours = Math.max(0, totalTarget - totalActual)

  const baseScore = Math.min(100, (avgHours / targetHours) * 100)
  const debtPenalty = debtHours * 6

  return Math.max(0, Math.round(baseScore - debtPenalty))
}

function calculateStressScore(
  stressLogs: RecoveryEngineInput['stressLogs']
): number {
  if (!stressLogs.length) return 80

  const recent = stressLogs.slice(-3)
  const avg = recent.reduce((s, l) => s + l.stress_level, 0) / recent.length
  // stress 1-5 → score 100-60
  return Math.round(100 - ((avg - 1) / 4) * 40)
}

function detectOvertraining(
  workouts: RecoveryEngineInput['workouts'],
  muscularScore: number,
  cnsScore: number
): boolean {
  if (workouts.length < 5) return false
  const last7Days = workouts.filter(w => {
    const hoursAgo = differenceInHours(new Date(), new Date(w.created_at))
    return hoursAgo <= 168
  })
  return last7Days.length >= 6 && (muscularScore < 45 || cnsScore < 40)
}

function detectDeloadNeed(
  workouts: RecoveryEngineInput['workouts'],
  overallScore: number
): boolean {
  if (workouts.length < 4) return false
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 28)
  const last4Weeks = workouts.filter(w => new Date(w.created_at) > weekAgo)
  return last4Weeks.length >= 16 && overallScore < 65
}

function getRecommendation(score: number): Recommendation {
  if (score >= 85) return 'train'
  if (score >= 60) return 'moderate'
  if (score >= 40) return 'active_recovery'
  return 'rest'
}

function getProjectedRecovery(
  muscularScore: number,
  cnsScore: number
): Date | null {
  if (muscularScore >= 100 && cnsScore >= 100) return null
  const hoursNeeded = Math.max(
    muscularScore < 100 ? ((100 - muscularScore) / 100) * 48 : 0,
    cnsScore < 100 ? ((100 - cnsScore) / 100) * 72 : 0
  )
  const projected = new Date()
  projected.setHours(projected.getHours() + Math.round(hoursNeeded))
  return projected
}

// ============================================
// MAIN EXPORT
// ============================================

export function calculateRecovery(input: RecoveryEngineInput): RecoveryEngineOutput {
  const now = new Date()
  const { profile, workouts, sleepLogs, stressLogs } = input

  const { score: muscular_score, breakdown: muscle_breakdown } =
    calculateMuscularScore(workouts, now)

  const cns_score = calculateCNSScore(workouts, now)

  const sleep_score = calculateSleepScore(
    sleepLogs,
    profile.sleep_baseline_hours ?? 8
  )

  const stress_score = calculateStressScore(stressLogs)

  // Age modifier: recovery slows past 30
  const age = profile.age ?? 30
  const ageModifier = age > 40 ? 0.90 : age > 30 ? 0.95 : 1.0

  const overall_score = Math.round(
    (muscular_score * 0.35 + cns_score * 0.30 + sleep_score * 0.25 + stress_score * 0.10)
    * ageModifier
  )

  const overtraining_flag = detectOvertraining(workouts, muscular_score, cns_score)
  const deload_flag = detectDeloadNeed(workouts, overall_score)

  return {
    muscular_score,
    cns_score,
    sleep_score,
    stress_score,
    overall_score,
    recommendation: getRecommendation(overall_score),
    projected_full_recovery_at: getProjectedRecovery(muscular_score, cns_score),
    overtraining_flag,
    deload_flag,
    muscle_breakdown,
  }
}
