## MVP Core (Ship This First)

```javascript
// Session Data - Hash
// Key: sess:{sessionId}
{
  // Attribution
  utm_source: "facebook",
  utm_medium: "social", 
  utm_campaign: "indie_film_winter_2024",
  utm_content: "trailer_30s",
  first_touch_timestamp: 1704067200000,
  landing_page: "/watch",
  
  // Core Events
  content_viewed: "trailer_emotional_30s",
  donation_initiated: "true",
  donation_completed: "true",
  donation_amount: "25",
  
  // Meta Required
  fbclid: "IwAR1234...",
  country: "US",
  created_at: 1704067200000,
}

// Simple Events - List
// Key: events:sess:{sessionId}
[
  '{"event":"PageView","timestamp":1704067200000}',
  '{"event":"ViewContent","timestamp":1704067230000}',
  '{"event":"InitiateCheckout","timestamp":1704069000000}',
  '{"event":"Purchase","value":25,"timestamp":1704069120000}'
]
```

## Future Enhanced Version

```javascript
// Session Data - Hash  
// Key: sess:{sessionId}
{
  // Multi-touch Attribution
  utm_source: "facebook",
  utm_medium: "social",
  utm_campaign: "indie_film_winter_2024",
  utm_content: "trailer_30s",
  first_touch_source: "facebook",
  first_touch_timestamp: 1704067200000,
  last_touch_source: "email",
  last_touch_timestamp: 1704153600000,
  landing_page: "/watch",
  
  // Content Engagement
  trailer_watched: "true",
  trailer_completion: 95,
  intro_watched: "true",
  intro_completion: 100,
  total_watch_time: 1800, // seconds
  
  // Conversion Data
  checkout_type: "guest", 
  donation_amount: "25",
  time_to_conversion: 1920000,
  
  // Platform Links
  fbclid: "IwAR1234...",
  gclid: "Cj0KCQiA...", 
  posthog_distinct_id: "phc_abc123",
  user_id: null, // or actual ID if logged in
  
  // Metadata
  device_type: "mobile",
  browser: "Chrome",
  country: "US",
  city: "Los Angeles",
  referrer: "m.facebook.com",
  session_count: 2, // return visitor
  
  // Consent & Privacy
  consent_analytics: "pending",
  consent_marketing: "pending",
}

// Detailed Events - Sorted Set
// Key: events:sess:{sessionId}  
{
  1704067200000: '{"event":"PageView","utm_source":"facebook","page":"/watch"}',
  1704067230000: '{"event":"VideoStart","content":"trailer_emotional_30s"}',
  1704067680000: '{"event":"VideoProgress","content":"trailer_emotional_30s","percent":50}',
  1704068130000: '{"event":"VideoComplete","content":"trailer_emotional_30s","percent":95}',
  1704068200000: '{"event":"ButtonClick","element":"donate_cta_header"}',
  1704069000000: '{"event":"InitiateCheckout","value":25,"checkout_type":"guest"}',
  1704069050000: '{"event":"FormSubmit","step":"email_capture"}',
  1704069120000: '{"event":"Purchase","value":25,"payment_method":"card"}',
}
```
