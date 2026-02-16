import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { STRIPE_PLANS, GRACE_PERIOD_DAYS } from "@/lib/stripe/config";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Missing webhook secret or signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Webhook signature verification failed: ${message}`, {
      status: 400,
    });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscription(supabase, sub);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(supabase, sub);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailed(supabase, invoice);
      break;
    }
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription && session.customer) {
        const sub = await getStripe().subscriptions.retrieve(
          session.subscription as string
        );
        await syncSubscription(supabase, sub);
      }
      break;
    }
    default:
      // Unhandled event type
      break;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}

function priceIdToPlan(priceId: string | null): "free" | "monthly" | "annual" | "lifetime" {
  if (!priceId) return "free";
  if (priceId === STRIPE_PLANS.monthly.priceId) return "monthly";
  if (priceId === STRIPE_PLANS.annual.priceId) return "annual";
  if (priceId === STRIPE_PLANS.lifetime.priceId) return "lifetime";
  return "free";
}

async function syncSubscription(
  supabase: ReturnType<typeof createAdminClient>,
  sub: Stripe.Subscription
) {
  const priceId =
    typeof sub.items.data[0]?.price?.id === "string"
      ? sub.items.data[0].price.id
      : null;
  const plan = priceIdToPlan(priceId);

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, user_id")
    .eq("stripe_subscription_id", sub.id)
    .single();

  if (existing) {
    await supabase
      .from("subscriptions")
      .update({
        plan,
        stripe_price_id: priceId,
        status: mapStripeStatus(sub.status),
        current_period_start: sub.current_period_start
          ? new Date(sub.current_period_start * 1000).toISOString()
          : null,
        current_period_end: sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: sub.cancel_at_period_end,
        grace_period_ends_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const metadata = sub.metadata as { user_id?: string } | null;
    let userId = metadata?.user_id;

    if (!userId) {
      const { data: byCustomer } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();
      userId = byCustomer?.user_id ?? undefined;
    }

    if (userId) {
      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          stripe_price_id: priceId,
          plan,
          status: mapStripeStatus(sub.status),
          current_period_start: sub.current_period_start
            ? new Date(sub.current_period_start * 1000).toISOString()
            : null,
          current_period_end: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null,
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }
  }
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createAdminClient>,
  sub: Stripe.Subscription
) {
  await supabase
    .from("subscriptions")
    .update({
      plan: "free",
      status: "canceled",
      stripe_subscription_id: null,
      stripe_price_id: null,
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", sub.id);
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  const subId = invoice.subscription;
  if (typeof subId !== "string") return;

  const graceEnds = new Date();
  graceEnds.setDate(graceEnds.getDate() + GRACE_PERIOD_DAYS);

  await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
      grace_period_ends_at: graceEnds.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subId);
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
): "active" | "canceled" | "past_due" | "trialing" | "unpaid" {
  const map: Record<string, "active" | "canceled" | "past_due" | "trialing" | "unpaid"> = {
    active: "active",
    canceled: "canceled",
    past_due: "past_due",
    trialing: "trialing",
    unpaid: "unpaid",
  };
  return map[status] ?? "active";
}
