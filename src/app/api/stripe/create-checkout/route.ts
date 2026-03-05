import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PLANS } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { planType } = await req.json()
  const plan = STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS]
  if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const session = await stripe.checkout.sessions.create({
    mode: planType === 'lifetime' ? 'payment' : 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    metadata: { user_id: user.id, plan_type: planType },
    customer_email: user.email ?? undefined,
  })

  return NextResponse.json({ url: session.url })
}
