```js
import { getSession } from '@/services/redis'
import { sendMetaPageView, sendMetaPurchase, sendMetaViewContent } from '@/services/meta'
import { sendPostHogPageView, sendPostHogConversion, capturePostHogEvent } from '@/services/posthog'


// Normalize session data for all providers
function normalizeSessionData(rawSessionData) {
  return {
    sessionId: rawSessionData.sessionId,
    utm_source: rawSessionData.utm_source,
    utm_medium: rawSessionData.utm_medium,
    utm_campaign: rawSessionData.utm_campaign,
    utm_content: rawSessionData.utm_content,
    utm_term: rawSessionData.utm_term,
    fbclid: rawSessionData.fbclid,
    country: rawSessionData.country,
    city: rawSessionData.city,
    user_agent: rawSessionData.user_agent,
    ip_address: rawSessionData.ip_address,
    landing_page: rawSessionData.landing_page,
    content_viewed: rawSessionData.content_viewed,
    donation_completed: rawSessionData.donation_completed === 'true',
    donation_amount: rawSessionData.donation_amount ? parseFloat(rawSessionData.donation_amount) : null,
    created_at: rawSessionData.created_at,
    first_touch_timestamp: rawSessionData.first_touch_timestamp
  }
}

// Main tracking functions
export async function trackPageView(sessionId, pathname) {
  try {
    const rawSessionData = await getSession(sessionId)
    if (!rawSessionData) {
      return { success: false, error: 'Session not found' }
    }

    const sessionData = normalizeSessionData(rawSessionData)
    
    await sendMetaPageView(sessionId)
    await sendPostHogPageView(sessionId, pathname, {
      utm_source: sessionData.utm_source,
      utm_medium: sessionData.utm_medium,
      utm_campaign: sessionData.utm_campaign,
      utm_content: sessionData.utm_content,
      utm_term: sessionData.utm_term
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to track page view:', error)
    return { success: false, error: error.message }
  }
}

export async function trackPurchase(sessionId, amount, currency = 'USD') {
  try {
    const rawSessionData = await getSession(sessionId)
    if (!rawSessionData) {
      return { success: false, error: 'Session not found' }
    }
    
    const sessionData = normalizeSessionData(rawSessionData)
    
    await sendMetaPurchase(sessionId, amount, currency)
    await sendPostHogConversion(sessionId, {
      amount: parseFloat(amount),
      currency,
      attribution: {
        utm_source: sessionData.utm_source,
        utm_medium: sessionData.utm_medium,
        utm_campaign: sessionData.utm_campaign
      },
      timeToConversion: sessionData.created_at ? Date.now() - parseInt(sessionData.created_at) : null,
      contentViewed: sessionData.content_viewed
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to track purchase:', error)
    return { success: false, error: error.message }
  }
}

export async function trackViewContent(sessionId, contentId) {
  try {
    const rawSessionData = await getSession(sessionId)
    if (!rawSessionData) {
      return { success: false, error: 'Session not found' }
    }

    await sendMetaViewContent(sessionId, contentId)
    await capturePostHogEvent(sessionId, 'ViewContent', {
      content_id: contentId,
      content_type: 'product',
      content_name: contentId
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to track view content:', error)
    return { success: false, error: error.message }
  }
}

```