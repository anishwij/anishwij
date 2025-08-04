# Attribution Event Journey Map

## User Journey → Function Calls Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER JOURNEY TRACKING MAP                           │
└─────────────────────────────────────────────────────────────────────────────┘

USER ACTION                 FUNCTION CALLED              SYSTEMS UPDATED
───────────                 ───────────────              ───────────────

1️⃣ LANDS ON SITE (with UTMs)
│
├─→ middleware.ts ──────────→ createSession() ──────────→ ✓ Redis (session created)
│                                                        ✓ Redis (events list)
│
└─→ page.tsx ───────────────→ trackPageView() ─────────→ ✓ Redis (event)
                                    │                     ✓ Meta (PageView)
                                    │                     ✓ PostHog ($pageview)
                                    │
                                    ├── updateSessionEvent()
                                    ├── sendMetaPageView()
                                    └── sendPostHogPageView()


2️⃣ VIEWS FILM/TRAILER PAGE
│
└─→ onClick/onLoad ─────────→ trackContentView() ──────→ ✓ Redis (content_viewed)
                                    │                     ✓ Meta (ViewContent)
                                    │                     ✓ PostHog (Content Viewed)
                                    │
                                    ├── updateSessionEvent()
                                    ├── sendMetaViewContent()
                                    └── capturePostHogEvent()


3️⃣ WATCHES VIDEO (at 25%, 50%, 75%, 95%)
│
└─→ onProgress ─────────────→ trackVideoProgress() ────→ ✓ Redis (video progress)
                                    │                     ✓ PostHog (milestones only)
                                    │
                                    ├── updateSessionEvent()
                                    └── capturePostHogEvent() [only at milestones]


4️⃣ CLICKS DONATE BUTTON
│
└─→ onClick ────────────────→ createDonationCheckout() → ✓ Redis (checkout initiated)
                                    │                     ✓ Meta (InitiateCheckout)
                                    │                     ✓ PostHog (Checkout Started)
                                    │                     ✓ Stripe (session created)
                                    │
                                    ├── updateSessionEvent()
                                    ├── sendMetaInitiateCheckout()
                                    ├── capturePostHogEvent()
                                    └── stripe.checkout.sessions.create()
                                             │
                                             └─→ REDIRECT TO STRIPE


5️⃣ COMPLETES PAYMENT (on Stripe)
│
└─→ Stripe Webhook ─────────→ handleStripeWebhook() ──→ ✓ Redis (marked converted)
                                    │                     ✓ Meta (Purchase + value!)
                                    │                     ✓ PostHog (Donation Completed)
                                    │
                                    ├── getSession()
                                    ├── markSessionConverted()
                                    ├── sendMetaPurchase()
                                    └── sendPostHogConversion()


6️⃣ LANDS ON THANK YOU PAGE
│
└─→ page.tsx ───────────────→ trackPageView() ─────────→ ✓ Redis (event)
                                                         ✓ Meta (PageView)
                                                         ✓ PostHog ($pageview)
```

## Event Trigger Reference

### 🟢 Automatic Triggers (No user action needed)
```
┌────────────────────────┬─────────────────────┬──────────────────────────┐
│ WHERE                  │ WHEN                │ WHAT FUNCTION            │
├────────────────────────┼─────────────────────┼──────────────────────────┤
│ middleware.ts          │ Every page load     │ createSession()          │
│ layout.tsx/page.tsx    │ Page component load │ trackPageView()          │
│ Stripe webhook route   │ Payment success     │ handleStripeWebhook()    │
└────────────────────────┴─────────────────────┴──────────────────────────┘
```

### 🔵 User Action Triggers
```
┌────────────────────────┬─────────────────────┬──────────────────────────┐
│ COMPONENT              │ USER ACTION         │ WHAT FUNCTION            │
├────────────────────────┼─────────────────────┼──────────────────────────┤
│ VideoPlayer            │ Starts video        │ trackContentView()       │
│ VideoPlayer            │ Reaches milestone   │ trackVideoProgress()     │
│ DonateButton           │ Clicks donate       │ createDonationCheckout() │
│ CampaignCard           │ Selects campaign    │ initializeCampaignSession()│
└────────────────────────┴─────────────────────┴──────────────────────────┘
```

## Implementation Examples

### Page Component
```javascript
// app/watch/page.tsx
export default async function WatchPage() {
  // Automatic on page load
  await trackPageView('/watch')
  
  return <VideoPlayer />
}
```

### Video Component
```javascript
// components/video-player.tsx
'use client'

export function VideoPlayer() {
  return (
    <video
      onPlay={async () => {
        'use server'
        await trackContentView('main_film', 'video')
      }}
      onTimeUpdate={async (e) => {
        const progress = (e.target.currentTime / e.target.duration) * 100
        if ([25, 50, 75, 95].includes(Math.floor(progress))) {
          'use server'
          await trackVideoProgress('main_film', Math.floor(progress))
        }
      }}
    />
  )
}
```

### Donation Flow
```javascript
// components/donate-section.tsx
export function DonateSection() {
  return (
    <button
      onClick={async () => {
        'use server'
        await createDonationCheckout(25)
        // This redirects to Stripe
      }}
    >
      Donate $25
    </button>
  )
}
```

### Stripe Webhook
```javascript
// app/api/stripe/webhook/route.js
export async function POST(request) {
  const sig = headers().get('stripe-signature')
  const event = stripe.webhooks.constructEvent(body, sig, secret)
  
  // Automatic on payment success
  if (event.type === 'checkout.session.completed') {
    await handleStripeWebhook(event)
  }
  
  return Response.json({ received: true })
}
```

## Critical Event Priorities for Meta

🔴 **MUST TRACK** (Required for campaign optimization)
1. **Purchase** - With value! This is what Meta optimizes for
2. **InitiateCheckout** - Critical for funnel optimization
3. **PageView** - Needed for retargeting

🟡 **SHOULD TRACK** (Improves optimization)
4. **ViewContent** - Helps Meta understand interest
5. **AddToCart** - If you have cart functionality

🟢 **NICE TO HAVE** (Additional insights)
6. Video progress events
7. Email signup
8. Other micro-conversions

## Data Flow Summary

```
User Action → Your Server Function → Three Destinations:
                    │
                    ├─→ Redis (Session state + events)
                    ├─→ Meta CAPI (Conversion optimization)
                    └─→ PostHog (Product analytics)
```

Remember: 
- **Redis** = Temporary state (7 days)
- **Meta** = Campaign optimization (needs value data!)
- **PostHog** = Long-term analytics (no cookies needed)