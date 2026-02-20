-- Phase 2A — Recovery snapshots alignment (run in Supabase SQL Editor)

ALTER TABLE recovery_snapshots
  ADD COLUMN IF NOT EXISTS muscle_breakdown JSONB,
  ADD COLUMN IF NOT EXISTS overtraining_flag BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deload_flag BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sleep_debt NUMERIC;

CREATE INDEX IF NOT EXISTS recovery_user_date_idx
  ON recovery_snapshots (user_id, calculated_at DESC);
