import Script from 'next/script'

export function ConsentModeInit() {
  return (
    <Script id='consent-mode-init' strategy='beforeInteractive'>
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        
        const savedConsent = localStorage.getItem('cookie-consent');
        
        if (savedConsent === 'granted') {
          gtag('consent', 'default', {
            'ad_storage': 'granted',
            'ad_user_data': 'granted',
            'ad_personalization': 'granted',
            'personalization_storage': 'granted',
            'analytics_storage': 'granted',
            'functionality_storage': 'granted',
            'security_storage': 'granted'
          });
        } else {
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
        }
      `}
    </Script>
  )
}

export function updateConsent(consentState: Record<string, string>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', consentState)
    window.dataLayer?.push({
      event: 'consent_update',
      consent_status: consentState.ad_storage === 'granted' ? 'granted' : 'denied',
    })
  }
}
