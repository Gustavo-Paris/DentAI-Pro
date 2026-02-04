import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS conflict resolution
 *
 * @example
 * cn('px-2 py-1', 'px-4')
 * // => 'py-1 px-4'
 *
 * @example
 * cn('text-red-500', condition && 'text-blue-500')
 * // => 'text-blue-500' if condition is true
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
