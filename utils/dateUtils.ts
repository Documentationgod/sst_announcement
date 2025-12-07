/**
 * Check if an announcement has expired
 */
const DEFAULT_TIMEZONE = process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || 'Asia/Kolkata';
const DEFAULT_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
};

export const isAnnouncementExpired = (announcement: { expiry_date?: string | null }): boolean => {
  if (!announcement.expiry_date) return false
  
  const expiryDate = new Date(announcement.expiry_date)
  const now = new Date()
  
  return expiryDate < now
}

export const formatDateForInput = (dateString?: string | null): string => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch (error) {
    return ''
  }
}

export const getDefaultTimeZone = () => DEFAULT_TIMEZONE

export const formatDateTime = (
  value?: string | number | Date | null,
  options: Intl.DateTimeFormatOptions = DEFAULT_FORMAT_OPTIONS,
  locale = 'en-US',
  fallback = 'Unknown date'
): string => {
  if (!value) return fallback

  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return fallback

  try {
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone: DEFAULT_TIMEZONE,
      ...options,
    })
    return formatter.format(date)
  } catch (error) {
    return fallback
  }
}