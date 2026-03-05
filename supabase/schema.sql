-- ============================================
-- RESTSMART PRODUCTION SCHEMA v1.0
-- Run this entire block in the Supabase SQL Editor. Run it once. Do not split.
-- ============================================

-- PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  age INT CHECK (age BETWEEN 13 AND 100),
  sex TEXT CHECK (sex IN ('male', 'female', 'other')),
  weight_kg NUMERIC(5,1),
  height_cm NUMERIC(5,1),
  fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced', 'elite')),
  training_frequency TEXT,
  sleep_baseline_hours NUMERIC(3,1) DEFAULT 8.0,
  sleep_quality TEXT CHECK (sleep_quality IN ('poor', 'fair', 'good', 'excellent')),
  stress_level TEXT CHECK (stress_level IN ('low', 'moderate', 'high', 'very_high')),
  work_schedule TEXT,
  onboarding_complete BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- WORKOUTS
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  workout_type TEXT NOT NULL CHECK (workout_type IN (
    'strength', 'cardio', 'hiit', 'crossfit',
    'sports', 'yoga_pilates', 'swimming', 'active_recovery', 'other'
  )),
  duration_minutes INT CHECK (duration_minutes BETWEEN 1 AND 600),
  intensity_rpe INT CHECK (intensity_rpe BETWEEN 1 AND 10),
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_created_at ON workouts(created_at);
CREATE INDEX idx_workouts_user_created ON workouts(user_id, created_at DESC);

-- WORKOUT EXERCISES
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sets INT,
  reps INT,
  weight_kg NUMERIC(6,2),
  duration_seconds INT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_exercises_workout_id ON workout_exercises(workout_id);

-- WORKOUT MUSCLE GROUPS
CREATE TABLE workout_muscle_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  muscle_group TEXT NOT NULL CHECK (muscle_group IN (
    'chest', 'back', 'shoulders', 'arms',
    'quads', 'hamstrings', 'glutes', 'calves', 'core'
  )),
  load_score NUMERIC(4,1) DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_muscle_groups_workout_id ON workout_muscle_groups(workout_id);

-- SLEEP LOGS
CREATE TABLE sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  total_hours NUMERIC(3,1) NOT NULL CHECK (total_hours BETWEEN 0 AND 24),
  deep_sleep_minutes INT,
  rem_minutes INT,
  resting_hr NUMERIC(4,1),
  hrv NUMERIC(5,1),
  sleep_quality_score INT CHECK (sleep_quality_score BETWEEN 1 AND 10),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'apple_health', 'oura', 'garmin')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sleep_logs_user_id ON sleep_logs(user_id);
CREATE INDEX idx_sleep_logs_user_created ON sleep_logs(user_id, created_at DESC);

-- STRESS LOGS
CREATE TABLE stress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stress_level INT NOT NULL CHECK (stress_level BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stress_logs_user_created ON stress_logs(user_id, created_at DESC);

-- RECOVERY SNAPSHOTS
CREATE TABLE recovery_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  muscular_score NUMERIC(5,1) NOT NULL,
  cns_score NUMERIC(5,1) NOT NULL,
  sleep_score NUMERIC(5,1) NOT NULL,
  stress_score NUMERIC(5,1) NOT NULL,
  overall_score NUMERIC(5,1) NOT NULL,
  recommendation TEXT NOT NULL CHECK (recommendation IN ('train', 'moderate', 'active_recovery', 'rest')),
  projected_full_recovery_at TIMESTAMPTZ,
  overtraining_flag BOOLEAN DEFAULT false,
  deload_flag BOOLEAN DEFAULT false,
  muscle_breakdown JSONB,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recovery_snapshots_user_id ON recovery_snapshots(user_id);
CREATE INDEX idx_recovery_snapshots_user_calculated ON recovery_snapshots(user_id, calculated_at DESC);

-- RECOVERY TRENDS (weekly aggregates)
CREATE TABLE recovery_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  avg_overall_score NUMERIC(5,1),
  avg_sleep_hours NUMERIC(4,1),
  total_workouts INT DEFAULT 0,
  sleep_debt_hours NUMERIC(4,1) DEFAULT 0,
  overtraining_days INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_recovery_trends_user_week ON recovery_trends(user_id, week_start DESC);

-- DELOAD CYCLES
CREATE TABLE deload_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  trigger_reason TEXT,
  volume_reduction_percent INT DEFAULT 40,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deload_cycles_user_id ON deload_cycles(user_id);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT DEFAULT 'inactive' CHECK (status IN (
    'active', 'canceled', 'past_due', 'trialing', 'inactive'
  )),
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'monthly', 'annual', 'lifetime')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- USER PREFERENCES
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  recovery_aggressiveness TEXT DEFAULT 'balanced' CHECK (
    recovery_aggressiveness IN ('conservative', 'balanced', 'aggressive')
  ),
  training_goal TEXT,
  notify_daily_score BOOLEAN DEFAULT true,
  notify_daily_score_time TIME DEFAULT '09:00',
  notify_sleep_reminder BOOLEAN DEFAULT true,
  notify_sleep_reminder_time TIME DEFAULT '21:45',
  notify_deload_alerts BOOLEAN DEFAULT true,
  notify_weekly_insights BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WEARABLE RAW DATA (future-proofing)
CREATE TABLE wearable_raw_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wearable_user_source ON wearable_raw_data(user_id, source);
CREATE INDEX idx_wearable_recorded_at ON wearable_raw_data(user_id, recorded_at DESC);

-- ARTICLES (education content)
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  reading_time_min INT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  topic TEXT,
  is_premium BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_topic ON articles(topic);

-- ARTICLE READS
CREATE TABLE article_reads (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, article_id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE deload_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_raw_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_reads ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users manage own workouts" ON workouts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own exercises" ON workout_exercises FOR ALL
  USING (auth.uid() = (SELECT user_id FROM workouts WHERE id = workout_id));
CREATE POLICY "Users manage own muscle groups" ON workout_muscle_groups FOR ALL
  USING (auth.uid() = (SELECT user_id FROM workouts WHERE id = workout_id));
CREATE POLICY "Users manage own sleep logs" ON sleep_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own stress logs" ON stress_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own recovery snapshots" ON recovery_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own recovery trends" ON recovery_trends FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own deload cycles" ON deload_cycles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own subscription" ON subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own wearable data" ON wearable_raw_data FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Articles are public" ON articles FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Users manage own article reads" ON article_reads FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  INSERT INTO subscriptions (user_id, status, plan_type)
  VALUES (NEW.id, 'inactive', 'free');
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
