'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'

type AnimatedButtonProps = Omit<HTMLMotionProps<'button'>, 'ref'> & {
  variant?: 'primary' | 'secondary'
}

const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className = '', variant = 'primary', ...props }, ref) => {
    const baseStyles = `
      px-8 py-4 
      font-semibold text-lg
      rounded-2xl
      transition-all duration-300
      disabled:opacity-50 disabled:cursor-not-allowed
    `
    
    const variantStyles = {
      primary: `
        bg-gradient-to-r from-purple-500 to-pink-500
        text-white
        shadow-lg shadow-purple-500/25
        hover:shadow-xl hover:shadow-purple-500/35
      `,
      secondary: `
        bg-white/10 backdrop-blur-sm
        text-white
        border-2 border-white/20
        hover:bg-white/20
      `
    }

    return (
      <motion.button
        ref={ref}
        whileHover={{ 
          scale: 1.05,
          transition: { 
            type: "spring",
            stiffness: 400,
            damping: 10
          }
        }}
        whileTap={{ scale: 0.95 }}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </motion.button>
    )
  }
)

AnimatedButton.displayName = 'AnimatedButton'

export default AnimatedButton