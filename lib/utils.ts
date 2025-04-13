import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { format, formatDistanceToNow } from "date-fns"

// Get current week number and year
export function getCurrentWeekAndYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const diff = now.getTime() - start.getTime()
  const oneWeek = 7 * 24 * 60 * 60 * 1000
  const weekNumber = Math.floor(diff / oneWeek) + 1

  return {
    weekNumber,
    year: now.getFullYear(),
  }
}

// Format date for display
export function formatDate(date: string | Date | null) {
  if (!date) return "Never"

  const dateObj = typeof date === "string" ? new Date(date) : date
  return format(dateObj, "MMM d, yyyy")
}

// Format relative time
export function formatRelativeTime(date: string | Date | null) {
  if (!date) return "Never"

  const dateObj = typeof date === "string" ? new Date(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true })
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
