'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'

type AnimatedInputProps = Omit<HTMLMotionProps<'input'>, 'ref'> & {
  label?: string
}

const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div className="relative w-full">
        {label && (
          <label 
            htmlFor={props.id} 
            className="sr-only"
          >
            {label}
          </label>
        )}
        <motion.input
          ref={ref}
          whileFocus={{ 
            scale: 1.02,
            transition: { 
              type: "spring",
              stiffness: 300,
              damping: 20
            }
          }}
          initial={{ scale: 1 }}
          className={`
            w-full px-6 py-4 
            text-lg font-medium
            bg-white/5 backdrop-blur-sm
            border-2 border-white/10
            rounded-2xl
            text-white placeholder:text-white/40
            focus:outline-none focus:border-white/30
            focus:shadow-[0_0_30px_rgba(255,255,255,0.1)]
            transition-all duration-300
            ${className}
          `}
          {...props}
        />
      </div>
    )
  }
)

AnimatedInput.displayName = 'AnimatedInput'

export default AnimatedInput