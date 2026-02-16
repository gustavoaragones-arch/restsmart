# RestSmart — Recovery Intelligence

Phase 1 foundational backend. Next.js 14 (App Router) + TypeScript + Supabase + Stripe + Vercel.

## Stack

- **Next.js 14** — App Router, React 18
- **TypeScript** — Strict mode
- **Supabase** — Auth, Postgres, RLS
- **Stripe** — Subscriptions (free, monthly, annual, lifetime)
- **Tailwind CSS** — Styling

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

STRIPE_PRICE_MONTHLY=price_xxx
STRIPE_PRICE_ANNUAL=price_xxx
STRIPE_PRICE_LIFETIME=price_xxx

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase

Create a Supabase project at [supabase.com](https://supabase.com), then run migrations:

```bash
supabase link --project-ref YOUR_REF
supabase db push
```

Or apply `supabase/migrations/*.sql` manually in the SQL Editor.

### 4. Stripe

- Create products/prices in Stripe Dashboard for monthly, annual, lifetime
- Set price IDs in `.env.local`
- Configure webhook: `POST /api/stripe/webhook` with events:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `checkout.session.completed`

### 5. Run

```bash
npm run dev
```

## Auth

- Email/password sign up & sign in
- Magic link sign in
- OAuth-ready (Google/Apple) — enable in Supabase Dashboard → Auth → Providers
- Profile, subscription, and preferences auto-created on sign up

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profile (avatar, name) |
| `workouts` | Workout sessions |
| `workout_exercises` | Exercise details per workout |
| `workout_muscle_groups` | Muscle groups targeted |
| `sleep_logs` | Sleep tracking |
| `stress_logs` | Stress/HRV data |
| `recovery_snapshots` | Daily readiness aggregates |
| `recovery_trends` | Time-series for ML |
| `deload_cycles` | Deload period tracking |
| `subscriptions` | Stripe sync |
| `user_preferences` | User settings |
| `wearable_raw_data` | Future wearable ingestion |

All tables have `deleted_at` (soft delete), RLS, and indexes on `user_id` / `created_at`.

## Premium Gating

Middleware enforces premium access on `/dashboard` and `/recovery`. Free users are redirected to `/upgrade`. Grace period: 7 days after payment failure.

## Phase 2 — Recovery Engine v1

Rule-based recovery intelligence in `/lib/recoveryEngine/`:

- **Muscle recovery** — Sigmoid decay, muscle group weighting, RPE, volume, sleep/stress modifiers
- **CNS recovery** — HIIT/max-lift aware, 48–120h half-life, HRV deviation
- **Sleep score** — Duration, quality, architecture
- **Stress modifier** — 0.7–1.1 based on stress level + HRV
- **Overtraining / deload** — Load index, consecutive hard days, recovery depletion

**Triggers:** Recalculates when workout logged (`POST /api/workouts`), sleep logged (`POST /api/sleep`), or dashboard opened (`GET /api/recovery/calculate?save=true`).
