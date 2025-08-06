import Script from 'next/script'

export function ConsentModeInit() {
  return (
    <Script id='consent-mode-init' strategy='beforeInteractive'>
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        
        // Check for saved consent BEFORE setting defaults
        const savedConsent = localStorage.getItem('cookie-consent');
        
        if (savedConsent === 'granted') {
          // User already consented - set as granted
          gtag('consent', 'default', {
            'ad_storage': 'granted',
            'ad_user_data': 'granted',
            'ad_personalization': 'granted',
            'personalization_storage': 'granted',
            'analytics_storage': 'granted',
            'functionality_storage': 'granted',
            'security_storage': 'granted'
          });
          console.log('Consent Mode initialized with saved: granted');
        } else {
          // No consent or denied - set as denied
          gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'personalization_storage': 'denied',
            'analytics_storage': 'denied',
            'functionality_storage': 'granted',
            'security_storage': 'granted',
            'wait_for_update': 2000
          });
          console.log('Consent Mode initialized with default: denied');
        }
      `}
    </Script>
  )
}

export function updateConsent(consentState: Record<string, string>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', consentState)

    // Also push the event for GTM
    window.dataLayer?.push({
      event: 'consent_update',
      consent_status: consentState.ad_storage === 'granted' ? 'granted' : 'denied',
    })
  }
}
