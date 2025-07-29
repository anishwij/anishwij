```ts
// middleware.js - Simple geolocation detection using Vercel
import { NextResponse } from 'next/server';
import { geolocation } from '@vercel/functions';

export function middleware(request) {
  const geo = geolocation(request);
  
  // EU countries + UK, Norway, Iceland, Liechtenstein, Switzerland (GDPR scope)
  const EU_COUNTRIES = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'IS', 'LI', 
    'NO', 'CH'
  ];
  
  const country = geo?.country || 'US';
  const isEU = EU_COUNTRIES.includes(country);
  
  const response = NextResponse.next();
  
  // Set a simple cookie for client-side region detection
  response.cookies.set('user-region', isEU ? 'EU' : 'OTHER', {
    httpOnly: false,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

// ===================================
// components/CookieConsentBanner.js
// ===================================
'use client'
import { useEffect, useState } from 'react';
import { usePostHog } from 'posthog-js/react';

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const posthog = usePostHog();

  useEffect(() => {
    // Check if user is in EU from cookie
    const isEU = document.cookie
      .split('; ')
      .find(row => row.startsWith('user-region='))
      ?.split('=')[1] === 'EU';
    
    // Check existing consent
    const consent = localStorage.getItem('cookie_consent');
    
    if (!isEU && !consent) {
      // Auto-consent non-EU users
      handleAutoConsent();
    } else if (isEU && !consent) {
      // Show banner for EU users
      setShowBanner(true);
    } else if (consent === 'yes') {
      // Already consented - load scripts
      loadMarketingScripts();
    }
  }, []);

  const handleAutoConsent = () => {
    localStorage.setItem('cookie_consent', 'yes');
    localStorage.setItem('consent_type', 'auto');
    posthog.set_config({ persistence: 'localStorage+cookie' });
    loadMarketingScripts();
  };

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'yes');
    localStorage.setItem('consent_type', 'explicit');
    posthog.set_config({ persistence: 'localStorage+cookie' });
    setShowBanner(false);
    loadMarketingScripts();
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'no');
    localStorage.setItem('consent_type', 'explicit');
    posthog.set_config({ persistence: 'memory' });
    setShowBanner(false);
  };

  const loadMarketingScripts = () => {
    // Initialize Google Consent Mode v2
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { dataLayer.push(arguments); };
    
    // Update consent to granted
    window.gtag('consent', 'update', {
      'ad_storage': 'granted',
      'analytics_storage': 'granted',
      'ad_user_data': 'granted',
      'ad_personalization': 'granted'
    });
    
    // Load Google Tag
    if (!document.getElementById('gtag-script') && process.env.NEXT_PUBLIC_GOOGLE_ADS_ID) {
      const script = document.createElement('script');
      script.id = 'gtag-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}`;
      document.head.appendChild(script);
      
      script.onload = () => {
        window.gtag('js', new Date());
        window.gtag('config', process.env.NEXT_PUBLIC_GOOGLE_ADS_ID);
      };
    }
    
    // Load Facebook Pixel
    if (!window.fbq && process.env.NEXT_PUBLIC_FB_PIXEL_ID) {
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      
      window.fbq('init', process.env.NEXT_PUBLIC_FB_PIXEL_ID);
      window.fbq('track', 'PageView');
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <p className="text-sm">
          We use cookies to understand how you use our site and to improve your experience. 
          This includes analytics and personalizing content. By continuing to use our site, 
          you accept our use of cookies.
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================================
// app/layout.js - Add this to your root layout
// ===================================
import { PostHogProvider } from './providers';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google Consent Mode Default State - MUST be first */}
        <Script
          id="google-consent-default"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              
              // Default consent state (denied for EU compliance)
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'analytics_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'wait_for_update': 500
              });
            `,
          }}
        />
      </head>
      <body>
        <PostHogProvider>
          {children}
          <CookieConsentBanner />
        </PostHogProvider>
      </body>
    </html>
  );
}

// ===================================
// lib/click-tracking.js - Capture and store click IDs
// ===================================
export function captureClickIds() {
  if (typeof window === 'undefined') return {};
  
  const urlParams = new URLSearchParams(window.location.search);
  const clickIds = {
    gclid: urlParams.get('gclid'),
    fbclid: urlParams.get('fbclid'),
    utm_source: urlParams.get('utm_source'),
    utm_medium: urlParams.get('utm_medium'),
    utm_campaign: urlParams.get('utm_campaign')
  };
  
  // Store in sessionStorage (no consent needed)
  if (clickIds.gclid || clickIds.fbclid) {
    sessionStorage.setItem('click_ids', JSON.stringify(clickIds));
  }
  
  return clickIds;
}

export function getStoredClickIds() {
  if (typeof window === 'undefined') return {};
  
  try {
    return JSON.parse(sessionStorage.getItem('click_ids') || '{}');
  } catch {
    return {};
  }
}

// ===================================
// Updated PostHogProvider.js - Consent aware
// ===================================
'use client'
import { env } from '@/lib/env.client'
import posthog from 'posthog-js'
import { PostHogProvider as PostHogProviderImpl } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }) {
  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    
    posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: 'https://us.i.posthog.com',
      defaults: '2025-05-24',
      // Use memory if no consent yet
      persistence: consent === 'yes' ? 'localStorage+cookie' : 'memory',
      loaded: (posthog) => {
        // Capture click IDs on load
        const clickIds = captureClickIds();
        if (Object.keys(clickIds).length > 0) {
          posthog.capture('campaign_landing', clickIds);
        }
      }
    })
  }, [])
  
  return <PostHogProviderImpl client={posthog}>{children}</PostHogProviderImpl>
}

// ===================================
// api/conversion.js - Server-side conversion tracking
// ===================================
export async function POST(request) {
  const { event, value, currency, clickIds } = await request.json();
  
  // Send to Google Ads Conversion API
  if (clickIds.gclid && process.env.GOOGLE_ADS_CONVERSION_ID) {
    await fetch('https://googleads.googleapis.com/v14/conversions:upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GOOGLE_ADS_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversions: [{
          gclid: clickIds.gclid,
          conversion_action: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/conversionActions/${process.env.GOOGLE_ADS_CONVERSION_ID}`,
          conversion_date_time: new Date().toISOString(),
          conversion_value: value,
          currency_code: currency
        }]
      })
    });
  }
  
  // Send to Meta Conversions API
  if (clickIds.fbclid && process.env.META_PIXEL_ID) {
    await fetch(`https://graph.facebook.com/v18.0/${process.env.META_PIXEL_ID}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [{
          event_name: event,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: request.headers.get('referer'),
          user_data: {
            fbp: clickIds.fbclid,
            client_ip_address: request.headers.get('x-forwarded-for'),
            client_user_agent: request.headers.get('user-agent')
          },
          custom_data: {
            value: value,
            currency: currency
          }
        }],
        access_token: process.env.META_ACCESS_TOKEN
      })
    });
  }
  
  return Response.json({ success: true });
}

// ===================================
// ENVIRONMENT VARIABLES (.env.local)
// ===================================
// NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxx
// NEXT_PUBLIC_GOOGLE_ADS_ID=AW-XXXXXXXXX
// NEXT_PUBLIC_FB_PIXEL_ID=XXXXXXXXXXXXXXX
// 
// # Server-side only
// GOOGLE_ADS_API_TOKEN=xxxxx
// GOOGLE_ADS_CUSTOMER_ID=xxxxx
// GOOGLE_ADS_CONVERSION_ID=xxxxx
// META_ACCESS_TOKEN=xxxxx
// META_PIXEL_ID=xxxxx
```