'use client'
import { useEffect } from 'react'
import { useRouter } from 'waku'
import { usePostHogTracking } from '../lib/posthog'

/**
 * Component to track page views automatically
 * Should be placed inside the PostHogProvider
 */
export function PageViewTracker() {
  const location = useRouter()
  const { trackPageView } = usePostHogTracking()

  useEffect(() => {
    // Track page view on mount and when location changes
    trackPageView(location.path + location.query, document.title)
  }, [location.path, location.query, trackPageView])

  return null
}
