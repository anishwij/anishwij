```ts
// ===================================
// lib/attribution-store.js - Redis KV for temporary attribution data
// ===================================
import { kv } from '@vercel/kv';

const ATTRIBUTION_TTL = 60 * 60 * 24 * 30; // 30 days in seconds

export class AttributionStore {
  // Store click IDs and campaign data temporarily
  static async storeAttribution(sessionId, data) {
    const key = `attr:${sessionId}`;
    const attribution = {
      ...data,
      timestamp: new Date().toISOString(),
      sessionId
    };
    
    await kv.setex(key, ATTRIBUTION_TTL, attribution);
    return attribution;
  }

  // Get attribution data for a session
  static async getAttribution(sessionId) {
    if (!sessionId) return null;
    return await kv.get(`attr:${sessionId}`);
  }

  // Move attribution to user after login/consent
  static async linkAttributionToUser(sessionId, userId) {
    const attribution = await this.getAttribution(sessionId);
    if (!attribution) return null;

    // Store under user ID for persistent tracking
    const userKey = `user_attr:${userId}`;
    await kv.setex(userKey, ATTRIBUTION_TTL, {
      ...attribution,
      userId,
      linkedAt: new Date().toISOString()
    });

    // Clean up session attribution
    await kv.del(`attr:${sessionId}`);
    return attribution;
  }

  // Store conversion event temporarily if no consent
  static async queueConversion(sessionId, conversion) {
    const key = `pending_conv:${sessionId}`;
    const existing = await kv.get(key) || [];
    existing.push({
      ...conversion,
      queuedAt: new Date().toISOString()
    });
    
    await kv.setex(key, 60 * 60 * 24 * 7, existing); // 7 days
    return existing;
  }

  // Process queued conversions after consent
  static async processQueuedConversions(sessionId) {
    const key = `pending_conv:${sessionId}`;
    const queued = await kv.get(key) || [];
    
    if (queued.length > 0) {
      await kv.del(key);
    }
    
    return queued;
  }
}

// ===================================
// lib/conversion-events.js - Standard conversion event schemas
// ===================================
export const ConversionEvents = {
  // Donation conversion
  donation: (data) => ({
    event_name: 'Purchase',
    event_type: 'donation',
    value: data.amount / 100, // Convert cents to dollars
    currency: data.currency || 'USD',
    items: [{
      item_name: 'Donation',
      item_category: data.campaign || 'general',
      price: data.amount / 100,
      quantity: 1
    }],
    transaction_id: data.paymentIntentId,
    // Enhanced matching data (hashed before sending)
    user_data: {
      email: data.email,
      phone: data.phone,
      first_name: data.firstName,
      last_name: data.lastName,
      country: data.country,
      zip_code: data.zipCode
    }
  }),

  // Newsletter signup
  newsletter_signup: (data) => ({
    event_name: 'Lead',
    event_type: 'newsletter',
    value: 5, // Assign value for optimization
    currency: 'USD',
    lead_type: 'newsletter',
    user_data: {
      email: data.email
    }
  }),

  // Film engagement tracking
  film_watch: (data) => ({
    event_name: 'ViewContent',
    event_type: 'film_watch',
    content_type: 'video',
    content_name: data.filmTitle,
    value: calculateEngagementValue(data.watchTime, data.totalDuration),
    currency: 'USD',
    custom_data: {
      watch_time_seconds: data.watchTime,
      completion_rate: (data.watchTime / data.totalDuration) * 100,
      engagement_score: calculateEngagementScore(data)
    }
  }),

  // Key page views for remarketing
  key_page_view: (data) => ({
    event_name: 'PageView',
    event_type: 'key_page',
    content_name: data.pageName,
    content_category: data.pageCategory,
    value: data.engagementValue || 0
  })
};

// Helper functions
function calculateEngagementValue(watchTime, totalDuration) {
  const completionRate = watchTime / totalDuration;
  if (completionRate >= 0.9) return 20;      // Finished
  if (completionRate >= 0.5) return 10;      // Engaged
  if (completionRate >= 0.25) return 5;      // Interested
  return 1;                                   // Started
}

function calculateEngagementScore(data) {
  // Custom scoring based on your needs
  const factors = {
    completion: (data.watchTime / data.totalDuration) * 50,
    interactions: Math.min(data.interactions * 5, 25),
    shared: data.shared ? 25 : 0
  };
  return Object.values(factors).reduce((a, b) => a + b, 0);
}

// ===================================
// inngest/functions/process-conversion.js - Inngest functions
// ===================================
import { inngest } from '../client';
import { GoogleAdsAPI } from '@/lib/google-ads';
import { MetaAPI } from '@/lib/meta-api';
import { AttributionStore } from '@/lib/attribution-store';
import crypto from 'crypto';

export const processConversion = inngest.createFunction(
  {
    id: 'process-conversion',
    name: 'Process Marketing Conversion',
    retries: 3,
    concurrency: {
      limit: 10, // Process 10 conversions simultaneously
    }
  },
  { event: 'conversion/track' },
  async ({ event, step }) => {
    const { conversion, attribution, userId } = event.data;

    // Step 1: Validate and prepare data
    const prepared = await step.run('prepare-conversion', async () => {
      // Hash PII for enhanced matching
      if (conversion.user_data?.email) {
        conversion.user_data.email_hash = hashEmail(conversion.user_data.email);
        delete conversion.user_data.email;
      }
      
      return {
        conversion,
        attribution: attribution || await AttributionStore.getAttribution(userId)
      };
    });

    // Step 2: Send to Google Ads if gclid present
    if (prepared.attribution?.gclid) {
      await step.run('send-to-google', async () => {
        try {
          await GoogleAdsAPI.trackConversion({
            gclid: prepared.attribution.gclid,
            conversion_action: getGoogleConversionAction(conversion.event_type),
            conversion_value: conversion.value,
            currency_code: conversion.currency,
            conversion_date_time: new Date().toISOString(),
            custom_variables: conversion.custom_data
          });
        } catch (error) {
          console.error('Google Ads API error:', error);
          throw error; // Will retry
        }
      });
    }

    // Step 3: Send to Meta if fbclid present
    if (prepared.attribution?.fbclid) {
      await step.run('send-to-meta', async () => {
        try {
          await MetaAPI.trackConversion({
            event_name: conversion.event_name,
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            user_data: {
              ...conversion.user_data,
              fbp: prepared.attribution.fbclid,
              fbc: prepared.attribution.fbc // If using Meta cookie
            },
            custom_data: {
              value: conversion.value,
              currency: conversion.currency,
              ...conversion.custom_data
            },
            event_id: `${userId}_${conversion.transaction_id}` // Deduplication
          });
        } catch (error) {
          console.error('Meta API error:', error);
          throw error; // Will retry
        }
      });
    }

    // Step 4: Store for analytics
    await step.run('store-analytics', async () => {
      await kv.zadd(`conversions:${new Date().toISOString().split('T')[0]}`, {
        score: Date.now(),
        member: JSON.stringify({
          ...conversion,
          attribution: prepared.attribution,
          processedAt: new Date().toISOString()
        })
      });
    });

    return { success: true, conversionId: conversion.transaction_id };
  }
);

// Batch process for efficiency
export const batchProcessConversions = inngest.createFunction(
  {
    id: 'batch-process-conversions',
    name: 'Batch Process Conversions',
  },
  { cron: '*/5 * * * *' }, // Every 5 minutes
  async ({ step }) => {
    // Process any queued conversions after consent
    const pending = await step.run('get-pending', async () => {
      // Get all pending conversion keys
      const keys = await kv.keys('pending_conv:*');
      return keys;
    });

    if (pending.length > 0) {
      await step.run('process-batch', async () => {
        const events = pending.map(key => ({
          name: 'conversion/track',
          data: { /* conversion data */ }
        }));
        
        await inngest.send(events);
      });
    }
  }
);

// ===================================
// lib/google-ads.js - Google Ads Conversion API
// ===================================
import { google } from 'googleapis';

export class GoogleAdsAPI {
  static async trackConversion(data) {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_ADS_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/adwords']
    });

    const customer_id = process.env.GOOGLE_ADS_CUSTOMER_ID;
    
    const response = await fetch(
      `https://googleads.googleapis.com/v14/customers/${customer_id}/conversions:upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await auth.getAccessToken()}`,
          'Content-Type': 'application/json',
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN
        },
        body: JSON.stringify({
          conversions: [{
            gclid: data.gclid,
            conversion_action: `customers/${customer_id}/conversionActions/${data.conversion_action}`,
            conversion_date_time: data.conversion_date_time,
            conversion_value: data.conversion_value,
            currency_code: data.currency_code,
            order_id: data.transaction_id
          }],
          partial_failure: true // Don't fail entire batch for one error
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Google Ads API error: ${response.statusText}`);
    }

    return await response.json();
  }
}

// ===================================
// lib/meta-api.js - Meta Conversions API
// ===================================
export class MetaAPI {
  static async trackConversion(data) {
    const pixel_id = process.env.META_PIXEL_ID;
    const access_token = process.env.META_ACCESS_TOKEN;
    
    const payload = {
      data: [data],
      test_event_code: process.env.NODE_ENV === 'development' 
        ? process.env.META_TEST_EVENT_CODE 
        : undefined
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixel_id}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          access_token
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta API error: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }
}

// ===================================
// app/api/track/route.js - API endpoint for client-side tracking
// ===================================
import { inngest } from '@/inngest/client';
import { AttributionStore } from '@/lib/attribution-store';
import { ConversionEvents } from '@/lib/conversion-events';

export async function POST(request) {
  try {
    const { event, data, sessionId, userId } = await request.json();
    
    // Get attribution data
    const attribution = userId 
      ? await AttributionStore.getAttribution(userId)
      : await AttributionStore.getAttribution(sessionId);

    // Build conversion event
    const conversion = ConversionEvents[event]?.(data);
    if (!conversion) {
      return Response.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Check if user has consented
    const hasConsent = request.cookies.get('cookie_consent')?.value === 'yes';
    
    if (!hasConsent && !userId) {
      // Queue conversion for later
      await AttributionStore.queueConversion(sessionId, conversion);
      return Response.json({ 
        status: 'queued',
        message: 'Conversion queued pending consent' 
      });
    }

    // Send to Inngest for processing
    await inngest.send({
      name: 'conversion/track',
      data: {
        conversion,
        attribution,
        userId: userId || sessionId
      }
    });

    return Response.json({ 
      status: 'tracked',
      eventId: conversion.transaction_id 
    });

  } catch (error) {
    console.error('Tracking error:', error);
    return Response.json({ error: 'Tracking failed' }, { status: 500 });
  }
}

// ===================================
// app/api/webhooks/stripe/route.js - Stripe webhook handler
// ===================================
import { stripe } from '@/lib/stripe';
import { inngest } from '@/inngest/client';
import { AttributionStore } from '@/lib/attribution-store';

export async function POST(request) {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { userId, sessionId } = paymentIntent.metadata;

      // Get attribution
      const attribution = await AttributionStore.getAttribution(
        userId || sessionId
      );

      // Track donation conversion
      await inngest.send({
        name: 'conversion/track',
        data: {
          conversion: {
            event_name: 'Purchase',
            event_type: 'donation',
            value: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            transaction_id: paymentIntent.id,
            user_data: {
              email: paymentIntent.receipt_email,
              // Add other customer data from metadata
            }
          },
          attribution,
          userId: userId || sessionId
        }
      });
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: 'Webhook failed' }, { status: 400 });
  }
}

// ===================================
// lib/helpers.js - Utility functions
// ===================================
export function hashEmail(email) {
  return crypto
    .createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex');
}

export function hashPhone(phone) {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  return crypto
    .createHash('sha256')
    .update(cleaned)
    .digest('hex');
}

export function getGoogleConversionAction(eventType) {
  const mapping = {
    donation: process.env.GOOGLE_ADS_DONATION_CONVERSION_ID,
    newsletter: process.env.GOOGLE_ADS_LEAD_CONVERSION_ID,
    film_watch: process.env.GOOGLE_ADS_ENGAGEMENT_CONVERSION_ID
  };
  return mapping[eventType] || process.env.GOOGLE_ADS_DEFAULT_CONVERSION_ID;
}

// ===================================
// Usage Example - Client-side tracking
// ===================================
// In your React component:
async function trackNewsletterSignup(email) {
  await fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'newsletter_signup',
      data: { email },
      sessionId: getSessionId(), // From your session management
      userId: user?.id // If logged in
    })
  });
}

// Track film engagement
async function trackFilmWatch(watchData) {
  await fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'film_watch',
      data: {
        filmTitle: watchData.title,
        watchTime: watchData.currentTime,
        totalDuration: watchData.duration,
        interactions: watchData.interactions,
        shared: watchData.shared
      },
      sessionId: getSessionId(),
      userId: user?.id
    })
  });
}
```