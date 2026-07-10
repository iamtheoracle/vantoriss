import React from 'react';
import { cn } from '@/lib/utils';

/**
 * VantorisLoading — Unified loading states.
 *
 * Variants:
 * - spinner: Centered spinner (default)
 * - skeleton: Shimmer skeleton block
 * - dots: Three bouncing dots (for chat typing)
 * - fullscreen: Full-screen centered spinner
 */
export default function VantorisLoading({ variant = 'spinner', className, size = 'default' }) {
  const sizes = {
    sm: 'w-5 h-5',
    default: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  if (variant === 'fullscreen') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className={cn('border-2 border-slate-200 border-t-navy rounded-full animate-spin', sizes[size], className)} />
      </div>
    );
  }

  if (variant === 'skeleton') {
    return <div className={cn('vantoris-shimmer rounded-xl', className)} />;
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray"
            style={{
              animation: 'typing-bounce 1.2s infinite ease-in-out',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('border-2 border-slate-200 border-t-navy rounded-full animate-spin', sizes[size])} />
    </div>
  );
}