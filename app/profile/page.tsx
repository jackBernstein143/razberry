'use client'

import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import StoryCard from '@/components/StoryCard'

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [isHovering, setIsHovering] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [stories, setStories] = useState<any[]>([])
  const [isLoadingStories, setIsLoadingStories] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/')
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchStories()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setProfileData(data.profile)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }

  const fetchStories = async () => {
    setIsLoadingStories(true)
    try {
      const response = await fetch('/api/story/list')
      if (response.ok) {
        const data = await response.json()
        setStories(data.stories || [])
      }
    } catch (error) {
      console.error('Failed to fetch stories:', error)
    } finally {
      setIsLoadingStories(false)
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }

    setIsUploading(true)

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string

        const response = await fetch('/api/user/profile/avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ avatar: base64 }),
        })

        if (response.ok) {
          const data = await response.json()
          setProfileData(data.profile)
          // Update Clerk user image as well
          if (user) {
            await user.setProfileImage({ file })
          }
        } else {
          alert('Failed to update profile picture')
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to update profile picture')
    } finally {
      setIsUploading(false)
    }
  }

  if (!isLoaded || !isSignedIn) {
    return null
  }

  const displayName = profileData?.name || user?.fullName || user?.firstName || user?.username || 'User'
  const avatarUrl = profileData?.avatar_url || user?.imageUrl

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
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
          <Link href="/profile" className="group flex items-center space-x-2 text-gray-900 font-medium">
            <span>Profile</span>
            <sup className="text-xs text-[#18A48C]">01</sup>
          </Link>
          <a href="#" className="group flex items-center space-x-2 text-gray-700 hover:text-gray-900">
            <span>Trending</span>
            <sup className="text-xs text-gray-400 transition-colors group-hover:text-[#FF6F3C]">01</sup>
          </a>
          <a href="#" className="group flex items-center space-x-2 text-gray-700 hover:text-gray-900">
            <span>Categories</span>
            <sup className="text-xs text-gray-400 transition-colors group-hover:text-[#FF5E7D]">02</sup>
          </a>
        </nav>
        
        <div className="w-full h-px bg-gray-200"></div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="flex flex-col items-center">
          {/* Profile Picture with Edit Overlay */}
          <div 
            className="relative w-32 h-32 cursor-pointer"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={handleImageClick}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={128}
                height={128}
                className="rounded-full object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#18A48C] to-[#79ED82] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-4xl">{getInitials(displayName)}</span>
              </div>
            )}
            
            {/* Hover Overlay */}
            <div 
              className={`absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center transition-opacity ${
                isHovering || isUploading ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {isUploading ? (
                <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Name */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{displayName}</h1>
          
          {/* Bio */}
          {profileData?.bio && (
            <p className="text-gray-700 text-sm font-medium max-w-md text-center mb-6">{profileData.bio}</p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mb-12">
            <Link 
              href="/profile/edit"
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-semibold transition-colors inline-block"
            >
              Edit profile
            </Link>
          </div>
        </div>

        {/* Section Title */}
        <div className="flex justify-center mt-12 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">Created Stories</h2>
        </div>

        {/* Stories Content */}
        <div className="space-y-8">
          <AnimatePresence>
            {isLoadingStories ? (
              <div className="flex justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : stories.length > 0 ? (
              stories.map((story, index) => {
                const colors = ['#18A48C', '#79ED82', '#9FE5E5', '#FF6F3C', '#FF5E7D']
                const color = colors[index % colors.length]
                
                return (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <StoryCard
                      title={story.title}
                      description={story.description}
                      content={story.content}
                      audioUrl={story.audio_url}
                      color={color}
                    />
                    <div className="flex items-center gap-3 mt-4">
                      <span className="text-sm text-gray-500">
                        {new Date(story.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No stories created yet</p>
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors font-medium"
                >
                  Create your first story
                </Link>
              </div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </main>
    </div>
  )
}