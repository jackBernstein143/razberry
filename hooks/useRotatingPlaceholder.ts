import { useState, useEffect, useRef } from 'react'

const placeholders = [
  "Tell me your wildest fantasy...",
  "No one will judge you here...",
  "My husband's brother has been texting me late at night...",
  "She said her boyfriend wanted to watch me...",
  "The three of us were the last ones in the hot tub...", 
  "My boss called me 'good girl' and something inside me melted...",
  "Both classmates showed up to my dorm room to 'study'...",
  "My therapist said we need to explore my daddy issues hands-on...",
  "My roommate's girlfriend kept finding excuses to be alone with me...",
  "The conference room door locked from the inside...",
  "Two drinks in, my straight friend kept touching my thigh...",
  "The TA said office hours could be at his apartment...",
  "The shy IT guy fixing my laptop had an absolutely massive bulge...",
  "My trainer's muscles weren't the only thing that was rock hard..."
]

export function useRotatingPlaceholder() {
  const [currentPlaceholder, setCurrentPlaceholder] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const charIndexRef = useRef(0)

  useEffect(() => {
    let timeout: NodeJS.Timeout
    const currentText = placeholders[placeholderIndex]

    const typeChar = () => {
      if (charIndexRef.current < currentText.length) {
        setCurrentPlaceholder(currentText.slice(0, charIndexRef.current + 1))
        charIndexRef.current++
        timeout = setTimeout(typeChar, 20) // Faster typing speed
      } else {
        // Finished typing, wait then start erasing
        timeout = setTimeout(() => {
          eraseChar()
        }, 1500) // Wait 1.5 seconds before erasing
      }
    }

    const eraseChar = () => {
      if (charIndexRef.current > 0) {
        setCurrentPlaceholder(currentText.slice(0, charIndexRef.current - 1))
        charIndexRef.current--
        timeout = setTimeout(eraseChar, 10) // Faster erasing speed
      } else {
        // Finished erasing, move to next placeholder
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length)
        charIndexRef.current = 0
      }
    }

    if (isTyping) {
      typeChar()
    }

    return () => clearTimeout(timeout)
  }, [placeholderIndex, isTyping])

  return currentPlaceholder
}