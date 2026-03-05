# RestSmart — Recovery Intelligence

Biological scheduling: when is your body ready to perform?

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Supabase, Stripe, Vercel.

## Setup

1. **Install dependencies** (already done if you ran the build)
   ```bash
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env.local`
   - Fill in Supabase and Stripe values (see **Blockers** below)

3. **Database**
   - Create a project at [supabase.com](https://supabase.com)
   - In SQL Editor, run the contents of `supabase/schema.sql` once

4. **Run**
   ```bash
   npm run dev
   ```

## Verification

- [ ] `npm run dev` starts without TypeScript errors
- [ ] Supabase SQL ran without errors
- [ ] All 14 tables exist in Supabase Table Editor
- [ ] Auth trigger `on_auth_user_created` exists (Database → Functions)
- [ ] RLS enabled on all tables
- [ ] `/` redirects to `/login` when unauthenticated
- [ ] Recovery engine: `import { calculateRecovery } from '@/lib/recoveryEngine'`

## Blockers for you

1. Create a Supabase project → copy Project URL and anon key into `.env.local`
2. Run `supabase/schema.sql` in Supabase SQL Editor
3. Create a Stripe account → create 3 products (Monthly $8.99, Annual $79, Lifetime $199) → add price IDs to `.env.local` as `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_ANNUAL_PRICE_ID`, `STRIPE_LIFETIME_PRICE_ID`

Never commit `.env.local`.
