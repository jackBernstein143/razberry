'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export function useUserSync() {
  const { isLoaded, isSignedIn, user } = useUser()
  
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Sync user profile with Supabase
      fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.profile) {
            console.log('User profile synced:', data.profile)
          }
        })
        .catch(error => {
          console.error('Failed to sync user profile:', error)
        })
    }
  }, [isLoaded, isSignedIn, user])
}