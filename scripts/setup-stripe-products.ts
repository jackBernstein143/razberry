import Stripe from 'stripe'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
})

async function setupProducts() {
  try {
    console.log('Setting up Stripe products and prices...\n')

    // Check if products already exist
    const existingProducts = await stripe.products.list({ limit: 100 })
    
    const basicProduct = existingProducts.data.find(p => p.metadata.plan === 'basic')
    const proProduct = existingProducts.data.find(p => p.metadata.plan === 'pro')

    let basicProductId: string
    let proProductId: string

    // Create or get Basic product
    if (!basicProduct) {
      const newBasicProduct = await stripe.products.create({
        name: 'Razberry Basic',
        description: '20 minutes of audio generation per month',
        metadata: {
          plan: 'basic',
        },
      })
      basicProductId = newBasicProduct.id
      console.log('✅ Created Basic product:', basicProductId)
    } else {
      basicProductId = basicProduct.id
      console.log('ℹ️  Basic product already exists:', basicProductId)
    }

    // Create or get Pro product
    if (!proProduct) {
      const newProProduct = await stripe.products.create({
        name: 'Razberry Pro',
        description: '60 minutes of audio generation per month',
        metadata: {
          plan: 'pro',
        },
      })
      proProductId = newProProduct.id
      console.log('✅ Created Pro product:', proProductId)
    } else {
      proProductId = proProduct.id
      console.log('ℹ️  Pro product already exists:', proProductId)
    }

    // Create prices for Basic plan
    const basicMonthlyPrice = await stripe.prices.create({
      product: basicProductId,
      unit_amount: 499, // $4.99
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        plan: 'basic',
        period: 'monthly',
      },
    })
    console.log('✅ Created Basic Monthly price:', basicMonthlyPrice.id)

    const basicAnnualPrice = await stripe.prices.create({
      product: basicProductId,
      unit_amount: 4990, // $49.90 (10 months = 2 months free)
      currency: 'usd',
      recurring: {
        interval: 'year',
      },
      metadata: {
        plan: 'basic',
        period: 'annual',
      },
    })
    console.log('✅ Created Basic Annual price:', basicAnnualPrice.id)

    // Create prices for Pro plan
    const proMonthlyPrice = await stripe.prices.create({
      product: proProductId,
      unit_amount: 999, // $9.99
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        plan: 'pro',
        period: 'monthly',
      },
    })
    console.log('✅ Created Pro Monthly price:', proMonthlyPrice.id)

    const proAnnualPrice = await stripe.prices.create({
      product: proProductId,
      unit_amount: 9990, // $99.90 (10 months = 2 months free)
      currency: 'usd',
      recurring: {
        interval: 'year',
      },
      metadata: {
        plan: 'pro',
        period: 'annual',
      },
    })
    console.log('✅ Created Pro Annual price:', proAnnualPrice.id)

    console.log('\n📝 Update your checkout endpoint with these price IDs:')
    console.log(`
const PRICE_IDS = {
  basic: {
    monthly: '${basicMonthlyPrice.id}',
    annual: '${basicAnnualPrice.id}',
  },
  pro: {
    monthly: '${proMonthlyPrice.id}',
    annual: '${proAnnualPrice.id}',
  },
}
    `)

    console.log('\n✅ Stripe products and prices setup complete!')
    console.log('\n⚠️  Next steps:')
    console.log('1. Update the price IDs in /app/api/stripe/checkout/route.ts')
    console.log('2. Configure your webhook endpoint in the Stripe Dashboard')
    console.log('3. Update STRIPE_WEBHOOK_SECRET in .env.local with the webhook secret')
    console.log('4. Run the Supabase migration to add subscription fields')

  } catch (error) {
    console.error('Error setting up products:', error)
    process.exit(1)
  }
}

setupProducts()