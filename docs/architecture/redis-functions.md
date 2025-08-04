```js
import { redis } from '@/lib/redis.server'
import { nanoid } from 'nanoid'

// Constants
const SESSION_TTL = 60 * 60 * 24 * 7 // 7 days in seconds
const SESSION_PREFIX = 'sess:'
const EVENTS_PREFIX = 'events:sess:'

// Create session ID helper
export function createSessionId() {
  return `${SESSION_PREFIX}${nanoid(21)}`
}

// Core Redis operations for session management
export async function createSession(sessionId, utmData, metadata) {
  try {
    const sessionData = {
      // Attribution data
      utm_source: utmData.utm_source || null,
      utm_medium: utmData.utm_medium || null,
      utm_campaign: utmData.utm_campaign || null,
      utm_term: utmData.utm_term || null,
      utm_content: utmData.utm_content || null,
      
      // First touch (never changes)
      first_touch_timestamp: Date.now(),
      landing_page: metadata.pathname || '/',
      
      // Metadata
      fbclid: utmData.fbclid || null,
      gclid: utmData.gclid || null, // For future Google Ads
      country: metadata.country || 'unknown',
      city: metadata.city || 'unknown',
      user_agent: metadata.userAgent || null,
      ip_address: metadata.ip || null,
      
      // Session info
      created_at: Date.now(),
      
      // Conversion flags
      donation_initiated: 'false',
      donation_completed: 'false',
      donation_amount: null,
      content_viewed: null,
    }

    // Remove null values to save space
    const cleanData = Object.fromEntries(
      Object.entries(sessionData).filter(([_, v]) => v !== null)
    )

    // Set session data with TTL
    await redis.hset(sessionId, cleanData)
    await redis.expire(sessionId, SESSION_TTL)

    // Initialize events list
    await redis.lpush(
      `${EVENTS_PREFIX}${sessionId}`,
      JSON.stringify({
        event: 'SessionStart',
        timestamp: Date.now(),
        landing_page: metadata.pathname || '/'
      })
    )
    await redis.expire(`${EVENTS_PREFIX}${sessionId}`, SESSION_TTL)

    return { success: true, sessionId }
  } catch (error) {
    console.error('Failed to create session:', error)
    return { success: false, error: error.message }
  }
}

export async function updateSessionEvent(sessionId, eventData) {
  try {
    // Add event to list
    const eventPayload = {
      event: eventData.event,
      timestamp: Date.now(),
      ...eventData.properties
    }

    await redis.lpush(
      `${EVENTS_PREFIX}${sessionId}`,
      JSON.stringify(eventPayload)
    )

    // Update session data based on event type
    const updates = {}

    switch (eventData.event) {
      case 'PageView':
        updates.last_page_viewed = eventData.properties.pathname
        updates.last_activity = Date.now()
        break
        
      case 'ViewContent':
        updates.content_viewed = eventData.properties.content_id
        updates.last_activity = Date.now()
        break
        
      case 'InitiateCheckout':
        updates.donation_initiated = 'true'
        updates.checkout_amount = eventData.properties.amount
        updates.last_activity = Date.now()
        break
        
      case 'VideoWatch':
        updates[`video_${eventData.properties.video_id}_progress`] = eventData.properties.progress
        updates.last_activity = Date.now()
        break
    }

    if (Object.keys(updates).length > 0) {
      await redis.hset(sessionId, updates)
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to update session event:', error)
    return { success: false, error: error.message }
  }
}

export async function getSession(sessionId) {
  try {
    const sessionData = await redis.hgetall(sessionId)
    
    // Return null if session doesn't exist or is empty
    if (!sessionData || Object.keys(sessionData).length === 0) {
      return null
    }

    return sessionData
  } catch (error) {
    console.error('Failed to get session:', error)
    return null
  }
}

export async function markSessionConverted(sessionId, conversionData) {
  try {
    const updates = {
      donation_completed: 'true',
      donation_amount: conversionData.amount,
      donation_timestamp: Date.now(),
      time_to_conversion: Date.now() - conversionData.sessionStartTime,
      stripe_payment_id: conversionData.stripePaymentId,
      
      // Add email if provided (from Stripe)
      ...(conversionData.email && { email: conversionData.email })
    }

    await redis.hset(sessionId, updates)

    // Add conversion event
    await redis.lpush(
      `${EVENTS_PREFIX}${sessionId}`,
      JSON.stringify({
        event: 'Purchase',
        timestamp: Date.now(),
        amount: conversionData.amount,
        payment_id: conversionData.stripePaymentId
      })
    )

    return { success: true }
  } catch (error) {
    console.error('Failed to mark session as converted:', error)
    return { success: false, error: error.message }
  }
}

export async function extendSessionTTL(sessionId) {
  try {
    // Check if session exists
    const exists = await redis.exists(sessionId)
    if (!exists) {
      return { success: false, error: 'Session not found' }
    }

    // Extend both session and events TTL
    await redis.expire(sessionId, SESSION_TTL)
    await redis.expire(`${EVENTS_PREFIX}${sessionId}`, SESSION_TTL)

    // Update last activity
    await redis.hset(sessionId, {
      last_activity: Date.now(),
      session_extended: 'true'
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to extend session TTL:', error)
    return { success: false, error: error.message }
  }
}

export async function getSessionEvents(sessionId) {
  try {
    // Get all events (Redis LRANGE 0 -1 gets all items)
    const events = await redis.lrange(`${EVENTS_PREFIX}${sessionId}`, 0, -1)
    
    if (!events || events.length === 0) {
      return []
    }

    // Parse and reverse to get chronological order (LPUSH adds to front)
    return events
      .map(event => {
        try {
          return JSON.parse(event)
        } catch {
          return null
        }
      })
      .filter(Boolean)
      .reverse()
  } catch (error) {
    console.error('Failed to get session events:', error)
    return []
  }
}

// Helper to get attribution data for Meta
export async function getAttributionData(sessionId) {
  const session = await getSession(sessionId)
  if (!session) return null

  return {
    sessionId,
    utm_source: session.utm_source,
    utm_medium: session.utm_medium,
    utm_campaign: session.utm_campaign,
    utm_content: session.utm_content,
    utm_term: session.utm_term,
    fbclid: session.fbclid,
    first_touch_timestamp: parseInt(session.first_touch_timestamp),
    landing_page: session.landing_page,
    content_viewed: session.content_viewed,
    donation_completed: session.donation_completed === 'true',
    donation_amount: session.donation_amount ? parseFloat(session.donation_amount) : null
  }
}

// Cleanup helper for GDPR or manual cleanup
export async function deleteSession(sessionId) {
  try {
    await redis.del(sessionId)
    await redis.del(`${EVENTS_PREFIX}${sessionId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to delete session:', error)
    return { success: false, error: error.message }
  }
}
```