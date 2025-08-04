```js
import { PostHog } from 'posthog-node'

// Initialize PostHog client
const posthogClient = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY,
  {
    host: 'https://us.i.posthog.com',
    flushAt: 1, // Flush immediately in server environment
    flushInterval: 0 // Don't batch
  }
)

export async function capturePostHogEvent(sessionId, eventName, properties = {}) {
  try {
    // Use sessionId as distinct_id (no cookies needed)
    posthogClient.capture({
      distinctId: sessionId,
      event: eventName,
      properties: {
        ...properties,
        // Always include these for consistency
        $session_id: sessionId,
        $timestamp: new Date().toISOString(),
        // Server-side tracking flag
        $source: 'server'
      }
    })

    // Ensure event is sent immediately
    await posthogClient.flush()
    
    return { success: true }
  } catch (error) {
    console.error('Failed to capture PostHog event:', error)
    // Don't throw - analytics shouldn't break user flow
    return { success: false, error: error.message }
  }
}

export async function sendPostHogPageView(sessionId, pathname, utmData) {
  const properties = {
    $current_url: `${process.env.NEXT_PUBLIC_URL}${pathname}`,
    $pathname: pathname,
    // Include UTM params if present
    ...(utmData.utm_source && { utm_source: utmData.utm_source }),
    ...(utmData.utm_medium && { utm_medium: utmData.utm_medium }),
    ...(utmData.utm_campaign && { utm_campaign: utmData.utm_campaign }),
    ...(utmData.utm_content && { utm_content: utmData.utm_content }),
    ...(utmData.utm_term && { utm_term: utmData.utm_term }),
    // Track if this is a campaign visit
    is_campaign_traffic: !!utmData.utm_source
  }

  return capturePostHogEvent(sessionId, '$pageview', properties)
}

export async function sendPostHogConversion(sessionId, donationData) {
  const properties = {
    // Donation details
    amount: donationData.amount,
    currency: donationData.currency || 'USD',
    payment_method: donationData.paymentMethod,
    is_guest_checkout: donationData.isGuest || true,
    
    // Attribution data
    utm_source: donationData.attribution?.utm_source,
    utm_medium: donationData.attribution?.utm_medium,
    utm_campaign: donationData.attribution?.utm_campaign,
    first_touch_source: donationData.attribution?.utm_source,
    time_to_conversion_ms: donationData.timeToConversion,
    
    // Content engagement
    watched_trailer: donationData.watchedTrailer || false,
    content_viewed: donationData.contentViewed,
    
    // Revenue tracking for PostHog
    revenue: donationData.amount,
    $revenue: donationData.amount // PostHog special property
  }

  return capturePostHogEvent(sessionId, 'Donation Completed', properties)
}

// Shutdown function for cleanup
export async function shutdownPostHog() {
  await posthogClient.shutdown()
}
```