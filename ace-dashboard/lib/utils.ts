import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import crypto from 'crypto';

/**
 * Merge tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique reference like ACE-{PREFIX}-{6-char-alphanumeric}
 */
export function generateReference(prefix: string): string {
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ACE-${prefix}-${randomChars}`;
}

/**
 * Format a date to human readable string
 */
export function formatDate(date: Date | string | number): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Hash IP address for privacy
 */
export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}
