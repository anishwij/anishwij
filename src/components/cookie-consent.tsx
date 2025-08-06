'use client'

import { updateConsent } from '@/services/gtm'
import { useEffect, useState } from 'react'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const handleAccept = () => {
    const consentState = {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      personalization_storage: 'granted',
      analytics_storage: 'granted',
    }

    updateConsent(consentState)
    localStorage.setItem('cookie-consent', 'granted')
    setShowBanner(false)
  }

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'denied')
    setShowBanner(false)

    window.dataLayer?.push({
      event: 'consent_update',
      consent_status: 'denied',
    })
  }

  if (!showBanner) return null

  return (
    <div className='fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 shadow-lg z-50 border-t'>
      <div className='max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4'>
        <p className='text-sm text-gray-600 dark:text-gray-300'>
          We use cookies to improve your experience and analyze site traffic. By clicking &ldquo;Accept All&rdquo;, you
          consent to our use of cookies.
        </p>
        <div className='flex gap-2'>
          <button
            onClick={handleReject}
            className='px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition'
          >
            Reject All
          </button>
          <button
            onClick={handleAccept}
            className='px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition'
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}
