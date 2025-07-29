```ts
// middleware.js - Detect user location
export function middleware(request) {
  const response = NextResponse.next();
  
  // Get country from Vercel's geo data
  const country = request.geo?.country || 'US';
  
  // EU countries list
  const EU_COUNTRIES = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'IS', 'LI', 'NO', 'CH'];
  
  const isEU = EU_COUNTRIES.includes(country);
  
  // Add header for client-side access
  response.headers.set('x-user-country', country);
  response.headers.set('x-is-eu', isEU ? 'true' : 'false');
  
  return response;
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};

// lib/consent.js - Consent utilities
export function getCookieConsent() {
  if (typeof window === 'undefined') return 'undecided';
  return localStorage.getItem('cookie_consent') || 'undecided';
}

export function isEUUser() {
  // Server-side: check headers
  if (typeof window === 'undefined') {
    return false; // Handle server-side differently
  }
  
  // Client-side: check cookie set by middleware
  const isEU = document.cookie
    .split('; ')
    .find(row => row.startsWith('is-eu='))
    ?.split('=')[1];
    
  return isEU === 'true';
}

// components/ConsentManager.js
'use client'
import { useEffect, useState } from 'react';
import { usePostHog } from 'posthog-js/react';
import { getCookieConsent, isEUUser } from '@/lib/consent';

// Google Consent Mode initialization
const initGoogleConsent = (consentState) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      'ad_storage': consentState === 'yes' ? 'granted' : 'denied',
      'analytics_storage': consentState === 'yes' ? 'granted' : 'denied',
      'ad_user_data': consentState === 'yes' ? 'granted' : 'denied',
      'ad_personalization': consentState === 'yes' ? 'granted' : 'denied'
    });
  }
};

export function ConsentManager({ children }) {
  const [consentGiven, setConsentGiven] = useState('');
  const [isEU, setIsEU] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const posthog = usePostHog();

  useEffect(() => {
    // Check if user is in EU
    const euStatus = isEUUser();
    setIsEU(euStatus);
    
    // Get current consent status
    const currentConsent = getCookieConsent();
    
    // Non-EU users get automatic consent
    if (!euStatus && currentConsent === 'undecided') {
      handleAcceptCookies(true); // Auto-consent
    } else {
      setConsentGiven(currentConsent);
      // Show banner only for EU users who haven't decided
      setShowBanner(euStatus && currentConsent === 'undecided');
    }
  }, []);

  useEffect(() => {
    // Update PostHog config
    if (consentGiven !== '') {
      posthog.set_config({ 
        persistence: consentGiven === 'yes' ? 'localStorage+cookie' : 'memory' 
      });
      
      // Update Google Consent Mode
      initGoogleConsent(consentGiven);
      
      // Load tracking scripts if consented
      if (consentGiven === 'yes') {
        loadTrackingScripts();
      }
    }
  }, [consentGiven, posthog]);

  const handleAcceptCookies = (isAutoConsent = false) => {
    localStorage.setItem('cookie_consent', 'yes');
    if (!isAutoConsent && isEU) {
      localStorage.setItem('cookie_consent_explicit', 'true');
    }
    setConsentGiven('yes');
    setShowBanner(false);
  };

  const handleDeclineCookies = () => {
    localStorage.setItem('cookie_consent', 'no');
    localStorage.setItem('cookie_consent_explicit', 'true');
    setConsentGiven('no');
    setShowBanner(false);
  };

  const loadTrackingScripts = () => {
    // Load Google Tag Manager
    if (!document.querySelector('#gtm-script')) {
      const script = document.createElement('script');
      script.id = 'gtm-script';
      script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
      script.async = true;
      document.head.appendChild(script);
      
      script.onload = () => {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function(){dataLayer.push(arguments);};
        window.gtag('js', new Date());
        window.gtag('config', process.env.NEXT_PUBLIC_GA_ID);
        
        // Re-initialize consent mode with current state
        initGoogleConsent(consentGiven);
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

  return (
    <>
      {children}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-sm text-gray-700 mr-4">
              We use cookies to improve your experience and show you relevant ads. 
              By accepting, you help us fund our mission.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDeclineCookies()}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Decline
              </button>
              <button
                onClick={() => handleAcceptCookies()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// lib/tracking.js - Helper functions for conversion tracking
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
  
  // Store in sessionStorage (doesn't require consent)
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

// app/layout.js - Update your root layout
import { ConsentManager } from '@/components/ConsentManager';
import { PostHogProvider } from '@/components/PostHogProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>
          <ConsentManager>
            {children}
          </ConsentManager>
        </PostHogProvider>
      </body>
    </html>
  );
}

// Default Google Consent Mode setup (add to document head)
const consentModeScript = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  
  // Default consent state (before user interaction)
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'analytics_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'wait_for_update': 500 // Wait 500ms for consent update
  });
`;
```