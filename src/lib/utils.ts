import { type ClassValue, clsx } from 'clsx'

/**
 * Formats a date string to Indonesian locale format
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  })
}

/**
 * Formats a date to relative time (e.g. '3 jam yang lalu')
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Baru saja'
  if (diffMins < 60) return `${diffMins} menit yang lalu`
  if (diffHours < 24) return `${diffHours} jam yang lalu`
  if (diffDays < 7) return `${diffDays} hari yang lalu`
  return formatDate(d)
}

/**
 * Formats minutes to human-readable duration
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} menit`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours} jam ${mins} menit` : `${hours} jam`
}

/**
 * Formats a timer value (seconds) to MM:SS or HH:MM:SS
 */
export function formatTimer(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  const pad = (n: number) => n.toString().padStart(2, '0')
  
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${pad(minutes)}:${pad(seconds)}`
}

/**
 * Generates a random password of given length
 */
export function generateRandomPassword(length: number = 12): string {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%'
  let password = ''
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length]
  }
  return password
}

/**
 * Normalizes a Google Drive URL to a direct download/preview link.
 * Supports various Drive URL formats:
 * - https://drive.google.com/file/d/{ID}/view
 * - https://drive.google.com/open?id={ID}
 * - https://docs.google.com/document/d/{ID}/...
 * 
 * For audio files (listening questions), converts to direct download format.
 */
export function normalizeDriveUrl(url: string, forceDownload: boolean = false): string {
  // Extract file ID from various Google Drive URL formats
  let fileId: string | null = null

  // Format: /file/d/{ID}/
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) fileId = fileMatch[1]

  // Format: /d/{ID}/
  if (!fileId) {
    const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (dMatch) fileId = dMatch[1]
  }

  // Format: ?id={ID}
  if (!fileId) {
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
    if (idMatch) fileId = idMatch[1]
  }

  // Format: direct lh3 link — already a direct link
  if (!fileId && url.includes('lh3.googleusercontent.com')) {
    return url
  }

  if (!fileId) {
    // Can't parse — return as-is
    return url
  }

  if (forceDownload) {
    // Direct download link (for audio files)
    return `https://drive.google.com/uc?export=download&id=${fileId}`
  }

  // Preview/view link
  return `https://drive.google.com/file/d/${fileId}/view`
}

/**
 * Truncates text to a specified length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Creates pagination metadata from total count and current page
 */
export function getPaginationMeta(
  totalCount: number,
  page: number,
  pageSize: number = 20
) {
  const totalPages = Math.ceil(totalCount / pageSize)
  return {
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
    hasNextPage: page < totalPages - 1,
    hasPreviousPage: page > 0,
    from: page * pageSize,
    to: Math.min((page + 1) * pageSize - 1, totalCount - 1),
  }
}

/**
 * Get client IP from headers (for rate limiting)
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}
