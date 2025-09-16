import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatLargeNumber(value: number): string {
  const absValue = Math.abs(value)

  if (absValue >= 1e12) {
    return `${(value / 1e12).toFixed(1)}T`
  } else if (absValue >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`
  } else if (absValue >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`
  } else if (absValue >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`
  } else {
    return value.toString()
  }
}

export function getMarketStatusColor(change: number): string {
  if (change > 0) return 'text-bull'
  if (change < 0) return 'text-bear'
  return 'text-neutral'
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}