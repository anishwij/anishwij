'use client'

// import { cookieConsentGiven } from '@/components/cookie-banner'
import { env } from '@/lib/env.client'
import posthog from 'posthog-js'
import { PostHogProvider as PostHogProviderImpl } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: 'https://us.i.posthog.com',
      defaults: '2025-05-24',
      // persistence: cookieConsentGiven() === 'yes' ? 'localStorage+cookie' : 'memory',
      persistence: 'memory',
      disable_cookie: true,
      disable_persistence: true,
    })
  }, [])

  return <PostHogProviderImpl client={posthog}>{children}</PostHogProviderImpl>
}
