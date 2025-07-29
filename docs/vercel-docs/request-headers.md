# Request headers

The following headers are sent to each Vercel deployment and can be used to process the request before sending back a response. These headers can be read from the [Request](https://nodejs.org/api/http.html#http_message_headers) object in your [Vercel Function](/docs/functions).

## [`host`](#host)

This header represents the domain name as it was accessed by the client. If the deployment has been assigned to a preview URL or production domain and the client visits the domain URL, it contains the custom domain instead of the underlying deployment URL.

## [`x-vercel-id`](#x-vercel-id)

This header contains a list of [Vercel regions](/docs/edge-network/regions) your request hit, as well as the region the function was executed in (for both Edge and Serverless).

It also allows Vercel to automatically prevent infinite loops.

Next.js (/app)Next.js (/pages)Other frameworks

```
export function GET(request: Request) {
  const host = request.headers.get('host');
  return new Response(`Host: ${host}`);
}
```

## [`x-forwarded-host`](#x-forwarded-host)

This header is identical to the `host` header.

Next.js (/app)Next.js (/pages)Other frameworks

```
export function GET(request: Request) {
  const host = request.headers.get('x-forwarded-host');
  return new Response(`Host: ${host}`);
}
```

## [`x-forwarded-proto`](#x-forwarded-proto)

This header represents the protocol of the forwarded server, typically `https` in production and `http`in development.

Next.js (/app)Next.js (/pages)Other frameworks

```
export function GET(request: Request) {
  const protocol = request.headers.get('x-forwarded-proto');
  return new Response(`Protocol: ${protocol}`);
}
```

## [`x-forwarded-for`](#x-forwarded-for)

The public IP address of the client that made the request.

If you are trying to use Vercel behind a proxy, we currently overwrite the [`X-Forwarded-For`](https://developer.mozilla.org/docs/Web/HTTP/Headers/X-Forwarded-For) header and do not forward external IPs. This restriction is in place to prevent IP spoofing.

Next.js (/app)Next.js (/pages)Other frameworks

```
export function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for');
  return new Response(`IP: ${ip}`);
}
```

### [Custom `X-Forwarded-For` IP](#custom-x-forwarded-for-ip)

Trusted Proxy is available on [Enterprise plans](/docs/plans/enterprise)

Enterprise customers can purchase and enable a trusted proxy to allow your custom `X-Forwarded-For` IP. [Contact us](/contact/sales) for more information.

## [`x-vercel-forwarded-for`](#x-vercel-forwarded-for)

This header is identical to the `x-forwarded-for` header. However, `x-forwarded-for` could be overwritten if you're using a proxy on top of Vercel.

## [`x-real-ip`](#x-real-ip)

This header is identical to the `x-forwarded-for` header.

## [`x-vercel-deployment-url`](#x-vercel-deployment-url)

This header represents the unique deployment, not the preview URL or production domain. For example, `*.vercel.app`.

Next.js (/app)Next.js (/pages)Other frameworks

```
export function GET(request: Request) {
  const deploymentUrl = request.headers.get('x-vercel-deployment-url');
  return new Response(`Deployment URL: ${deploymentUrl}`);
}
```

## [`x-vercel-ip-continent`](#x-vercel-ip-continent)

A two-character [ISO 3166-1](https://en.wikipedia.org/wiki/ISO_3166-1) code representing the continent associated with the location of the requester's public IP address. Codes used to identify continents are as follows:

*   `AF` for Africa
*   `AN` for Antarctica
*   `AS` for Asia
*   `EU` for Europe
*   `NA` for North America
*   `OC` for Oceania
*   `SA` for South America

Next.js (/app)Next.js (/pages)Other frameworks

```
export function GET(request: Request) {
  const continent = request.headers.get('x-vercel-ip-continent');
  return new Response(`Continent: ${continent}`);
}
```

## [`x-vercel-ip-country`](#x-vercel-ip-country)

A two-character [ISO 3166-1](https://en.wikipedia.org/wiki/ISO_3166-1) country code for the country associated with the location of the requester's public IP address.

Next.js (/app)Next.js (/pages)Other frameworks

```
export function GET(request: Request) {
  const country = request.headers.get('x-vercel-ip-country');
  return new Response(`Country: ${country}`);
}
```

## [`x-vercel-ip-country-region`](#x-vercel-ip-country-region)

A string of up to three characters containing the region-portion of the [ISO 3166-2](https://en.wikipedia.org/wiki/ISO_3166-2) code for the first level region associated with the requester's public IP address. Some countries have two levels of subdivisions, in which case this is the least specific one. For example, in the United Kingdom this will be a country like "England", not a county like "Devon".

Next.js (/app)Next.js (/pages)Other frameworks

```
export function GET(request: Request) {
  const region = request.headers.get('x-vercel-ip-country-region');
  return new Response(`Region: ${region}`);
}
```

## [`x-vercel-ip-city`](#x-vercel-ip-city)

The city name for the location of the requester's public IP address. Non-ASCII characters are encoded according to [RFC3986](https://tools.ietf.org/html/rfc3986).

Next.js (/app)Next.js (/pages)Other frameworks

```
export function GET(request: Request) {
  const city = request.headers.get('x-vercel-ip-city');
  return new Response(`City: ${city}`);
}
```

## [`x-vercel-ip-latitude`](#x-vercel-ip-latitude)

The latitude for the location of the requester's public IP address. For example, `37.7749`.

Next.js (/app)Next.js (/pages)Other frameworks

```
export function GET(request: Request) {
  const latitude = request.headers.get('x-vercel-ip-latitude');
  return new Response(`Latitude: ${latitude}`);
}
```

## [`x-vercel-ip-longitude`](#x-vercel-ip-longitude)

The longitude for the location of the requester's public IP address. For example, `-122.4194`.

Next.js (/app)Next.js (/pages)Other frameworks

```
export function GET(request: Request) {
  const longitude = request.headers.get('x-vercel-ip-longitude');
  return new Response(`Longitude: ${longitude}`);
}
```

## [`x-vercel-ip-timezone`](#x-vercel-ip-timezone)

The name of the time zone for the location of the requester's public IP address in ICANN Time Zone Database name format such as `America/Chicago`.

Next.js (/app)Next.js (/pages)Other frameworks

```
export function GET(request: Request) {
  const timezone = request.headers.get('x-vercel-ip-timezone');
  return new Response(`Timezone: ${timezone}`);
}
```

## [`x-vercel-ip-postal-code`](#x-vercel-ip-postal-code)

The postal code close to the user's location.

Next.js (/app)Next.js (/pages)Other frameworks

```
export function GET(request: Request) {
  const postalCode = request.headers.get('x-vercel-ip-postal-code');
  return new Response(`Postal Code: ${postalCode}`);
}
```

## [`x-vercel-signature`](#x-vercel-signature)

The signature of the request. This header is used to verify that the request was sent by Vercel, and contains a hash signature you can use to validate the request body.

Next.js (/app)Next.js (/pages)Other frameworks

```
export function POST(request: Request) {
  const signature = request.headers.get('x-vercel-signature');
  return new Response(`Signature: ${signature}`);
}
```

Last updated on March 12, 2025