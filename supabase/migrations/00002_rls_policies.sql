-- RestSmart Phase 1: RLS Policies
-- All policies enforce auth.uid() = user_id

-- Enable RLS on all tables
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

-- =============================================================================
-- PROFILES
-- =============================================================================
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- INSERT is handled by trigger (SECURITY DEFINER bypasses RLS)

-- =============================================================================
-- WORKOUTS
-- =============================================================================
CREATE POLICY "Users can manage own workouts" ON workouts
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- WORKOUT EXERCISES
-- =============================================================================
CREATE POLICY "Users can manage own workout exercises" ON workout_exercises
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- WORKOUT MUSCLE GROUPS
-- =============================================================================
CREATE POLICY "Users can manage own workout muscle groups" ON workout_muscle_groups
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- SLEEP LOGS
-- =============================================================================
CREATE POLICY "Users can manage own sleep logs" ON sleep_logs
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- STRESS LOGS
-- =============================================================================
CREATE POLICY "Users can manage own stress logs" ON stress_logs
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- RECOVERY SNAPSHOTS
-- =============================================================================
CREATE POLICY "Users can manage own recovery snapshots" ON recovery_snapshots
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- RECOVERY TRENDS
-- =============================================================================
CREATE POLICY "Users can manage own recovery trends" ON recovery_trends
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- DELOAD CYCLES
-- =============================================================================
CREATE POLICY "Users can manage own deload cycles" ON deload_cycles
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- SUBSCRIPTIONS
-- =============================================================================
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT/UPDATE via webhook (service role bypasses RLS) - users cannot modify

-- =============================================================================
-- USER PREFERENCES
-- =============================================================================
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- WEARABLE RAW DATA
-- =============================================================================
CREATE POLICY "Users can manage own wearable data" ON wearable_raw_data
  FOR ALL USING (auth.uid() = user_id);
