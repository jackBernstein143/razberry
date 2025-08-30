'use client'

import { useUser } from '@clerk/nextjs'
import Image from 'next/image'

export default function UserProfile() {
  const { isLoaded, isSignedIn, user } = useUser()

  if (!isLoaded) {
    return <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
  }

  if (!isSignedIn || !user) {
    return null
  }

  // Get user's name from various sources
  const displayName = user.fullName || user.firstName || user.username || 'User'
  
  // Get initials for fallback avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const initials = getInitials(displayName)

  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-700 font-medium">{displayName}</span>
      <div className="relative w-10 h-10">
        {user.imageUrl ? (
          <Image
            src={user.imageUrl}
            alt={displayName}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#18A48C] to-[#79ED82] rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">{initials}</span>
          </div>
        )}
      </div>
    </div>
  )
}