import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
})

export const PRICE_IDS = {
  basic: {
    monthly: 'price_basic_monthly', // You'll need to create these in Stripe Dashboard
    annual: 'price_basic_annual',
  },
  pro: {
    monthly: 'price_pro_monthly',
    annual: 'price_pro_annual',
  },
} as const

export type PlanType = 'basic' | 'pro'
export type BillingPeriod = 'monthly' | 'annual'

export interface CreateCheckoutSessionParams {
  userId: string
  email: string
  plan: PlanType
  billingPeriod: BillingPeriod
  successUrl: string
  cancelUrl: string
}