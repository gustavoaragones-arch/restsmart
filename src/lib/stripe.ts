import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

export const STRIPE_PLANS = {
  monthly: { priceId: process.env.STRIPE_MONTHLY_PRICE_ID!, amount: 8.99 },
  annual: { priceId: process.env.STRIPE_ANNUAL_PRICE_ID!, amount: 79.00 },
  lifetime: { priceId: process.env.STRIPE_LIFETIME_PRICE_ID!, amount: 199.00 },
} as const

export function isPremium(planType: string, status: string): boolean {
  if (planType === 'lifetime') return true
  return planType !== 'free' && status === 'active'
}
