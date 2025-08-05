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
  const response = NextResponse.next()
  const utmData: UtmData = {}
  let activeSessionId = cookies.get('sessionId')?.value
  const isNewSession = !activeSessionId

  const geolocationData = {
    country: headers.get('x-vercel-ip-country') || 'DEV',
    city: headers.get('x-vercel-ip-city') || 'DEV',
  }

  if (isNewSession) {
    activeSessionId = createId()
  }

  utmParams.forEach((param) => {
    const value = searchParams.get(param)
    if (value) {
      utmData[param] = value
    }
  })

  if (activeSessionId) {
    await redis.hset(activeSessionId, {
      utm_source: utmData.utm_source,
      utm_campagin: utmData.utm_campaign,
      utm_content: utmData.utm_content,
      utm_medium: utmData.utm_medium,
      utm_term: utmData.utm_term,
      country: geolocationData.country,
      city: geolocationData.city,
      landing_page: pathname,
      user_agent: headers.get('user-agent'),
      ip_address: null,
      fbclid: null,
      gcclid: null,
      first_touch_timestamp: Date.now(),
      created_at: Date.now(),
    })
  }

  if (isNewSession && activeSessionId) {
    response.cookies.set('sessionId', activeSessionId, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}
