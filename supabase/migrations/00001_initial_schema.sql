-- RestSmart Phase 1: Production-Ready Schema
-- Data-first design for longitudinal recovery intelligence

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PROFILES
-- =============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- =============================================================================
-- WORKOUTS
-- =============================================================================
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  workout_date DATE NOT NULL,
  duration_minutes INTEGER,
  perceived_exertion INTEGER CHECK (perceived_exertion >= 1 AND perceived_exertion <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_created_at ON workouts(created_at);
CREATE INDEX idx_workouts_user_date ON workouts(user_id, workout_date);

-- =============================================================================
-- WORKOUT EXERCISES
-- =============================================================================
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets INTEGER,
  reps_per_set JSONB,
  weight_kg DECIMAL(10,2),
  duration_seconds INTEGER,
  rest_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_user_id ON workout_exercises(user_id);
CREATE INDEX idx_workout_exercises_created_at ON workout_exercises(created_at);

-- =============================================================================
-- WORKOUT MUSCLE GROUPS
-- =============================================================================
CREATE TABLE workout_muscle_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muscle_group TEXT NOT NULL,
  intensity TEXT CHECK (intensity IN ('primary', 'secondary', 'tertiary')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_workout_muscle_groups_workout_id ON workout_muscle_groups(workout_id);
CREATE INDEX idx_workout_muscle_groups_user_id ON workout_muscle_groups(user_id);
CREATE INDEX idx_workout_muscle_groups_created_at ON workout_muscle_groups(created_at);

-- =============================================================================
-- SLEEP LOGS
-- =============================================================================
CREATE TABLE sleep_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_date DATE NOT NULL,
  bed_time TIMESTAMPTZ,
  wake_time TIMESTAMPTZ,
  total_minutes INTEGER,
  quality INTEGER CHECK (quality >= 1 AND quality <= 10),
  deep_sleep_minutes INTEGER,
  rem_minutes INTEGER,
  light_sleep_minutes INTEGER,
  awakenings INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_sleep_logs_user_id ON sleep_logs(user_id);
CREATE INDEX idx_sleep_logs_created_at ON sleep_logs(created_at);
CREATE INDEX idx_sleep_logs_user_date ON sleep_logs(user_id, sleep_date);

-- =============================================================================
-- STRESS LOGS
-- =============================================================================
CREATE TABLE stress_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  hrv_ms INTEGER,
  resting_hr INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_stress_logs_user_id ON stress_logs(user_id);
CREATE INDEX idx_stress_logs_created_at ON stress_logs(created_at);
CREATE INDEX idx_stress_logs_user_date ON stress_logs(user_id, log_date);

-- =============================================================================
-- RECOVERY SNAPSHOTS (daily aggregates)
-- =============================================================================
CREATE TABLE recovery_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  readiness_score DECIMAL(5,2),
  sleep_score DECIMAL(5,2),
  stress_score DECIMAL(5,2),
  fatigue_score DECIMAL(5,2),
  soreness_score DECIMAL(5,2),
  workload_score DECIMAL(5,2),
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_recovery_snapshots_user_date ON recovery_snapshots(user_id, snapshot_date);
CREATE INDEX idx_recovery_snapshots_user_id ON recovery_snapshots(user_id);
CREATE INDEX idx_recovery_snapshots_created_at ON recovery_snapshots(created_at);

-- =============================================================================
-- RECOVERY TRENDS (time-series for ML)
-- =============================================================================
CREATE TABLE recovery_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trend_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  value DECIMAL(10,4),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_recovery_trends_user_id ON recovery_trends(user_id);
CREATE INDEX idx_recovery_trends_created_at ON recovery_trends(created_at);
CREATE INDEX idx_recovery_trends_user_type ON recovery_trends(user_id, trend_type);

-- =============================================================================
-- DELOAD CYCLES
-- =============================================================================
CREATE TABLE deload_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  volume_reduction_pct INTEGER,
  intensity_reduction_pct INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_deload_cycles_user_id ON deload_cycles(user_id);
CREATE INDEX idx_deload_cycles_created_at ON deload_cycles(created_at);
CREATE INDEX idx_deload_cycles_user_dates ON deload_cycles(user_id, start_date, end_date);

-- =============================================================================
-- SUBSCRIPTIONS (Stripe sync)
-- =============================================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'monthly', 'annual', 'lifetime')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  grace_period_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_created_at ON subscriptions(created_at);

-- =============================================================================
-- USER PREFERENCES
-- =============================================================================
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_created_at ON user_preferences(created_at);

-- =============================================================================
-- WEARABLE RAW DATA (future-proofing)
-- =============================================================================
CREATE TABLE wearable_raw_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  data_type TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_wearable_raw_data_user_id ON wearable_raw_data(user_id);
CREATE INDEX idx_wearable_raw_data_created_at ON wearable_raw_data(created_at);
CREATE INDEX idx_wearable_raw_data_recorded_at ON wearable_raw_data(recorded_at);
CREATE INDEX idx_wearable_raw_data_user_source ON wearable_raw_data(user_id, source);
