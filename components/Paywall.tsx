'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface PaywallProps {
  isOpen: boolean
  onClose?: () => void
  onSelectPlan: (plan: 'free' | 'basic' | 'pro') => void
}

export default function Paywall({ isOpen, onClose, onSelectPlan }: PaywallProps) {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'basic' | 'pro'>('pro')

  const handleSelectPlan = (plan: 'free' | 'basic' | 'pro') => {
    setSelectedPlan(plan)
    onSelectPlan(plan)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Blurred Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-md z-40"
            onClick={onClose}
          />

          {/* Paywall Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="bg-white rounded-3xl max-w-5xl w-full p-8 md:p-12 relative">
              {/* Close button */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Header */}
              <div className="text-center mb-10">
                <h2 className="text-4xl font-bold text-gray-900 mb-3">Choose Your Plan</h2>
                <p className="text-gray-600">Continue creating amazing audio stories</p>
              </div>

              {/* Pricing Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Free Tier */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative bg-gray-50 rounded-3xl p-6 border-3 border-black"
                >
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-bold">$0</span>
                      <span className="text-gray-500">/month</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700">Free!</h3>
                  </div>

                  <ul className="space-y-3 mb-8">
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
                    className="w-full py-3 px-6 bg-white text-black font-semibold rounded-full border-3 border-black hover:bg-gray-50 transition-colors"
                  >
                    Try free →
                  </button>
                </motion.div>

                {/* Pro Tier - Popular */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative bg-gradient-to-br from-[#9FE5E5] to-[#79ED82] rounded-3xl p-6 border-3 border-black"
                  style={{ transform: 'scale(1.05)' }}
                >
                  {/* Popular Badge */}
                  <div className="absolute -top-3 right-6 bg-black text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Popular
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-bold">$9.99</span>
                      <span className="text-gray-700">/month</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Razberry Pro</h3>
                  </div>

                  <ul className="space-y-3 mb-8">
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
                  </ul>

                  <button
                    onClick={() => handleSelectPlan('pro')}
                    className="w-full py-3 px-6 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-colors"
                  >
                    Get started →
                  </button>
                </motion.div>

                {/* Basic Tier */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative bg-gray-50 rounded-3xl p-6 border-3 border-black"
                >
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-bold">$4.99</span>
                      <span className="text-gray-500">/month</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700">Razberry Basic</h3>
                  </div>

                  <ul className="space-y-3 mb-8">
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
                    className="w-full py-3 px-6 bg-white text-black font-semibold rounded-full border-3 border-black hover:bg-gray-50 transition-colors"
                  >
                    Get started →
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}