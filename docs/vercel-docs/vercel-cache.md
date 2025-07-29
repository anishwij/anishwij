# Vercel Cache

Vercel's [Edge Network](/docs/edge-network) caches your content at the edge in order to serve data to your users as fast as possible. Vercel's caching is available for all deployments and domains on your account, regardless of the [pricing plan](https://vercel.com/pricing).

Vercel uses the Edge Network to cache your content globally and serve data to your users as quickly as possible. There are two ways to cache content:

*   [Static file caching](#static-files-caching) is automatic for all deployments, requiring no manual configuration
*   To cache dynamic content, including SSR content, you can use `Cache-Control` [headers](/docs/headers#cache-control-header)

## [How to cache responses](#how-to-cache-responses)

You can cache responses on Vercel with `Cache-Control` headers defined in:

1.  Responses from [Vercel Functions](/docs/functions)
2.  Route definitions in `vercel.json` or `next.config.js`

You can use any combination of the above options, but if you return `Cache-Control` headers in a Vercel Function, it will override the headers defined for the same route in `vercel.json` or `next.config.js`.

### [Using Vercel Functions](#using-vercel-functions)

To cache the response of Functions on Vercel's Edge Network, you must include [`Cache-Control`](/docs/headers#cache-control-header) headers with any of the following directives:

*   `s-maxage=N`
*   `s-maxage=N, stale-while-revalidate=Z`

`proxy-revalidate` and `stale-if-error` are not currently supported.

The following example demonstrates a [function](/docs/functions) that caches its response and revalidates it every 1 second:

Next.js (/app)Next.js (/pages)Other frameworks

```
export async function GET() {
  return new Response('Cache Control example', {
    status: 200,
    headers: {
      'Cache-Control': 'public, s-maxage=1',
      'CDN-Cache-Control': 'public, s-maxage=60',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
    },
  });
}
```

For direct control over caching on Vercel and downstream CDNs, you can use [CDN-Cache-Control](#cdn-cache-control) headers.

### [Using `vercel.json` and `next.config.js`](#using-vercel.json-and-next.config.js)

You can define route headers in `vercel.json` or `next.config.js` files. These headers will be overridden by [headers defined in Function responses](#using-vercel-functions).

The following example demonstrates a `vercel.json` file that adds `Cache-Control` headers to a route:

```
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/about.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=1, stale-while-revalidate=59"
        }
      ]
    }
  ]
}
```

If you're building your app with Next.js, you should use `next.config.js` rather than `vercel.json`. The following example demonstrates a `next.config.js` file that adds `Cache-Control` headers to a route:

```
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/about',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=1, stale-while-revalidate=59',
          },
        ],
      },
    ];
  },
};
 
module.exports = nextConfig;
```

See [the Next docs](https://nextjs.org/docs/app/api-reference/next-config-js) to learn more about `next.config.js`.

### [Static Files Caching](#static-files-caching)

Static files are automatically cached at the edge on Vercel's Edge Network for the lifetime of the deployment after the first request.

*   If a static file is unchanged, the cached value can persist across deployments due to the hash used in the filename
*   Optimized images cached will persist across deployments for both [static images](/docs/image-optimization#local-images-cache-key) and [remote images](/docs/image-optimization#remote-images-cache-key)

#### [Browser](#browser)

*   `max-age=N, public`
*   `max-age=N, immutable`

Where `N` is the number of seconds the response should be cached. The response must also meet the [caching criteria](/docs/edge-network/caching#how-to-cache-responses).

## [Cache control options](#cache-control-options)

You can cache dynamic content through [Vercel Functions](/docs/functions), including SSR, by adding `Cache-Control` [headers](/docs/headers#cache-control-header) to your response. When you specify `Cache-Control` headers in a function, responses will be cached in the region the function was requested from.

See [our docs on Cache-Control headers](/docs/headers#cache-control-header) to learn how to best use `Cache-Control` directives on Vercel's Edge Network.

### [CDN-Cache-Control](#cdn-cache-control)

Vercel supports two [Targeted Cache-Control headers](https://httpwg.org/specs/rfc9213.html):

*   `CDN-Cache-Control`, which allows you to control the Vercel Cache or other CDN cache _separately_ from the browser's cache. The browser will not be affected by this header
*   `Vercel-CDN-Cache-Control`, which allows you to specifically control Vercel's Cache. Neither other CDNs nor the browser will be affected by this header

By default, the headers returned to the browser are as follows:

*   `Cache-Control`
*   `CDN-Cache-Control`

`Vercel-CDN-Cache-Control` headers are not returned to the browser or forwarded to other CDNs.

To learn how these headers work in detail, see [our dedicated headers docs](/docs/headers/cache-control-headers#cdn-cache-control-header).

The following example demonstrates `Cache-Control` headers that instruct:

*   Vercel's Cache to have a [TTL](https://en.wikipedia.org/wiki/Time_to_live) of `3600` seconds
*   Downstream CDNs to have a TTL of `60` seconds
*   Clients to have a TTL of `10` seconds

Next.js (/app)Next.js (/pages)Other frameworks

```
export async function GET() {
  return new Response('Cache Control example', {
    status: 200,
    headers: {
      'Cache-Control': 'max-age=10',
      'CDN-Cache-Control': 'max-age=60',
      'Vercel-CDN-Cache-Control': 'max-age=3600',
    },
  });
}
```

If you set `Cache-Control` without a `CDN-Cache-Control`, the Vercel Edge Network strips `s-maxage` and `stale-while-revalidate` from the response before sending it to the browser. To determine if the response was served from the cache, check the [`x-vercel-cache`](#x-vercel-cache) header in the response.

### [Vary header](#vary-header)

The `Vary` response header instructs caches to use specific request headers as part of the cache key. This allows you to serve different cached responses to different users based on their request headers.

The `Vary` header only has an effect when used in combination with `Cache-Control` headers that enable caching (such as `s-maxage`). Without a caching directive, the `Vary` header has no behavior.

When Vercel's Edge Network receives a request, it combines the cache key (described in the [Cache Invalidation](#cache-invalidation) section) with the values of any request headers specified in the `Vary` header to create a unique cache entry for each distinct combination.

#### [Use cases](#use-cases)

Vercel's Edge Network already includes the `Accept` and `Accept-Encoding` headers as part of the cache key by default. You do not need to explicitly include these headers in your `Vary` header.

The most common use case for the `Vary` header is content negotiation, serving different content based on:

*   User location (e.g., `X-Vercel-IP-Country`)
*   Device type (e.g., `User-Agent`)
*   Language preferences (e.g., `Accept-Language`)

Example: Country-specific content

You can use the `Vary` header with Vercel's `X-Vercel-IP-Country` request header to cache different responses for users from different countries:

Next.js (/app)Next.js (/pages)Other frameworks

```
import { type NextRequest } from 'next/server';
 
export async function GET(request: NextRequest) {
  const country = request.headers.get('x-vercel-ip-country') || 'unknown';
 
  // Serve different content based on country
  let content;
  if (country === 'US') {
    content = { message: 'Hello from the United States!' };
  } else if (country === 'GB') {
    content = { message: 'Hello from the United Kingdom!' };
  } else {
    content = { message: `Hello from ${country}!` };
  }
 
  return Response.json(content, {
    status: 200,
    headers: {
      'Cache-Control': 's-maxage=3600',
      Vary: 'X-Vercel-IP-Country',
    },
  });
}
```

#### [Setting the `Vary` header](#setting-the-vary-header)

You can set the `Vary` header in the same ways you set other response headers:

In Vercel Functions

Next.js (/app)Next.js (/pages)Other frameworks

```
import { type NextRequest } from 'next/server';
 
export async function GET(request: NextRequest) {
  return Response.json(
    { data: 'This response varies by country' },
    {
      status: 200,
      headers: {
        Vary: 'X-Vercel-IP-Country',
        'Cache-Control': 's-maxage=3600',
      },
    },
  );
}
```

Using `vercel.json`

```
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/api/data",
      "headers": [
        {
          "key": "Vary",
          "value": "X-Vercel-IP-Country"
        },
        {
          "key": "Cache-Control",
          "value": "s-maxage=3600"
        }
      ]
    }
  ]
}
```

Using `next.config.js`

If you're building your app with Next.js, use `next.config.js`:

```
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/data',
        headers: [
          {
            key: 'Vary',
            value: 'X-Vercel-IP-Country',
          },
          {
            key: 'Cache-Control',
            value: 's-maxage=3600',
          },
        ],
      },
    ];
  },
};
 
module.exports = nextConfig;
```

#### [Multiple `Vary` headers](#multiple-vary-headers)

You can specify multiple headers in a single `Vary` value by separating them with commas:

```
res.setHeader('Vary', 'X-Vercel-IP-Country, Accept-Language');
```

This will create separate cache entries for each unique combination of country and language preference.

#### [Best practices](#best-practices)

*   Use `Vary` headers selectively, as each additional header exponentially increases the number of cache entries — this doesn't directly impact your bill, but can result in more cache misses than desired
*   Only include headers that meaningfully impact content generation
*   Consider combining multiple variations into a single header value when possible

## [Cacheable response criteria](#cacheable-response-criteria)

The `Cache-Control` field is an HTTP header specifying caching rules for client (browser) requests and server responses. A cache must obey the requirements defined in the `Cache-Control` header.

For server responses to be successfully cached with Vercel's Edge Network, the following criteria must be met:

*   Request uses `GET` or `HEAD` method.
*   Request does not contain `Range` header.
*   Request does not contain `Authorization` header.
*   Response uses `200`, `404`, `301`, `302`, `307` or `308` status code.
*   Response does not exceed `10MB` in content length.
*   Response does not contain the `set-cookie` header.
*   Response does not contain the `private`, `no-cache` or `no-store` directives in the `Cache-Control` header.
*   Response does not contain `Vary: *` header, which is treated as equivalent to `Cache-Control: private`.

Vercel does not allow bypassing the cache for static files by design.

## [Cache invalidation](#cache-invalidation)

Each request to Vercel's Edge Network has a cache key derived from the following:

*   The request method (such as `GET`, `POST`, etc)
*   The request URL (query strings are ignored for static files)
*   The host domain
*   The unique [deployment URL](/docs/deployments/generated-urls)
*   The scheme (whether it's `https` or `http`)

Since each deployment has a different cache key, you can [promote a new deployment](/docs/deployments/promoting-a-deployment) to production without affecting the cache of the previous deployment.

The cache key for Image Optimization behaves differently for [static images](/docs/image-optimization#local-images-cache-key) and [remote images](/docs/image-optimization#remote-images-cache-key).

### [Manually purging Vercel Cache](#manually-purging-vercel-cache)

You need to have an [owner](/docs/rbac/access-roles#owner-role) role to perform this task.

In some circumstances, you may need to delete all cached data and force revalidation. For example, you might have set a `Cache-Control` to cache the response for a month but the content changes more frequently than once a month. You can do this by purging the cache:

1.  Under your project, go to the Settings tab.
2.  In the left sidebar, select Caches.
3.  In the CDN Cache section, click Purge CDN Cache.
4.  In the dialog, confirm that you wish to delete and click the Continue & Purge CDN Cache button.

Purging the CDN Cache will temporarily increase Function Duration, Functions Invocations, Edge Function Executions, Fast Origin Transfer, Image Optimization Transformations, Image Optimization Cache Writes, and ISR Writes. This behavior is similar to creating a new deployment with the exception of Image Optimization which is preserved between deployments.

## [`x-vercel-cache`](#x-vercel-cache)

The `x-vercel-cache` header is included in HTTP responses to the client, and describes the state of the cache.

See [our headers docs](/docs/headers/response-headers#x-vercel-cache) to learn more.

## [Limits](#limits)

Vercel's Edge Network cache is segmented [by region](/docs/edge-network/regions). The following caching limits apply to [Vercel Function](/docs/functions) responses:

*   Max cacheable response size:
    *   Streaming functions: 20MB
    *   Non-streaming functions: 10MB
*   Max cache time: 1 year
    *   `s-maxage`
    *   `max-age`
    *   `stale-while-revalidate`

While you can put the maximum time for server-side caching, cache times are best-effort and not guaranteed. If an asset is requested often, it is more likely to live the entire duration. If your asset is rarely requested (e.g. once a day), it may be evicted from the regional cache.

### [`proxy-revalidate` and `stale-if-error`](#proxy-revalidate-and-stale-if-error)

Vercel does not currently support using `proxy-revalidate` and `stale-if-error` for server-side caching.

Last updated on July 18, 2025