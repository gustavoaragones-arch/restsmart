/**
 * Stripe plan configuration
 * Create these products/prices in Stripe Dashboard
 */
export const STRIPE_PLANS = {
  free: {
    priceId: null,
    name: "Free",
  },
  monthly: {
    priceId: process.env.STRIPE_PRICE_MONTHLY ?? "price_monthly",
    name: "Monthly",
  },
  annual: {
    priceId: process.env.STRIPE_PRICE_ANNUAL ?? "price_annual",
    name: "Annual",
  },
  lifetime: {
    priceId: process.env.STRIPE_PRICE_LIFETIME ?? "price_lifetime",
    name: "Lifetime",
  },
} as const;

export const GRACE_PERIOD_DAYS = 7;
