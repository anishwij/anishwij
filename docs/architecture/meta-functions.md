```js
import crypto from 'crypto'

// Hash function for Meta required PII
function hashForMeta(value) {
  if (!value) return null
  return crypto
    .createHash('sha256')
    .update(value.toLowerCase().trim())
    .digest('hex')
}

async function sendMetaEvent(eventName, sessionData, eventParams = {}) {
  const metaPixelId = process.env.META_PIXEL_ID
  const metaAccessToken = process.env.META_ACCESS_TOKEN
  
  const userData = prepareMetaUserData(sessionData)
  
  const payload = {
    data: [{
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: `${sessionData.sessionId}_${eventName}_${Date.now()}`, // Deduplication
      action_source: 'website',
      event_source_url: `${process.env.NEXT_PUBLIC_URL}${sessionData.pathname || '/'}`,
      user_data: userData,
      custom_data: {
        ...eventParams,
        content_category: 'Film',
        utm_source: sessionData.utm_source,
        utm_medium: sessionData.utm_medium,
        utm_campaign: sessionData.utm_campaign,
        utm_content: sessionData.utm_content,
        utm_term: sessionData.utm_term
      }
    }]
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${metaPixelId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          access_token: metaAccessToken,
          test_event_code: process.env.META_TEST_EVENT_CODE // Remove in production
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('Meta CAPI Error:', error)
      throw new Error(`Meta CAPI failed: ${error.error?.message}`)
    }

    const result = await response.json()
    return { success: true, result }
  } catch (error) {
    console.error('Failed to send Meta event:', error)
    // Don't throw - we don't want to break user flow
    return { success: false, error: error.message }
  }
}

function prepareMetaUserData(session) {
  const userData = {
    // Required for web events - DO NOT hash these
    client_ip_address: session.ip_address || null,
    client_user_agent: session.user_agent || null,
    
    // Click ID from Facebook - DO NOT hash
    fbc: session.fbclid ? `fb.1.${Date.now()}.${session.fbclid}` : null,
    
    // Location data - MUST be hashed
    ...(session.country && { country: hashForMeta(session.country) }),
    ...(session.city && { ct: hashForMeta(session.city) }),
  }

  // If we have email from Stripe webhook (guest donation), hash it
  if (session.email) {
    userData.em = hashForMeta(session.email)
  }

  // Remove null values
  return Object.fromEntries(
    Object.entries(userData).filter(([_, value]) => value !== null)
  )
}

async function sendMetaPurchase(sessionId, amount, currency = 'USD') {
  // Get fresh session data from Redis
  const session = await redis.hgetall(sessionId)
  if (!session) {
    console.error('Session not found for Meta purchase event:', sessionId)
    return { success: false, error: 'Session not found' }
  }

  const eventParams = {
    currency: currency,
    value: parseFloat(amount),
    content_ids: [session.content_viewed || 'film_donation'],
    contents: [{
      id: session.content_viewed || 'film_donation',
      quantity: 1,
      item_price: parseFloat(amount)
    }],
    content_type: 'product',
    // Add predicted LTV if you have it
    predicted_ltv: parseFloat(amount), // For now, same as donation
    // Track if they watched the film before donating
    custom_properties: {
      watched_trailer: session.trailer_watched === 'true',
      session_duration: Date.now() - parseInt(session.created_at),
      is_guest_checkout: 'true'
    }
  }

  return sendMetaEvent('Purchase', session, eventParams)
}

// Additional helper functions for other events
async function sendMetaPageView(sessionId) {
  const session = await redis.hgetall(sessionId)
  if (!session) return { success: false, error: 'Session not found' }
  
  return sendMetaEvent('PageView', session)
}

async function sendMetaViewContent(sessionId, contentId) {
  const session = await redis.hgetall(sessionId)
  if (!session) return { success: false, error: 'Session not found' }
  
  return sendMetaEvent('ViewContent', session, {
    content_ids: [contentId],
    content_type: 'product',
    content_name: contentId
  })
}

async function sendMetaInitiateCheckout(sessionId, amount) {
  const session = await redis.hgetall(sessionId)
  if (!session) return { success: false, error: 'Session not found' }
  
  return sendMetaEvent('InitiateCheckout', session, {
    currency: 'USD',
    value: parseFloat(amount),
    content_ids: [session.content_viewed || 'film_donation'],
    content_type: 'product',
    num_items: 1
  })
}
```