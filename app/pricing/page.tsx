'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { SignInButton, useUser } from '@clerk/nextjs'

function PricingContent() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual')
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isUpgrade = searchParams.get('upgrade') === 'true'

  // Price calculations
  const prices = {
    basic: {
      monthly: 4.99,
      annual: 4.99 * 10, // 2 months free
      annualMonthly: (4.99 * 10) / 12 // Show as monthly cost
    },
    pro: {
      monthly: 9.99,
      annual: 9.99 * 10, // 2 months free
      annualMonthly: (9.99 * 10) / 12 // Show as monthly cost
    }
  }

  const handleSelectPlan = async (plan: 'free' | 'basic' | 'pro') => {
    if (plan === 'free') {
      // Free plan - just redirect home
      router.push('/')
    } else {
      // Paid plans - create Stripe checkout
      if (!user) {
        // Store plan for after auth
        localStorage.setItem('pendingPlan', plan)
        localStorage.setItem('pendingBillingPeriod', billingPeriod)
        // Will be handled by SignInButton
        return
      }
      
      setIsLoading(true)
      try {
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan,
            billingPeriod,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to create checkout session')
        }

        const { checkoutUrl } = await response.json()
        window.location.href = checkoutUrl
      } catch (error) {
        console.error('Checkout error:', error)
        alert('Failed to start checkout. Please try again.')
        setIsLoading(false)
      }
    }
  }

  const formatPrice = (price: number) => {
    return price.toFixed(2)
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-8 pb-0">
          <div className="flex items-center space-x-3 mb-8">
            <Link href="/" className="flex items-center space-x-3">
              <Image 
                src="/razberry-logo.png" 
                alt="Razberry logo" 
                width={24} 
                height={24}
                className="object-contain"
              />
              <span className="text-lg font-medium">Razberry.fun</span>
            </Link>
          </div>
        </div>
        
        <div className="w-full h-px bg-gray-200"></div>
        
        <nav className="p-8 space-y-4">
          <Link href="/" className="group flex items-center space-x-2 text-gray-700 hover:text-gray-900">
            <span>Home</span>
          </Link>
          <Link href="/pricing" className="group flex items-center space-x-2 text-gray-900 font-medium">
            <span>Pricing</span>
            <sup className="text-xs text-[#79ED82]">✓</sup>
          </Link>
          <Link href="/profile" className="group flex items-center space-x-2 text-gray-700 hover:text-gray-900">
            <span>Profile</span>
          </Link>
        </nav>
        
        <div className="w-full h-px bg-gray-200"></div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="max-w-5xl w-full">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
            <p className="text-xl text-gray-600 mb-8">Create amazing audio stories with Razberry</p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  billingPeriod === 'monthly' 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  billingPeriod === 'annual' 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Tier */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative bg-gray-50 rounded-3xl p-8 border-3 border-black flex flex-col h-full"
            >
              <div className="mb-6">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-700">Free!</h3>
                <div className="h-5"></div> {/* Spacer to match other cards */}
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Unlimited listening</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">1 audio generation</span>
                </li>
              </ul>

              <button
                onClick={() => handleSelectPlan('free')}
                className="w-full py-3 px-6 bg-white text-black font-semibold rounded-full border-3 border-black hover:bg-gray-50 transition-colors mt-auto"
              >
                {user ? 'Continue with Free' : 'Sign up free'} →
              </button>
            </motion.div>

            {/* Pro Tier - Popular */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative bg-gradient-to-br from-[#9FE5E5] to-[#79ED82] rounded-3xl p-8 border-3 border-black flex flex-col h-full"
              style={{ transform: 'scale(1.05)' }}
            >
              {/* Popular Badge */}
              <div className="absolute -top-3 right-6 bg-black text-white px-4 py-1 rounded-full text-sm font-semibold">
                Popular
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">
                    ${billingPeriod === 'monthly' ? formatPrice(prices.pro.monthly) : formatPrice(prices.pro.annualMonthly)}
                  </span>
                  <span className="text-gray-700">/month</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Razberry Pro</h3>
                <div className="h-5">
                  {billingPeriod === 'annual' && (
                    <p className="text-sm text-gray-700">
                      ${formatPrice(prices.pro.annual)} billed annually
                    </p>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-800 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-800 font-medium">60 mins of audio generation</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-800 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-800 font-medium">Unlimited listening</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-800 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-800 font-medium">Priority support</span>
                </li>
              </ul>

              <button
                onClick={() => handleSelectPlan('pro')}
                className="w-full py-3 px-6 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-colors mt-auto"
              >
                Get started →
              </button>
            </motion.div>

            {/* Basic Tier */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative bg-gray-50 rounded-3xl p-8 border-3 border-black flex flex-col h-full"
            >
              <div className="mb-6">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">
                    ${billingPeriod === 'monthly' ? formatPrice(prices.basic.monthly) : formatPrice(prices.basic.annualMonthly)}
                  </span>
                  <span className="text-gray-500">/month</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-700">Razberry Basic</h3>
                <div className="h-5">
                  {billingPeriod === 'annual' && (
                    <p className="text-sm text-gray-600">
                      ${formatPrice(prices.basic.annual)} billed annually
                    </p>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">20 mins of audio generation</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Unlimited listening</span>
                </li>
              </ul>

              <button
                onClick={() => handleSelectPlan('basic')}
                className="w-full py-3 px-6 bg-white text-black font-semibold rounded-full border-3 border-black hover:bg-gray-50 transition-colors mt-auto"
              >
                Get started →
              </button>
            </motion.div>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-12 text-gray-600">
            <p className="mb-2">All plans include unlimited listening to generated stories</p>
            <p className="text-sm">Cancel anytime • Secure payment via Stripe</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <PricingContent />
    </Suspense>
  )
}