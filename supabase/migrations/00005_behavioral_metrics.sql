-- Phase 5 — Behavioral metrics (habit layer)

create table if not exists behavioral_metrics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  date date not null,
  recovery_compliant boolean default false,
  sleep_target_met boolean default false,
  balanced_training boolean default false,
  created_at timestamptz default now()
);

create unique index if not exists behavioral_metrics_user_date_key
  on behavioral_metrics(user_id, date);

create index if not exists behavioral_user_date_idx
  on behavioral_metrics(user_id, date desc);
