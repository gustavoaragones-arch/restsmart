import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { STRIPE_PLANS } from "@/lib/stripe/config";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan: planKey } = await req.json();
  const validPlans = ["monthly", "annual", "lifetime"];
  if (!validPlans.includes(planKey)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  const priceId = STRIPE_PLANS[planKey as keyof typeof STRIPE_PLANS]?.priceId;
  if (!priceId) {
    return NextResponse.json({ error: "Plan not configured" }, { status: 400 });
  }

  const adminSupabase = (await import("@/lib/supabase/admin")).createAdminClient();
  const { data: sub } = await adminSupabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  let customerId = sub?.stripe_customer_id;

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await adminSupabase
      .from("subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", user.id);
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?checkout=canceled`,
    subscription_data: { metadata: { user_id: user.id } },
  });

  return NextResponse.json({ url: session.url });
}
