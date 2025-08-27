'use client'

import { FormEvent, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AnimatedInput from '@/components/ui/AnimatedInput'
import AnimatedButton from '@/components/ui/AnimatedButton'
import type { PromptFormProps, StoryPrompt } from '@/types'

export default function PromptForm({ 
  onSubmit, 
  placeholder = 'Describe your story idea...', 
  maxLength = 500 
}: PromptFormProps) {
  const [promptText, setPromptText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!promptText.trim()) {
      return
    }

    setIsSubmitting(true)
    
    const prompt: StoryPrompt = {
      text: promptText.trim(),
      timestamp: Date.now()
    }
    
    console.log('Submitting prompt:', prompt)
    
    await onSubmit(prompt)
    
    setPromptText('')
    setIsSubmitting(false)
  }

  return (
    <motion.form 
      onSubmit={handleSubmit}
      className="w-full max-w-4xl mx-auto space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5,
        ease: "easeOut"
      }}
    >
      <AnimatedInput
        id="story-prompt"
        type="text"
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        label="Story Prompt"
        aria-label="Story Prompt"
        aria-describedby="prompt-description"
        autoComplete="off"
      />
      
      <div id="prompt-description" className="sr-only">
        Enter a description for your story. Maximum {maxLength} characters.
      </div>

      <div className="flex justify-center">
        <AnimatedButton
          type="submit"
          disabled={!promptText.trim() || isSubmitting}
          aria-label="Submit"
        >
          <AnimatePresence mode="wait">
            {isSubmitting ? (
              <motion.span
                key="submitting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Submitting...
              </motion.span>
            ) : (
              <motion.span
                key="submit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Submit Story
              </motion.span>
            )}
          </AnimatePresence>
        </AnimatedButton>
      </div>

      {promptText.length > 0 && (
        <motion.div 
          className="text-center text-sm text-white/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {promptText.length} / {maxLength} characters
        </motion.div>
      )}
    </motion.form>
  )
}