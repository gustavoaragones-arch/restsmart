-- Phase 7 — Deload & periodization (active cycle = end_date IS NULL)

-- Allow open-ended deload cycles
ALTER TABLE deload_cycles
  ALTER COLUMN end_date DROP NOT NULL;

-- Index for active/recent lookup
CREATE INDEX IF NOT EXISTS deload_user_date_idx
  ON deload_cycles(user_id, start_date DESC);
