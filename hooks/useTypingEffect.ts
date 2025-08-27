import { useState, useEffect } from 'react'

export function useTypingEffect(text: string, speed: number = 30, enabled: boolean = true) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayedText(text)
      setIsTyping(false)
      return
    }

    setIsTyping(true)
    setDisplayedText('')
    
    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText((prev) => prev + text[currentIndex])
        currentIndex++
      } else {
        clearInterval(interval)
        setIsTyping(false)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed, enabled])

  return { displayedText, isTyping }
}