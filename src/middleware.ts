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

  const geolocationData = {
    country: headers.get('x-vercel-ip-country') || 'DEV',
    city: headers.get('x-vercel-ip-city') || 'DEV',
  }

  if (!activeSessionId) {
    activeSessionId = createId()
  }

  utmParams.forEach((param) => {
    const value = searchParams.get(param)
    if (value) {
      utmData[param] = value
    }
  })

  await redis.hset(activeSessionId, {
    ...utmData,
    ...geolocationData,
    pathname: pathname,
    userAgent: headers.get('user-agent'),
    timestamp: Date.now(),
  })

  if (!activeSessionId) {
    response.cookies.set('sessionId', activeSessionId, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 1, // 24 hours
    })
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}
