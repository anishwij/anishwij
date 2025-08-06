import Script from 'next/script'

const gtmId = process.env.NEXT_PUBLIC_GTM_ID

export function GoogleTagManager() {
  return (
    <>
      <Script id='gtm-script' strategy='afterInteractive'>
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `}
      </Script>
    </>
  )
}

export function GoogleTagManagerNoScript() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height='0'
        width='0'
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  )
}

export function ConsentModeInit() {
  return (
    <Script id='consent-mode-init' strategy='beforeInteractive'>
      {`
        window.dataLayer = window.dataLayer || [];
        
        function gtag(){
          window.dataLayer.push(arguments);
        }
        window.gtag = gtag;
        
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
      `}
    </Script>
  )
}
