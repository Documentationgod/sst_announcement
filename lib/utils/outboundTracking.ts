import { analytics } from '../analytics'

/**
 * Utility functions for tracking outbound link clicks
 *
 * Usage examples:
 *
 * 1. Direct function call:
 * import { trackOutboundClick } from '@/lib/utils/outboundTracking'
 * await trackOutboundClick('https://example.com')
 *
 * 2. Using the hook:
 * import { useOutboundLinkTracker } from '@/lib/utils/outboundTracking'
 * const trackOutbound = useOutboundLinkTracker()
 * <a href="https://example.com" onClick={(e) => trackOutbound('https://example.com', e)}>Link</a>
 *
 * 3. For external links in components, add onClick handlers:
 * <a
 *   href="https://external-site.com"
 *   onClick={(e) => handleOutboundLinkClick('https://external-site.com', e)}
 * >
 *   External Link
 * </a>
 */

/**
 * Track outbound link clicks and handle navigation
 * @param url The URL to navigate to
 * @param referrer Optional referrer URL (defaults to current page)
 */
export async function trackOutboundClick(url: string, referrer?: string): Promise<void> {
  await analytics.trackOutboundClick(url, referrer)
}

/**
 * Handle click on external link with tracking
 * @param url The external URL
 * @param event The click event
 * @param referrer Optional referrer URL
 */
export function handleOutboundLinkClick(
  url: string,
  event?: React.MouseEvent | MouseEvent,
  referrer?: string
): void {
  // Track the click asynchronously (don't block navigation)
  trackOutboundClick(url, referrer).catch(console.error)

  // If event is provided and it's a React event, prevent default to allow tracking
  if (event && 'preventDefault' in event) {
    event.preventDefault()
    // Navigate after a short delay to allow tracking to complete
    setTimeout(() => {
      window.open(url, '_blank', 'noopener,noreferrer')
    }, 100)
  }
}

/**
 * Hook for tracking outbound links
 * Usage: const trackOutbound = useOutboundLinkTracker()
 * Then: <a href="https://example.com" onClick={(e) => trackOutbound('https://example.com', e)}>Link</a>
 */
export function useOutboundLinkTracker() {
  return (url: string, event?: React.MouseEvent | MouseEvent, referrer?: string) => {
    handleOutboundLinkClick(url, event, referrer)
  }
}