import { geolocation } from '@vercel/functions'
import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const geo = geolocation(request)
  console.log('=== Geolocation Information ===')
  console.log('City:', geo.city || 'Not available')
  console.log('Country:', geo.country || 'Not available')
  console.log('Region:', geo.region || 'Not available')
  console.log('Latitude:', geo.latitude || 'Not available')
  console.log('Longitude:', geo.longitude || 'Not available')
  console.log('==============================')

  // Also log the raw headers if you want to see them
  console.log('Raw Headers:')
  console.log('X-Vercel-IP-Country:', request.headers.get('X-Vercel-IP-Country'))
  console.log('X-Vercel-IP-Country-Region:', request.headers.get('X-Vercel-IP-Country-Region'))
  console.log('X-Vercel-IP-City:', request.headers.get('X-Vercel-IP-City'))

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
