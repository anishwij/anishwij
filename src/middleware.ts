import { geolocation } from '@vercel/functions'
import { NextResponse, type NextRequest } from 'next/server'

function isConsentNeeded() {}

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

  // Add geolocation data to search params for home page visits
  if (request.nextUrl.pathname === '/' && !request.nextUrl.searchParams.has('geo_country')) {
    const url = request.nextUrl.clone()
    url.searchParams.set('geo_city', geo.city || 'null')
    url.searchParams.set('geo_country', geo.country || 'null')
    url.searchParams.set('geo_region', geo.region || 'null')
    url.searchParams.set('geo_lat', geo.latitude || 'null')
    url.searchParams.set('geo_lng', geo.longitude || 'null')

    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}
