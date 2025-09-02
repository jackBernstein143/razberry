import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

const CheckoutRequestSchema = z.object({
  plan: z.enum(['basic', 'pro']),
  billingPeriod: z.enum(['monthly', 'annual']),
})

// Temporary price IDs - you'll need to create these in Stripe Dashboard
const PRICE_IDS = {
  basic: {
    monthly: 'price_1QfXXXXXXXXXXXXX', // Replace with actual price ID
    annual: 'price_1QfYYYYYYYYYYYYY',   // Replace with actual price ID
  },
  pro: {
    monthly: 'price_1QfZZZZZZZZZZZZZ', // Replace with actual price ID
    annual: 'price_1QfAAAAAAAAAAAAA',   // Replace with actual price ID
  },
}

export async function POST(request: NextRequest) {
  try {
    // Get the current user from Clerk
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    const body = await request.json()
    const validation = CheckoutRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { plan, billingPeriod } = validation.data
    const priceId = PRICE_IDS[plan][billingPeriod]

    // Create or retrieve Stripe customer
    let customerId: string | undefined

    // Check if user already has a Stripe customer ID stored
    const existingCustomers = await stripe.customers.list({
      email: user.emailAddresses[0].emailAddress,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.emailAddresses[0].emailAddress,
        name: `${user.firstName} ${user.lastName}`.trim() || undefined,
        metadata: {
          clerkUserId: userId,
        },
      })
      customerId = customer.id
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
      },
      metadata: {
        userId,
        plan,
        billingPeriod,
      },
      subscription_data: {
        metadata: {
          userId,
          plan,
          billingPeriod,
        },
      },
    })

    return NextResponse.json({ 
      checkoutUrl: session.url,
      sessionId: session.id 
    })
  } catch (error) {
    console.error('Checkout session error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to create checkout session', message: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}