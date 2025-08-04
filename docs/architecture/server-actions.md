```js
// app/actions/attribution.js
'use server'

import { cookies } from 'next/headers'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { 
  createSession, 
  updateSessionEvent, 
  getSession, 
  markSessionConverted,
  getAttributionData 
} from '@/lib/redis-helpers'
import { 
  sendMetaEvent, 
  sendMetaPurchase, 
  sendMetaPageView,
  sendMetaViewContent,
  sendMetaInitiateCheckout 
} from '@/lib/meta-helpers'
import { 
  sendPostHogPageView, 
  sendPostHogConversion,
  capturePostHogEvent 
} from '@/lib/posthog-helpers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Track page view (called from pages/components)
export async function trackPageView(pathname) {
  const cookieStore = cookies()
  const sessionId = cookieStore.get('sessionId')?.value
  
  if (!sessionId) {
    console.warn('No session ID found for page view tracking')
    return
  }

  const session = await getSession(sessionId)
  if (!session) return

  // Update Redis
  await updateSessionEvent(sessionId, {
    event: 'PageView',
    properties: { pathname }
  })

  // Send to Meta
  await sendMetaPageView(sessionId)

  // Send to PostHog
  await sendPostHogPageView(sessionId, pathname, {
    utm_source: session.utm_source,
    utm_medium: session.utm_medium,
    utm_campaign: session.utm_campaign,
    utm_content: session.utm_content,
    utm_term: session.utm_term
  })
}

// Track content view (trailer, film page, etc)
export async function trackContentView(contentId, contentType = 'video') {
  const cookieStore = cookies()
  const sessionId = cookieStore.get('sessionId')?.value
  
  if (!sessionId) return

  // Update Redis
  await updateSessionEvent(sessionId, {
    event: 'ViewContent',
    properties: { 
      content_id: contentId,
      content_type: contentType
    }
  })

  // Send to Meta
  await sendMetaViewContent(sessionId, contentId)

  // Send to PostHog
  await capturePostHogEvent(sessionId, 'Content Viewed', {
    content_id: contentId,
    content_type: contentType
  })
}

// Track video progress
export async function trackVideoProgress(videoId, progress) {
  const cookieStore = cookies()
  const sessionId = cookieStore.get('sessionId')?.value
  
  if (!sessionId) return

  await updateSessionEvent(sessionId, {
    event: 'VideoWatch',
    properties: { 
      video_id: videoId,
      progress: progress
    }
  })

  // Only send to PostHog for key milestones
  if ([25, 50, 75, 95].includes(progress)) {
    await capturePostHogEvent(sessionId, 'Video Progress', {
      video_id: videoId,
      progress: progress,
      milestone: `${progress}%`
    })
  }
}

// Create Stripe checkout session
export async function createDonationCheckout(amount) {
  const cookieStore = cookies()
  const sessionId = cookieStore.get('sessionId')?.value
  
  if (!sessionId) {
    throw new Error('No session found')
  }

  // Track checkout initiation
  await updateSessionEvent(sessionId, {
    event: 'InitiateCheckout',
    properties: { amount }
  })

  // Send to Meta (important for optimization)
  await sendMetaInitiateCheckout(sessionId, amount)

  // Send to PostHog
  await capturePostHogEvent(sessionId, 'Checkout Started', {
    amount: amount
  })

  // Create Stripe checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Film Donation',
          description: 'Support independent filmmaking'
        },
        unit_amount: Math.round(amount * 100) // Stripe uses cents
      },
      quantity: 1
    }],
    metadata: {
      sessionId: sessionId, // Critical for attribution
      amount: amount.toString()
    },
    success_url: `${process.env.NEXT_PUBLIC_URL}/thank-you?session_id=${sessionId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/donate`
  })

  redirect(checkoutSession.url)
}

// Handle Stripe webhook (called from API route)
export async function handleStripeWebhook(event) {
  if (event.type !== 'checkout.session.completed') {
    return { success: true, message: 'Event ignored' }
  }

  const checkoutSession = event.data.object
  const { sessionId, amount } = checkoutSession.metadata
  
  if (!sessionId) {
    console.error('No sessionId in Stripe metadata')
    return { success: false, error: 'Missing sessionId' }
  }

  // Get full session data for attribution
  const session = await getSession(sessionId)
  if (!session) {
    console.error('Session not found:', sessionId)
    return { success: false, error: 'Session not found' }
  }

  // Mark as converted in Redis
  await markSessionConverted(sessionId, {
    amount: parseFloat(amount),
    stripePaymentId: checkoutSession.payment_intent,
    email: checkoutSession.customer_email,
    sessionStartTime: parseInt(session.first_touch_timestamp)
  })

  // Send to Meta (most important for ROAS)
  await sendMetaPurchase(sessionId, amount)

  // Get attribution data for PostHog
  const attribution = await getAttributionData(sessionId)
  
  // Send to PostHog with full attribution
  await sendPostHogConversion(sessionId, {
    amount: parseFloat(amount),
    paymentMethod: checkoutSession.payment_method_types[0],
    attribution: attribution,
    timeToConversion: Date.now() - parseInt(session.first_touch_timestamp),
    watchedTrailer: session.video_trailer_progress > 0,
    contentViewed: session.content_viewed
  })

  return { success: true, message: 'Conversion tracked' }
}

// Initialize campaign landing (called from campaign pages)
export async function initializeCampaignSession(utmParams) {
  const cookieStore = cookies()
  const headersList = headers()
  
  // Create new session
  const sessionId = createSessionId()
  
  await createSession(sessionId, utmParams, {
    pathname: utmParams.landing_page || '/',
    country: headersList.get('x-vercel-ip-country'),
    city: headersList.get('x-vercel-ip-city'),
    userAgent: headersList.get('user-agent'),
    ip: headersList.get('x-forwarded-for')
  })

  // Set cookie
  cookieStore.set('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })

  // Track initial page view
  await trackPageView(utmParams.landing_page || '/')

  return { sessionId }
}
```