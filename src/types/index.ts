export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'
export type PlanType = 'free' | 'monthly' | 'annual' | 'lifetime'
export type Recommendation = 'train' | 'moderate' | 'active_recovery' | 'rest'

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'

export type WorkoutType =
  | 'strength'
  | 'cardio'
  | 'hiit'
  | 'crossfit'
  | 'sports'
  | 'yoga_pilates'
  | 'swimming'
  | 'active_recovery'
  | 'other'

export interface Profile {
  id: string
  full_name: string | null
  age: number | null
  sex: 'male' | 'female' | 'other' | null
  weight_kg: number | null
  height_cm: number | null
  fitness_level: FitnessLevel | null
  training_frequency: string | null
  sleep_baseline_hours: number
  sleep_quality: string | null
  stress_level: string | null
  work_schedule: string | null
  onboarding_complete: boolean
  created_at: string
  deleted_at: string | null
}

export interface Workout {
  id: string
  user_id: string
  workout_type: WorkoutType
  duration_minutes: number | null
  intensity_rpe: number | null
  notes: string | null
  created_at: string
  deleted_at: string | null
}

export interface WorkoutMuscleGroup {
  id: string
  workout_id: string
  muscle_group: MuscleGroup
  load_score: number
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  name: string
  sets: number | null
  reps: number | null
  weight_kg: number | null
  duration_seconds: number | null
  order_index: number
}

export interface SleepLog {
  id: string
  user_id: string
  total_hours: number
  deep_sleep_minutes: number | null
  rem_minutes: number | null
  resting_hr: number | null
  hrv: number | null
  sleep_quality_score: number | null
  source: 'manual' | 'apple_health' | 'oura' | 'garmin'
  created_at: string
  deleted_at: string | null
}

export interface StressLog {
  id: string
  user_id: string
  stress_level: number
  notes: string | null
  created_at: string
}

export interface RecoverySnapshot {
  id: string
  user_id: string
  muscular_score: number
  cns_score: number
  sleep_score: number
  stress_score: number
  overall_score: number
  recommendation: Recommendation
  projected_full_recovery_at: string | null
  overtraining_flag: boolean
  deload_flag: boolean
  calculated_at: string
}

export interface RecoveryTrend {
  id: string
  user_id: string
  week_start: string
  avg_overall_score: number
  avg_sleep_hours: number
  total_workouts: number
  sleep_debt_hours: number
  overtraining_days: number
  created_at: string
}

export interface DeloadCycle {
  id: string
  user_id: string
  started_at: string
  ended_at: string | null
  trigger_reason: string
  volume_reduction_percent: number
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'inactive'
  plan_type: PlanType
  current_period_end: string | null
  created_at: string
}

export interface UserPreferences {
  user_id: string
  recovery_aggressiveness: 'conservative' | 'balanced' | 'aggressive'
  training_goal: string | null
  notify_daily_score: boolean
  notify_daily_score_time: string
  notify_sleep_reminder: boolean
  notify_sleep_reminder_time: string
  notify_deload_alerts: boolean
  notify_weekly_insights: boolean
  updated_at: string
}

export interface WearableRawData {
  id: string
  user_id: string
  source: string
  metric_type: string
  value: number
  unit: string
  recorded_at: string
  created_at: string
}

export interface RecoveryEngineInput {
  workouts: Array<Workout & { muscle_groups: WorkoutMuscleGroup[] }>
  sleepLogs: SleepLog[]
  stressLogs: StressLog[]
  profile: Pick<Profile, 'age' | 'fitness_level' | 'sleep_baseline_hours'>
}

export interface RecoveryEngineOutput {
  muscular_score: number
  cns_score: number
  sleep_score: number
  stress_score: number
  overall_score: number
  recommendation: Recommendation
  projected_full_recovery_at: Date | null
  overtraining_flag: boolean
  deload_flag: boolean
  muscle_breakdown: Record<MuscleGroup, number>
}
