'use client'

import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function EditProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/')
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setProfileData(data.profile)
        const nameParts = (data.profile?.name || '').split(' ')
        setFirstName(nameParts[0] || '')
        setLastName(nameParts.slice(1).join(' ') || '')
        setBio(data.profile?.bio || '')
        setAvatarUrl(data.profile?.avatar_url || user?.imageUrl || '')
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      // Check if it's HEIC format
      const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                    file.name.toLowerCase().endsWith('.heif') || 
                    file.type === 'image/heic' || 
                    file.type === 'image/heif'
      
      // Automatically convert HEIC to JPEG
      if (isHeic) {
        try {
          const heic2any = (await import('heic2any')).default
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9
          }) as Blob
          
          const fileName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
          file = new File([convertedBlob], fileName, { type: 'image/jpeg' })
        } catch (conversionError) {
          console.error('HEIC conversion failed:', conversionError)
        }
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        setIsUploading(false)
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        setIsUploading(false)
        return
      }

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
          setAvatarUrl(data.profile.avatar_url)
          // Update Clerk user image as well
          if (user && file) {
            try {
              await user.setProfileImage({ file })
            } catch (clerkError) {
              console.log('Clerk profile update skipped:', clerkError)
            }
          }
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Failed to upload image:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    const fullName = `${firstName} ${lastName}`.trim()
    
    try {
      const response = await fetch('/api/user/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: fullName, bio }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Profile updated:', data.profile)
        router.push('/profile')
        router.refresh() // Force refresh to show updated data
      } else {
        const error = await response.json()
        console.error('Update failed:', error)
        alert(`Failed to update profile: ${error.details || error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (!isLoaded || !isSignedIn) {
    return null
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
        <div className="max-w-2xl mx-auto px-8 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/profile" className="text-gray-700 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h2 className="text-xl font-semibold">Edit profile</h2>
            <button 
              onClick={handleSave}
              className="bg-[#18A48C] hover:bg-[#158d75] text-white px-4 py-2 rounded-full font-medium text-sm transition-colors"
            >
              Save
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Photo */}
            <div>
              <label className="text-sm font-semibold text-gray-900 block mb-3">Photo</label>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="rounded-full object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#18A48C] to-[#79ED82] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">
                        {getInitials(`${firstName} ${lastName}`.trim() || 'U')}
                      </span>
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleImageClick}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors"
                >
                  Change
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-900 block mb-2">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#18A48C] focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-900 block mb-2">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#18A48C] focus:border-transparent"
                />
              </div>
            </div>

            {/* About */}
            <div>
              <label className="text-sm font-semibold text-gray-900 block mb-2">About</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell your story"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#18A48C] focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}