# Cookieless Marketing Attribution - Core Functions & Flow

## Redis Helper Functions

```javascript
// Core Redis operations for session management
async function createSession(sessionId, utmData, metadata) {
  // Creates new session with attribution data
  // Sets TTL to 7 days
}

async function updateSessionEvent(sessionId, eventData) {
  // Adds event to session's event list
  // Updates last_touch timestamp
}

async function getSession(sessionId) {
  // Retrieves full session data
  // Returns null if expired/not found
}

async function markSessionConverted(sessionId, conversionData) {
  // Updates session with donation data
  // Sets conversion flags
}

async function extendSessionTTL(sessionId) {
  // Extends session by another 7 days
  // Used when user returns
}

async function getSessionEvents(sessionId) {
  // Returns chronological event list
  // For building user journey
}
```

## Integration Functions

### Meta Conversions API (Server-Side Only)
```javascript
async function sendMetaEvent(eventName, sessionData, eventParams = {}) {
  // Sends event to Meta CAPI
  // No pixel required - fully server-side
  // Includes: event_name, event_time, action_source, user_data, custom_data
}

async function prepareMetaUserData(session) {
  // Formats user data for Meta (country, city, fbclid)
  // Hashes any PII if available
}

async function sendMetaPurchase(sessionId, amount, currency = 'USD') {
  // Specialized function for purchase events
  // Includes value optimization data
}
```

### PostHog Events
```javascript
async function capturePostHogEvent(sessionId, eventName, properties) {
  // Server-side event capture
  // No cookies, uses sessionId as distinct_id
}

async function sendPostHogPageView(sessionId, pathname, utmData) {
  // Tracks page views with attribution
}

async function sendPostHogConversion(sessionId, donationData) {
  // Tracks successful donations
  // Links to campaign data
}
```

### Stripe Integration
```javascript
async function createStripeCheckout(sessionId, amount, metadata) {
  // Creates checkout session
  // Passes sessionId in metadata
  // Includes success_url with session param
}

async function handleStripeWebhook(event) {
  // Processes checkout.session.completed
  // Extracts sessionId from metadata
  // Triggers attribution flow
}

async function reconcileAttribution(sessionId, stripeData) {
  // Main attribution function
  // Updates Redis, sends to Meta & PostHog
  // Completes the attribution cycle
}
```

## System Flow Sequence Diagram

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │     │ Next.js │     │  Redis  │     │  Meta   │     │PostHog  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │               │
     │ 1. Land with UTMs             │               │               │
     ├──────────────>│               │               │               │
     │               │               │               │               │
     │               │ 2. Create Session             │               │
     │               ├──────────────>│               │               │
     │               │               │               │               │
     │               │ 3. Send PageView              │               │
     │               ├───────────────────────────────>               │
     │               ├───────────────────────────────────────────────>
     │               │               │               │               │
     │ 4. View Content               │               │               │
     ├──────────────>│               │               │               │
     │               │ 5. Update Session             │               │
     │               ├──────────────>│               │               │
     │               │               │               │               │
     │               │ 6. Send ViewContent           │               │
     │               ├───────────────────────────────>               │
     │               ├───────────────────────────────────────────────>
     │               │               │               │               │
     │ 7. Click Donate               │               │               │
     ├──────────────>│               │               │               │
     │               │               │               │               │
     │               │ 8. Create Stripe Checkout     │               │
     │<──────────────┤   (with sessionId metadata)   │               │
     │               │               │               │               │
     │ 9. Redirect to Stripe         │               │               │
     ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ >  │
     │                                                               │
     │                    ┌────────────┐                             │
     │                    │   Stripe   │                             │
     │                    └─────┬──────┘                             │
     │                          │                                    │
     │                          │ 10. Webhook (success)              │
     │               ┌──────────┤                                    │
     │               │          │                                    │
     │               │ 11. Extract sessionId                         │
     │               │      Get Session Data                         │
     │               ├──────────────>│                               │
     │               │               │                               │
     │               │ 12. Mark Converted                            │
     │               ├──────────────>│                               │
     │               │               │                               │
     │               │ 13. Send Purchase Event                       │
     │               ├───────────────────────────────>               │
     │               │   (with value data)           │               │
     │               │               │               │               │
     │               │ 14. Send Conversion                           │
     │               ├───────────────────────────────────────────────>
     │               │               │               │               │
     │               │               │               │               │
     │ 15. Success Page              │               │               │
     │<──────────────┤               │               │               │
     │               │               │               │               │
```

## Key Implementation Notes

1. **No Client-Side Tracking**: All Meta events sent server-side via Conversions API
2. **Session Continuity**: SessionId passed through Stripe metadata and retrieved in webhook
3. **Attribution Window**: 7-day Redis TTL with option to extend on return visits
4. **Event Deduplication**: Use event_id in Meta CAPI to prevent duplicates
5. **Privacy First**: No PII stored in Redis, only sessionId and behavioral data

## Meta CAPI Event Structure Example

```javascript
{
  event_name: "Purchase",
  event_time: Math.floor(Date.now() / 1000),
  action_source: "website",
  event_source_url: "https://yoursite.com/donate",
  user_data: {
    client_ip_address: req.ip,
    client_user_agent: req.headers['user-agent'],
    fbc: session.fbclid, // if available
    country: session.country,
    city: session.city
  },
  custom_data: {
    currency: "USD",
    value: 25.00,
    content_name: "Film Donation",
    content_category: "Donation",
    content_ids: [session.content_viewed],
    contents: [{
      id: session.content_viewed,
      quantity: 1,
      item_price: 25.00
    }]
  },
  event_id: `${sessionId}_purchase_${timestamp}` // Deduplication
}
```

## Next Steps

1. Implement Redis helpers with proper error handling
2. Set up Meta CAPI credentials and test endpoint
3. Configure Stripe webhook endpoint
4. Add Inngest for retry logic on failed API calls
5. Test full flow with different attribution scenarios