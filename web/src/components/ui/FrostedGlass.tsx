import React, { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

interface FrostedGlassProps extends PropsWithChildren {
  className?: string
  variant?: 'default' | 'dark' | 'light'
}

export function FrostedGlass({ 
  children, 
  className, 
  variant = 'default' 
}: FrostedGlassProps) {
  const baseClasses = 'backdrop-blur-lg border shadow-xl'
  
  const variantClasses = {
    default: 'bg-white/20 border-white/30',
    dark: 'bg-black/30 border-gray-500/30',
    light: 'bg-white/30 border-white/40'
  }

  return (
    <div className={cn(
      baseClasses,
      variantClasses[variant],
      className
    )}>
      {children}
    </div>
  )
} 