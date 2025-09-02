'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface UserProfile {
  subscription_plan?: string
  subscription_status?: string
  audio_minutes_used?: number
  audio_minutes_limit?: number
}

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)

  // Fetch user profile data
  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })
      
      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        throw new Error('Failed to create portal session')
      }
    } catch (error) {
      console.error('Error creating portal session:', error)
      alert('Failed to open subscription management. Please try again.')
    } finally {
      setIsLoadingPortal(false)
    }
  }

  const handleUpgrade = () => {
    // Navigate to pricing with upgrade intent
    router.push('/pricing?upgrade=true')
  }

  const getSubscriptionDisplay = () => {
    if (!profile) return { label: 'Free', color: 'text-gray-600' }
    
    switch (profile.subscription_plan) {
      case 'pro':
        return { label: 'Pro', color: 'text-purple-600' }
      case 'basic':
        return { label: 'Basic', color: 'text-blue-600' }
      default:
        return { label: 'Free', color: 'text-gray-600' }
    }
  }

  const subscription = getSubscriptionDisplay()
  const hasActiveSubscription = profile?.subscription_plan && profile.subscription_plan !== 'free'

  return (
    <div className="relative" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {user?.firstName || user?.username || 'User'}
          </span>
          <span className={`text-xs font-medium ${subscription.color} bg-gray-50 px-2 py-0.5 rounded-full`}>
            {subscription.label}
          </span>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9FE5E5] to-[#79ED82] flex items-center justify-center">
          <span className="text-sm font-bold text-gray-800">
            {user?.firstName?.[0] || user?.username?.[0] || 'U'}
          </span>
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
          >
            {/* User Info */}
            <div className="p-4 border-b border-gray-100">
              <div className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</div>
              <div className="text-sm text-gray-500">{user?.primaryEmailAddress?.emailAddress}</div>
            </div>

            {/* Subscription Info */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Plan</span>
                <span className={`text-sm font-medium ${subscription.color}`}>
                  {subscription.label}
                </span>
              </div>
              
              {profile?.audio_minutes_limit && profile.audio_minutes_limit > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Audio minutes</span>
                    <span className="text-gray-900">
                      {profile.audio_minutes_used || 0}/{profile.audio_minutes_limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-[#9FE5E5] to-[#79ED82] h-1.5 rounded-full"
                      style={{ 
                        width: `${Math.min(100, ((profile.audio_minutes_used || 0) / profile.audio_minutes_limit) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <Link 
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                View Profile
              </Link>
              
              <Link 
                href="/profile/edit"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Edit Profile
              </Link>

              {hasActiveSubscription ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={isLoadingPortal}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoadingPortal ? 'Loading...' : 'Manage Subscription'}
                </button>
              ) : (
                <button
                  onClick={handleUpgrade}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-[#18A48C] hover:bg-[#18A48C]/5 rounded-lg transition-colors"
                >
                  Upgrade to Pro
                </button>
              )}

              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={() => signOut()}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}