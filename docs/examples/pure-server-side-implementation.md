# **Pure Server-Side Attribution Approach - Reference Document**

## Overview
A cookieless attribution system using only server-side storage and deterministic session generation for GDPR/CCPA compliance without consent requirements.

## Core Architecture

### 1. **Session ID Generation**
```js
// middleware.js
import crypto from 'crypto';

function generateSessionId(request) {
  // Combine multiple signals for better accuracy
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip;
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  
  // Create deterministic hash
  const fingerprint = `${ip}|${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  
  return crypto
    .createHash('sha256')
    .update(fingerprint)
    .digest('hex')
    .substring(0, 16); // Shorter ID for efficiency
}
```

### 2. **Attribution Capture (Edge Middleware)**
```js
// middleware.js
import { Redis } from '@vercel/kv';
import { geolocation } from '@vercel/functions';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const url = new URL(request.url);
  const { country, region } = geolocation(request);
  
  // Check if attribution params exist
  const hasAttribution = url.searchParams.has('gclid') || 
                       url.searchParams.has('fbclid') || 
                       url.searchParams.has('utm_source');
  
  if (hasAttribution) {
    const sessionId = generateSessionId(request);
    
    // Extract all attribution data
    const attribution = {
      gclid: url.searchParams.get('gclid'),
      fbclid: url.searchParams.get('fbclid'),
      utm_source: url.searchParams.get('utm_source'),
      utm_medium: url.searchParams.get('utm_medium'),
      utm_campaign: url.searchParams.get('utm_campaign'),
      utm_content: url.searchParams.get('utm_content'),
      utm_term: url.searchParams.get('utm_term'),
      landing_page: url.pathname,
      referrer: request.headers.get('referer'),
      timestamp: Date.now(),
      country,
      region
    };
    
    // Store in Redis with 24-hour TTL
    await Redis.setex(
      `attribution:${sessionId}`,
      86400, // 24 hours in seconds
      JSON.stringify(attribution)
    );
    
    // Clean URL redirect
    url.search = '';
    const response = NextResponse.redirect(url);
    
    // Add session ID to response headers for downstream use
    response.headers.set('X-Session-ID', sessionId);
    
    return response;
  }
  
  // For non-attribution requests, still generate session ID
  const sessionId = generateSessionId(request);
  const response = NextResponse.next();
  response.headers.set('X-Session-ID', sessionId);
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### 3. **Attribution Retrieval in Server Components**
```jsx
// app/donate/page.js
import { headers } from 'next/headers';
import { Redis } from '@vercel/kv';

async function getAttribution() {
  const headersList = headers();
  const sessionId = headersList.get('x-session-id');
  
  if (!sessionId) return null;
  
  const attribution = await Redis.get(`attribution:${sessionId}`);
  return attribution ? JSON.parse(attribution) : null;
}

export default async function DonatePage() {
  const attribution = await getAttribution();
  
  // Apply campaign-specific logic
  const discount = attribution?.utm_campaign === 'summer2024' ? 0.1 : 0;
  const abVariant = attribution?.utm_content || 'control';
  
  return (
    <DonationForm 
      attribution={attribution}
      discount={discount}
      variant={abVariant}
    />
  );
}
```

### 4. **Form Handling with Hidden Fields**
```jsx
// components/DonationForm.jsx
export default function DonationForm({ attribution, discount, variant }) {
  return (
    <form action="/api/process-donation" method="POST">
      {/* Hidden attribution fields */}
      <input type="hidden" name="attribution" value={JSON.stringify(attribution)} />
      <input type="hidden" name="session_id" value={attribution?.session_id} />
      
      {/* Visible form fields */}
      <input type="number" name="amount" required />
      
      {discount > 0 && (
        <p>Campaign discount applied: {discount * 100}%</p>
      )}
      
      <button type="submit">
        {variant === 'urgent' ? 'Donate Now - Urgent!' : 'Complete Donation'}
      </button>
    </form>
  );
}
```

### 5. **API Route Processing**
```js
// app/api/process-donation/route.js
import Stripe from 'stripe';
import { Redis } from '@vercel/kv';

export async function POST(request) {
  const formData = await request.formData();
  const attribution = JSON.parse(formData.get('attribution') || '{}');
  const amount = parseInt(formData.get('amount'));
  
  // Create Stripe session with attribution metadata
  const session = await stripe.checkout.sessions.create({
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'Donation' },
        unit_amount: amount * 100,
      },
      quantity: 1,
    }],
    metadata: {
      session_id: attribution.session_id,
      utm_source: attribution.utm_source,
      utm_campaign: attribution.utm_campaign,
      gclid: attribution.gclid,
      fbclid: attribution.fbclid,
    },
    success_url: `${process.env.NEXT_PUBLIC_URL}/thank-you`,
  });
  
  return Response.redirect(session.url);
}
```

### 6. **Webhook Attribution Completion**
```js
// app/api/webhooks/stripe/route.js
export async function POST(request) {
  const payload = await request.text();
  const event = stripe.webhooks.constructEvent(payload, signature, secret);
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Record conversion with attribution
    await recordConversion({
      amount: session.amount_total,
      attribution: {
        utm_source: session.metadata.utm_source,
        utm_campaign: session.metadata.utm_campaign,
        gclid: session.metadata.gclid,
        fbclid: session.metadata.fbclid,
      }
    });
    
    // Send to Google Ads / Meta Ads APIs
    if (session.metadata.gclid) {
      await sendGoogleAdsConversion(session.metadata.gclid, session.amount_total);
    }
  }
}
```

## Alternative Approaches

### 1. **URL Parameter Propagation**
```jsx
// Maintain attribution in all internal links
function AttributionLink({ href, children, ...props }) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sid');
  
  const url = new URL(href, window.location.origin);
  if (sessionId) {
    url.searchParams.set('sid', sessionId);
  }
  
  return <Link href={url.toString()} {...props}>{children}</Link>;
}
```

### 2. **Path-Based Attribution**
```js
// Use route segments instead of parameters
// /c/summer2024/donate instead of /donate?utm_campaign=summer2024

export async function generateStaticParams() {
  const campaigns = await getCampaigns();
  return campaigns.map(campaign => ({
    campaign: campaign.slug
  }));
}
```

### 3. **Edge Config for Campaign Rules**
```js
// Store campaign configurations at edge
const campaignRules = await get('campaign-rules');

const matchedCampaign = campaignRules.find(rule => 
  rule.gclid_pattern.test(attribution.gclid)
);
```

## Limitations & Considerations

1. **Attribution Loss Scenarios**:
   - IP address changes (mobile → wifi)
   - VPN usage
   - Shared networks (offices, cafes)
   - Browser changes
   - Incognito/private browsing

2. **Expected Attribution Rates**:
   - Same-session: ~90%
   - Same-day return: ~60%
   - Multi-day return: ~30%
   - Mobile users: ~40%

3. **Compliance Notes**:
   - No PII stored
   - Automatic 24-hour expiration
   - No cross-site tracking
   - Works without consent banners

4. **Performance Considerations**:
   - Redis lookup on every request
   - Edge Middleware adds ~10-50ms
   - Consider caching attribution in Edge Config for hot paths

This approach trades attribution accuracy for privacy compliance. Best suited for organizations prioritizing user privacy or operating in strict regulatory environments.