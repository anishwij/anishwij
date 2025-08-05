# Attribution Event Journey Map

## User Journey → Function Calls Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER JOURNEY TRACKING MAP                          │
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
