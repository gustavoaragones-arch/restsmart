import { createClient } from "@/lib/supabase/server";
import type { SubscriptionPlan, SubscriptionStatus } from "@/types/database.types";
import { GRACE_PERIOD_DAYS } from "@/lib/stripe/config";

const PREMIUM_PLANS: SubscriptionPlan[] = ["monthly", "annual", "lifetime"];

export async function getSubscription() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data;
}

export function isPremiumPlan(plan: SubscriptionPlan): boolean {
  return PREMIUM_PLANS.includes(plan);
}

export function hasActivePremium(
  plan: SubscriptionPlan,
  status: SubscriptionStatus,
  gracePeriodEndsAt: string | null
): boolean {
  if (!isPremiumPlan(plan)) return false;
  if (status === "active" || status === "trialing") return true;
  if (status === "past_due" && gracePeriodEndsAt) {
    return new Date(gracePeriodEndsAt) > new Date();
  }
  return false;
}

export async function requirePremium() {
  const sub = await getSubscription();
  if (!sub) return false;
  return hasActivePremium(
    sub.plan,
    sub.status,
    sub.grace_period_ends_at
  );
}
