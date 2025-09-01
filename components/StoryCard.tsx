'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface StoryCardProps {
  title: string
  description?: string | null
  content: string
  audioUrl?: string | null
  color?: string
  showActions?: boolean
  onDownload?: () => void
  onSave?: () => void
  isSaving?: boolean
  saveSuccess?: boolean
  isGeneratingAudio?: boolean
}

export default function StoryCard({
  title,
  description,
  content,
  audioUrl,
  color = '#79ED82',
  showActions = false,
  onDownload,
  onSave,
  isSaving = false,
  saveSuccess = false,
  isGeneratingAudio = false
}: StoryCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    return () => {
      if (audioUrl) {
        // Don't revoke blob URLs that are from Supabase
        if (audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl)
        }
      }
    }
  }, [audioUrl])

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
    <div className="flex gap-6 items-stretch">
      {/* Audio Player Card */}
      <div 
        className="rounded-3xl p-8 flex-1 flex flex-col justify-between"
        style={{ backgroundColor: color }}
      >
        {/* Story Title and Description */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {title || 'Untitled Story'}
          </h2>
          {description && (
            <p className="text-sm text-gray-700 mt-1">
              {description}
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
        <p>{content}</p>
      </div>
    </div>
  )
}