'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess?: () => void
}

export default function PricingModal({ isOpen, onClose, onAuthSuccess }: PricingModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual')
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'basic' | 'pro' | null>(null)
  const { user, isLoaded } = useUser()
  const router = useRouter()

  // Price calculations
  const prices = {
    basic: {
      monthly: 4.99,
      annual: 4.99 * 10, // 2 months free
      annualMonthly: (4.99 * 10) / 12
    },
    pro: {
      monthly: 9.99,
      annual: 9.99 * 10, // 2 months free
      annualMonthly: (9.99 * 10) / 12
    }
  }

  // Watch for user authentication and pending plan
  useEffect(() => {
    if (user && isLoaded) {
      // Check if there's a pending plan from before auth
      const pendingPlan = localStorage.getItem('pendingPlan') as 'free' | 'basic' | 'pro' | null
      const pendingBilling = localStorage.getItem('pendingBillingPeriod') as 'monthly' | 'annual' | null
      
      if (pendingPlan && pendingBilling) {
        // User just authenticated with a pending plan
        setBillingPeriod(pendingBilling)
        // Small delay to ensure auth is fully processed
        setTimeout(() => {
          handlePayment(pendingPlan)
        }, 100)
      }
    }
  }, [user, isLoaded])

  const handleSelectPlan = async (plan: 'free' | 'basic' | 'pro') => {
    setSelectedPlan(plan)
    
    // Store plan details for recovery after auth
    localStorage.setItem('pendingPlan', plan)
    localStorage.setItem('pendingBillingPeriod', billingPeriod)
    
    if (!user) {
      // Will trigger Clerk modal
      return
    } else {
      // Already authenticated, go straight to payment
      handlePayment(plan)
    }
  }

  const handlePayment = async (plan: 'free' | 'basic' | 'pro') => {
    if (plan === 'free') {
      // Free plan - just close modal and let user continue
      localStorage.removeItem('pendingPlan')
      localStorage.removeItem('pendingBillingPeriod')
      if (onAuthSuccess) {
        onAuthSuccess()
      }
      onClose()
      return
    }
    
    try {
      // Create Stripe checkout session
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
        const error = await response.json()
        throw new Error(error.message || 'Failed to create checkout session')
      }

      const { checkoutUrl } = await response.json()

      // Clean up stored plan data
      localStorage.removeItem('pendingPlan')
      localStorage.removeItem('pendingBillingPeriod')
      
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Payment error:', error)
      alert('Failed to start checkout process. Please try again.')
    }
  }

  const formatPrice = (price: number) => {
    return price.toFixed(2)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 backdrop-blur-md z-50 flex items-center justify-center px-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl p-8 max-w-5xl w-full my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Unlock Full Stories</h2>
            <p className="text-lg text-gray-600 mb-6">Continue your steamy adventures with unlimited generation</p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-5 py-2 rounded-full font-medium transition-all text-sm ${
                  billingPeriod === 'monthly' 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-5 py-2 rounded-full font-medium transition-all text-sm ${
                  billingPeriod === 'annual' 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Save 17%</span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Free Tier */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative bg-white rounded-2xl p-6 border-2 border-gray-300 flex flex-col"
            >
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Free</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">$0</span>
                  <span className="text-gray-500">/forever</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6 flex-grow">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Unlimited listening</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Save stories</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-500 line-through">Audio generation</span>
                </li>
              </ul>

              {user ? (
                <button
                  onClick={() => handleSelectPlan('free')}
                  className="w-full py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-full border-2 border-gray-300 hover:bg-gray-200 transition-colors"
                >
                  Continue Free
                </button>
              ) : (
                <SignUpButton mode="modal">
                  <button
                    onClick={() => {
                      localStorage.setItem('pendingPlan', 'free')
                      localStorage.setItem('pendingBillingPeriod', billingPeriod)
                    }}
                    className="w-full py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-full border-2 border-gray-300 hover:bg-gray-200 transition-colors"
                  >
                    Sign Up Free
                  </button>
                </SignUpButton>
              )}
            </motion.div>

            {/* Basic Tier */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 flex flex-col"
            >
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Razberry Basic</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    ${billingPeriod === 'monthly' ? formatPrice(prices.basic.monthly) : formatPrice(prices.basic.annualMonthly)}
                  </span>
                  <span className="text-gray-500">/month</span>
                </div>
                {billingPeriod === 'annual' && (
                  <p className="text-sm text-gray-600 mt-1">
                    ${formatPrice(prices.basic.annual)} billed annually
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6 flex-grow">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">20 mins of audio/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Multiple voice options</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Save your stories</span>
                </li>
              </ul>

              {user ? (
                <button
                  onClick={() => handleSelectPlan('basic')}
                  className="w-full py-3 px-6 bg-white text-black font-semibold rounded-full border-2 border-black hover:bg-gray-50 transition-colors"
                >
                  Select Basic
                </button>
              ) : (
                <SignUpButton mode="modal">
                  <button
                    onClick={() => {
                      localStorage.setItem('pendingPlan', 'basic')
                      localStorage.setItem('pendingBillingPeriod', billingPeriod)
                    }}
                    className="w-full py-3 px-6 bg-white text-black font-semibold rounded-full border-2 border-black hover:bg-gray-50 transition-colors"
                  >
                    Select Basic
                  </button>
                </SignUpButton>
              )}
            </motion.div>

            {/* Pro Tier - Popular */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative bg-gradient-to-br from-[#9FE5E5] to-[#79ED82] rounded-2xl p-6 border-2 border-black flex flex-col"
            >
              {/* Popular Badge */}
              <div className="absolute -top-3 right-6 bg-black text-white px-3 py-1 rounded-full text-xs font-semibold">
                Most Popular
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Razberry Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    ${billingPeriod === 'monthly' ? formatPrice(prices.pro.monthly) : formatPrice(prices.pro.annualMonthly)}
                  </span>
                  <span className="text-gray-700">/month</span>
                </div>
                {billingPeriod === 'annual' && (
                  <p className="text-sm text-gray-700 mt-1">
                    ${formatPrice(prices.pro.annual)} billed annually
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6 flex-grow">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-gray-800 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-800 font-medium">60 mins of audio/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-gray-800 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-800 font-medium">Priority generation</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-gray-800 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-800 font-medium">Early access to features</span>
                </li>
              </ul>

              {user ? (
                <button
                  onClick={() => handleSelectPlan('pro')}
                  className="w-full py-3 px-6 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-colors"
                >
                  Select Pro
                </button>
              ) : (
                <SignUpButton mode="modal">
                  <button
                    onClick={() => {
                      localStorage.setItem('pendingPlan', 'pro')
                      localStorage.setItem('pendingBillingPeriod', billingPeriod)
                    }}
                    className="w-full py-3 px-6 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-colors"
                  >
                    Select Pro
                  </button>
                </SignUpButton>
              )}
            </motion.div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>Cancel anytime • Secure payment via Stripe</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}