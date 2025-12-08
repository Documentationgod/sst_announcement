import { track } from '@vercel/analytics'

// Client-side analytics functions (only work in browser environment)
export const clientAnalytics = {
  // Track page views (automatically handled by Vercel Analytics)
  trackPageView: (page: string) => {
    if (typeof window !== 'undefined') {
      track('page_view', { page })
    }
  },

  // Track user interactions
  trackEvent: (eventName: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      track(eventName, properties)
    }
  },

  // Track announcement interactions
  trackAnnouncementView: (announcementId: string, title: string) => {
    if (typeof window !== 'undefined') {
      track('announcement_view', {
        announcement_id: announcementId,
        title: title,
        timestamp: new Date().toISOString()
      })
    }
  },

  trackAnnouncementClick: (announcementId: string, title: string, link?: string) => {
    if (typeof window !== 'undefined') {
      const properties: Record<string, any> = {
        announcement_id: announcementId,
        title: title,
        timestamp: new Date().toISOString()
      }
      if (link) {
        properties.link = link
      }
      track('announcement_click', properties)
    }
  },

  // Track user authentication
  trackLogin: (userId: string, method: string = 'clerk') => {
    if (typeof window !== 'undefined') {
      track('login', {
        user_id: userId,
        method: method,
        timestamp: new Date().toISOString()
      })
    }
  },

  trackLogout: (userId: string) => {
    if (typeof window !== 'undefined') {
      track('logout', {
        user_id: userId,
        timestamp: new Date().toISOString()
      })
    }
  },

  // Track admin actions
  trackAnnouncementCreate: (announcementId: string, title: string, category: string) => {
    if (typeof window !== 'undefined') {
      track('announcement_create', {
        announcement_id: announcementId,
        title: title,
        category: category,
        timestamp: new Date().toISOString()
      })
    }
  },

  trackAnnouncementEdit: (announcementId: string, title: string) => {
    if (typeof window !== 'undefined') {
      track('announcement_edit', {
        announcement_id: announcementId,
        title: title,
        timestamp: new Date().toISOString()
      })
    }
  },

  trackAnnouncementDelete: (announcementId: string, title: string) => {
    if (typeof window !== 'undefined') {
      track('announcement_delete', {
        announcement_id: announcementId,
        title: title,
        timestamp: new Date().toISOString()
      })
    }
  },

  // Track analytics modal interactions
  trackAnalyticsView: () => {
    if (typeof window !== 'undefined') {
      track('analytics_modal_open', {
        timestamp: new Date().toISOString()
      })
    }
  },

  // Track search and filtering
  trackSearch: (query: string, resultsCount: number) => {
    if (typeof window !== 'undefined') {
      track('search', {
        query: query,
        results_count: resultsCount,
        timestamp: new Date().toISOString()
      })
    }
  },

  trackFilter: (filterType: string, value: string) => {
    if (typeof window !== 'undefined') {
      track('filter', {
        filter_type: filterType,
        value: value,
        timestamp: new Date().toISOString()
      })
    }
  },

  // Track outbound link clicks
  trackOutboundClick: async (url: string, referrer?: string) => {
    if (typeof window !== 'undefined') {
      try {
        // Track in Google Analytics
        track('outbound_click', {
          url: url,
          domain: new URL(url).hostname,
          referrer: referrer || window.location.href,
          timestamp: new Date().toISOString()
        })

        // Track in our database
        await fetch('/api/analytics/outbound-click', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            referrer: referrer || window.location.href,
          }),
        })
      } catch (error) {
        console.error('Error tracking outbound click:', error)
      }
    }
  }
}

// Legacy export for backward compatibility (client-side only)
export const analytics = clientAnalytics

export default analytics