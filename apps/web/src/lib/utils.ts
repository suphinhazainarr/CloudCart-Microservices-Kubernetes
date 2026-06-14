import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merges Tailwind classes intelligently — resolves conflicts
// e.g. cn('px-2 py-1', 'px-4') → 'py-1 px-4' (px-4 wins)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style:    'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  }).format(new Date(dateString));
}

export function formatRelativeTime(dateString: string): string {
  const date  = new Date(dateString);
  const now   = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1)   return 'just now';
  if (diffMins < 60)  return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return formatDate(dateString);
}

export function slugify(str: string): string {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + '…';
}

export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending_payment: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
    confirmed:       'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    processing:      'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    shipped:         'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
    delivered:       'text-green-600 bg-green-50 dark:bg-green-900/20',
    cancelled:       'text-red-600 bg-red-50 dark:bg-red-900/20',
    payment_failed:  'text-red-600 bg-red-50 dark:bg-red-900/20',
  };
  return map[status] ?? 'text-gray-600 bg-gray-50';
}
