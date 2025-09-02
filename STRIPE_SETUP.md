# Stripe Integration Setup Guide

## Overview
This guide walks you through setting up Stripe for the Razberry subscription service.

## Prerequisites
- Stripe account (test mode for development)
- Clerk authentication configured
- Supabase database set up

## Setup Steps

### 1. Configure Environment Variables
Add these to your `.env.local` file:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (already set)
STRIPE_SECRET_KEY=sk_test_... (already set)
STRIPE_WEBHOOK_SECRET=whsec_... (needs to be updated)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Run Database Migration
Apply the Supabase migration to add subscription fields:
```sql
-- Run this in your Supabase SQL editor
-- File: lib/supabase/migrations/003_add_subscription_fields.sql
```

### 3. Create Stripe Products and Prices
Run the setup script to create products and prices:
```bash
npm run setup:stripe
```

This will create:
- Razberry Basic ($4.99/month or $49.90/year)
- Razberry Pro ($9.99/month or $99.90/year)

The script will output price IDs that need to be added to the checkout endpoint.

### 4. Update Price IDs
After running the setup script, update the price IDs in:
`/app/api/stripe/checkout/route.ts`

Replace the placeholder price IDs with the actual ones from the script output.

### 5. Configure Webhook Endpoint

#### Local Development (using Stripe CLI):
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
4. Copy the webhook signing secret and update `STRIPE_WEBHOOK_SECRET` in `.env.local`

#### Production:
1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the signing secret and add to production environment variables

### 6. Configure Customer Portal (Optional)
1. Go to Stripe Dashboard > Settings > Billing > Customer portal
2. Enable the portal
3. Configure settings:
   - Allow customers to update payment methods
   - Allow customers to cancel subscriptions
   - Set cancellation policy

## Testing the Integration

### Test Cards
Use these test card numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

### Test Flow
1. Create a test account or use existing one
2. Click "Sign up" to open pricing modal
3. Select a plan (Basic or Pro)
4. Complete Stripe Checkout with test card
5. Verify subscription status in:
   - Stripe Dashboard
   - Supabase profiles table
   - User profile page

## API Endpoints

### `/api/stripe/checkout`
Creates a Stripe Checkout session for subscription signup.

**Request:**
```json
{
  "plan": "basic" | "pro",
  "billingPeriod": "monthly" | "annual"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

### `/api/stripe/webhook`
Handles Stripe webhook events for subscription lifecycle.

Events handled:
- `checkout.session.completed` - New subscription created
- `customer.subscription.updated` - Subscription modified
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Payment successful
- `invoice.payment_failed` - Payment failed

### `/api/stripe/portal`
Creates a Stripe Customer Portal session for subscription management.

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

## Subscription Plans

### Free Tier
- Unlimited listening
- Save stories
- No audio generation

### Basic ($4.99/mo or $49.90/yr)
- 20 minutes of audio generation/month
- Multiple voice options
- Save stories

### Pro ($9.99/mo or $99.90/yr)
- 60 minutes of audio generation/month
- Priority generation
- Early access to features

## Troubleshooting

### Webhook Issues
- Ensure webhook secret is correctly set
- Check webhook logs in Stripe Dashboard
- Verify endpoint URL is accessible

### Checkout Issues
- Verify price IDs are correct
- Check customer email is valid
- Ensure user is authenticated

### Database Issues
- Run migration if subscription fields are missing
- Check Supabase connection
- Verify RLS policies allow updates

## Production Checklist
- [ ] Update all environment variables
- [ ] Create production products/prices in Stripe
- [ ] Configure production webhook endpoint
- [ ] Enable Stripe customer portal
- [ ] Test full payment flow
- [ ] Set up monitoring/alerts
- [ ] Configure tax settings if needed
- [ ] Review and adjust subscription terms