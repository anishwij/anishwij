import { redis } from '@/lib/redis.server'
import { nanoid } from 'nanoid'
import { NextResponse, type NextRequest } from 'next/server'

const createId = () => `sess:${nanoid(21)}`

export async function middleware(request: NextRequest) {
  // Log all cookies to see what PostHog is setting
  console.log('All cookies:', request.cookies.getAll())
  
  let sessionId = request.cookies.get('sessionId')?.value
  const pipeline = redis.pipeline()

  if (!sessionId) {
    sessionId = createId()
  }

  pipeline.hset(sessionId, {
    value: 'test',
  })

  await pipeline.exec()

  const response = NextResponse.next()

  if (!request.cookies.get('sessionId')) {
    response.cookies.set('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}

/*

export async function middleware(request: NextRequest) {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get('sessionId')?.value

  if (!sessionId) {
    sessionId = createId()
  }

  const pipeline = redis.pipeline()

  pipeline.hset(sessionId, {
    value: 'test',
  })

  // await pipeline.exec()

  const response = NextResponse.next()

  if (!cookieStore.get('sessionId')) {
    response.cookies.set('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
  }

  return response
}


*/
