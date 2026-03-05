import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin()
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      if (!userId) break

      const subscription = session.subscription
        ? await stripe.subscriptions.retrieve(session.subscription as string)
        : null

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription?.id ?? null,
        status: subscription?.status ?? 'active',
        plan_type: session.metadata?.plan_type ?? 'monthly',
        current_period_end: subscription
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
      })
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      await supabase
        .from('subscriptions')
        .update({
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled', plan_type: 'free' })
        .eq('stripe_subscription_id', sub.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
