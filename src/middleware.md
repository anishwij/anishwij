Old middleware

```js
import { env } from '@/lib/env.server'
import { redis } from '@/lib/redis.server'
import { nanoid } from 'nanoid'
import { NextResponse, type NextRequest } from 'next/server'

const createId = () => `sess:${nanoid(21)}`

const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const

type UtmData = Partial<Record<(typeof utmParams)[number], string>>

export async function middleware(request: NextRequest) {
  const {
    nextUrl: { pathname, searchParams },
    headers,
    cookies,
  } = request
  let activeSessionId = cookies.get('sessionId')?.value
  const isNewSession = !activeSessionId
  const hasUtmData = utmParams.some(param => searchParams.has(param))

  const geolocationData = {
    country: headers.get('x-vercel-ip-country') || 'DEV',
    city: headers.get('x-vercel-ip-city') || 'DEV',
  }

  if (isNewSession) {
    activeSessionId = createId()
  }

  const utmData: UtmData = {}
  utmParams.forEach((param) => {
    const value = searchParams.get(param)
    if (value) {
      utmData[param] = value
    }
  })

  if (activeSessionId && (isNewSession || hasUtmData)) {
    const now = new Date().toISOString()
    const sessionData: Record<string, string | null> = {
      country: geolocationData.country,
      city: geolocationData.city,
      landing_page: pathname,
      user_agent: headers.get('user-agent'),
      ip_address: null,
      fbclid: null,
      gcclid: null,
    }

    if (Object.keys(utmData).length > 0) {
      sessionData.utm_source = utmData.utm_source || null
      sessionData.utm_campaign = utmData.utm_campaign || null
      sessionData.utm_content = utmData.utm_content || null
      sessionData.utm_medium = utmData.utm_medium || null
      sessionData.utm_term = utmData.utm_term || null
    }

    if (isNewSession) {
      sessionData.first_touch_timestamp = now
      sessionData.created_at = now
    }

    await redis.hset(activeSessionId, sessionData)
  }

  if (isNewSession && activeSessionId) {
    const response = NextResponse.next()
    response.cookies.set('sessionId', activeSessionId, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    
    if (hasUtmData) {
      const cleanUrl = new URL(request.url)
      utmParams.forEach(param => cleanUrl.searchParams.delete(param))
      return NextResponse.redirect(cleanUrl)
    }
    
    return response
  }

  if (hasUtmData) {
    const cleanUrl = new URL(request.url)
    utmParams.forEach(param => cleanUrl.searchParams.delete(param))
    return NextResponse.redirect(cleanUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}

```