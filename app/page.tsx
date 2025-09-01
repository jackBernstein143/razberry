'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs'
import type { StoryPrompt, TTSResponse, ErrorResponse } from '@/types'
import { useTypingEffect } from '@/hooks/useTypingEffect'
import { useRotatingPlaceholder } from '@/hooks/useRotatingPlaceholder'
import { useUserSync } from '@/hooks/useUserSync'
import { useRouter } from 'next/navigation'

// Color palette
const colors = {
  teal: '#18A48C',     // Pantone 2418U
  lightGreen: '#79ED82', // Pantone 902U (we already have this)
  lightBlue: '#9FE5E5', // Pantone 332U
  orange: '#FF6F3C',    // Pantone 1655XGC
  pink: '#FF5E7D'       // Pantone 1785C
}

const colorArray = [colors.teal, colors.lightGreen, colors.lightBlue, colors.orange, colors.pink]

export default function Home() {
  const [storyTitle, setStoryTitle] = useState<string>('')
  const [storyDescription, setStoryDescription] = useState<string>('')
  const [storyText, setStoryText] = useState<string>('')
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string>('')
  const [promptText, setPromptText] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [cardColor, setCardColor] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [audioBase64, setAudioBase64] = useState('')
  const [hasGeneratedFreeStory, setHasGeneratedFreeStory] = useState(false)
  const [wantsToContinue, setWantsToContinue] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<'male' | 'female'>('male')
  const [showPaywall, setShowPaywall] = useState(false)
  const [isFirstStory, setIsFirstStory] = useState(true)
  const [testMode, setTestMode] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const { user } = useUser()
  const router = useRouter()
  
  // Sync user profile with Supabase
  useUserSync()

  // Check if user has already used their free generation and test mode
  useEffect(() => {
    const freeStoryUsed = localStorage.getItem('freeStoryUsed')
    const isTestMode = localStorage.getItem('testMode') === 'true'
    if (freeStoryUsed === 'true') {
      setHasGeneratedFreeStory(true)
    }
    setTestMode(isTestMode)
  }, [])
  
  // Use typing effect when loading
  const { displayedText, isTyping } = useTypingEffect(storyText, 20, isLoading && !isGeneratingAudio)
  
  // Use rotating placeholder for input
  const placeholder = useRotatingPlaceholder()

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!promptText.trim()) return

    // Check if user has already used their free story and isn't logged in
    if (hasGeneratedFreeStory && !user) {
      router.push('/pricing')
      return
    }

    setIsLoading(true)
    setIsGeneratingAudio(true)
    setError('')
    setStoryTitle('Generating...')
    setStoryDescription('')
    setStoryText('')
    setAudioUrl('')
    setIsPlaying(false)
    
    // Set random color for the card
    const randomColor = colorArray[Math.floor(Math.random() * colorArray.length)]
    setCardColor(randomColor)

    try {
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: promptText,
          voiceGender: selectedVoice,
          isSample: !user && isFirstStory
        }),
      })

      const data: TTSResponse | ErrorResponse = await response.json()

      if (!response.ok) {
        const errorData = data as ErrorResponse
        throw new Error(errorData.error || 'Failed to generate story')
      }

      const storyData = data as TTSResponse
      setStoryTitle(storyData.storyTitle)
      setStoryDescription(storyData.storyDescription)
      setStoryText(storyData.storyText)
      setOriginalPrompt(promptText)
      setSaveSuccess(false)
      setIsLoading(false) // Story is loaded, stop typing effect

      if (storyData.audio) {
        console.log('Received audio from API, base64 length:', storyData.audio.base64?.length || 0)
        setAudioBase64(storyData.audio.base64)
        const audioBlob = new Blob(
          [Uint8Array.from(atob(storyData.audio.base64), c => c.charCodeAt(0))],
          { type: storyData.audio.mime }
        )
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        setIsGeneratingAudio(false) // Audio is ready
      } else {
        console.log('No audio data in story response')
      }
      
      setPromptText('')
      
      // Mark that user has used their free generation
      if (!user && isFirstStory) {
        setIsFirstStory(false)
        setHasGeneratedFreeStory(true)
        // Show continue button for sample stories
        setWantsToContinue(true)
      }
    } catch (err) {
      console.error('Error generating story:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setIsLoading(false)
      setIsGeneratingAudio(false)
    }
  }

  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleSaveStory = async () => {
    if (!user || !storyText || isSaving || saveSuccess) return

    console.log('Saving story with audio base64 length:', audioBase64?.length || 0)
    
    setIsSaving(true)
    try {
      const response = await fetch('/api/story/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: storyTitle,
          description: storyDescription,
          content: storyText,
          audioBase64: audioBase64,
          prompt: originalPrompt
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save story')
      }

      setSaveSuccess(true)
    } catch (error) {
      console.error('Error saving story:', error)
      setError('Failed to save story. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleContinue = () => {
    if (testMode) {
      // In test mode, just clear the continue state and allow generation
      setWantsToContinue(false)
      localStorage.setItem('freeStoryUsed', 'false')
      setHasGeneratedFreeStory(false)
      setIsFirstStory(false)
    } else {
      setWantsToContinue(false)
      setShowPaywall(true)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return
    const bounds = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - bounds.left
    const width = bounds.width
    const percentage = x / width
    const newTime = percentage * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-8 pb-0">
          <div className="flex items-center space-x-3 mb-8">
            <Image 
              src="/razberry-logo.png" 
              alt="Razberry logo" 
              width={24} 
              height={24}
              className="object-contain"
            />
            <span className="text-lg font-medium">Razberry.fun</span>
          </div>
        </div>
        
        <div className="w-full h-px bg-gray-200"></div>
        
        <nav className="p-8 space-y-4">
          <Link href="/pricing" className="group flex items-center space-x-2 text-gray-700 hover:text-gray-900">
            <span>Pricing</span>
            <sup className="text-xs text-gray-400 transition-colors group-hover:text-[#79ED82]">✨</sup>
          </Link>
          <Link href="/profile" className="group flex items-center space-x-2 text-gray-700 hover:text-gray-900">
            <span>Profile</span>
            <sup className="text-xs text-gray-400 transition-colors group-hover:text-[#18A48C]">01</sup>
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
      <main className="flex-1 flex flex-col">
        {/* Header with Login/Signup */}
        <header className="flex justify-between items-center px-12 py-6">
          {/* Pricing link */}
          <Link
            href="/pricing"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Pricing
          </Link>
          
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-gray-700 hover:text-gray-900 font-medium">
                  Login
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="relative group">
                  <span className="absolute inset-0 bg-black rounded-full" />
                  <span className="relative block bg-[#79ED82] text-black px-6 py-2.5 rounded-full font-medium border-3 border-black transition-transform group-hover:-translate-y-1 group-hover:translate-x-1">
                    Sign up
                  </span>
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                    userButtonPopoverCard: "shadow-lg",
                  }
                }}
                showName={true}
              />
            </SignedIn>
          </div>
        </header>

        {/* Top Section with Title and Input */}
        <div className="p-12 pt-16 pb-0">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Title */}
            <motion.h1 
              className="text-7xl font-bold text-center text-gray-900"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ fontFamily: 'var(--font-caprasimo)', lineHeight: '1' }}
            >
              <span style={{ display: 'inline-block' }}>Razberry</span>
              <motion.span 
                style={{ 
                  display: 'inline-block', 
                  verticalAlign: 'bottom',
                  margin: '0 8px',
                  transform: 'translateY(-10px)'
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                <Image 
                  src="/flower.png" 
                  alt="flower" 
                  width={45} 
                  height={45}
                  style={{ display: 'block' }}
                />
              </motion.span>
              <span style={{ display: 'inline-block' }}>fun</span>
            </motion.h1>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="relative mb-12">
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder={placeholder}
                className="w-full px-8 py-5 pr-16 pl-32 text-lg border-3 border-gray-900 rounded-[2rem] focus:outline-none focus:border-gray-700 transition-colors bg-white placeholder:text-gray-400 resize-none min-h-[120px]"
                disabled={isLoading}
                rows={3}
              />
              
              {/* Voice Selector Dropdown */}
              <div className="absolute left-5 bottom-5">
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value as 'male' | 'female')}
                  className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500"
                  disabled={isLoading}
                >
                  <option value="male">🗣️ Male</option>
                  <option value="female">🗣️ Female</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isLoading || !promptText.trim()}
                className="absolute right-5 bottom-5 w-11 h-11 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderRadius: '14px' }}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Full width divider */}
        <div className="w-full h-px bg-gray-200"></div>

        {/* Bottom Section with Results */}
        <div className="p-12 flex-1">
          <div className="max-w-4xl mx-auto space-y-12">

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Story and Audio Card */}
          <AnimatePresence>
            {(isLoading || storyText || audioUrl) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex gap-6 items-stretch"
              >
                {/* Audio Player Card */}
                <div 
                  className="rounded-3xl p-8 flex-1 flex flex-col justify-between"
                  style={{ backgroundColor: cardColor || '#79ED82' }}
                >
                  {/* Story Title and Description */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {storyTitle || 'Untitled Story'}
                    </h2>
                    {storyDescription && (
                      <p className="text-sm text-gray-700 mt-1">
                        {storyDescription}
                      </p>
                    )}
                  </div>

                  {/* Audio Player */}
                  <div className="flex items-center space-x-4 mt-6">
                    <button
                      onClick={togglePlayPause}
                      disabled={!audioUrl || isGeneratingAudio}
                      className="w-14 h-14 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors flex-shrink-0 disabled:cursor-not-allowed"
                    >
                      {isGeneratingAudio ? (
                        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : isPlaying ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1">
                      <div 
                        className="h-2 bg-gray-200 rounded-full cursor-pointer relative"
                        onClick={handleProgressClick}
                      >
                        <div 
                          className="h-full bg-gray-900 rounded-full"
                          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <span className="text-gray-900 text-sm min-w-[45px]">
                      {formatTime(duration)}
                    </span>

                    {audioUrl && (
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onLoadedMetadata={() => {
                          if (audioRef.current) {
                            setDuration(audioRef.current.duration)
                          }
                        }}
                        onTimeUpdate={() => {
                          if (audioRef.current) {
                            setCurrentTime(audioRef.current.currentTime)
                          }
                        }}
                        onEnded={() => setIsPlaying(false)}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                    )}
                  </div>
                </div>

                {/* Story Text Container */}
                <div className="flex-1 overflow-y-auto pr-4 text-gray-600 text-sm leading-relaxed story-scroll" style={{ maxHeight: '160px' }}>
                  <p>
                    {isLoading && !storyText ? (
                      <span className="text-gray-400">Generating your story...</span>
                    ) : isTyping ? displayedText : storyText}
                    {isTyping && <span className="inline-block w-2 h-4 bg-gray-600 animate-pulse ml-1" />}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons - Below the card */}
          <AnimatePresence>
            {storyText && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center gap-3 mt-4"
              >
                {/* Continue Button for sample stories */}
                {wantsToContinue && !user && (
                  <button
                    onClick={handleContinue}
                    className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium"
                  >
                    Continue Story →
                  </button>
                )}
                
                {/* Save Button */}
                <SignedIn>
                  <button
                    onClick={handleSaveStory}
                    disabled={isSaving || saveSuccess || !storyText}
                    className="px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving...
                      </span>
                    ) : saveSuccess ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Saved
                      </span>
                    ) : (
                      'Save'
                    )}
                  </button>
                </SignedIn>
                <SignedOut>
                  {!wantsToContinue && (
                    <div className="px-6 py-3 bg-gray-200 text-gray-500 rounded-full font-medium cursor-not-allowed">
                      Sign in to save
                    </div>
                  )}
                </SignedOut>
              </motion.div>
            )}
          </AnimatePresence>

          </div>
        </div>
      </main>

      {/* Paywall Modal */}
      <AnimatePresence>
        {showPaywall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-md z-50 flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full text-center border-3 border-black"
            >
              <h2 className="text-3xl font-bold mb-4">Ready for More?</h2>
              <p className="text-gray-600 mb-6">
                Unlock unlimited steamy stories with full-length audio narration.
              </p>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-left">
                  <span className="text-2xl">✨</span>
                  <span>Unlimited story generation</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <span className="text-2xl">🎭</span>
                  <span>Multiple voice options</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <span className="text-2xl">🔥</span>
                  <span>Full-length explicit content</span>
                </div>
              </div>
              <button
                onClick={() => router.push('/pricing')}
                className="w-full px-6 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-colors mb-3"
              >
                View Pricing
              </button>
              <button
                onClick={() => setShowPaywall(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Maybe later
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test Mode Toggle (Development Only) */}
      {!user && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={testMode}
              onChange={(e) => {
                const newTestMode = e.target.checked
                setTestMode(newTestMode)
                localStorage.setItem('testMode', newTestMode ? 'true' : 'false')
                if (!newTestMode) {
                  // Reset state when turning off test mode
                  localStorage.removeItem('freeStoryUsed')
                  setHasGeneratedFreeStory(false)
                  setIsFirstStory(true)
                }
              }}
              className="w-4 h-4"
            />
            Test Mode
          </label>
        </div>
      )}

    </div>
  )
}