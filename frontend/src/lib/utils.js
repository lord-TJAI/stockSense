import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes conditionally — shadcn/ui pattern.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
