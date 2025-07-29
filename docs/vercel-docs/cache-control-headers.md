# Cache-Control headers

You can control how Vercel's Edge Network caches your Function responses by setting a [Cache-Control headers](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cache-Control) header.

## [Default `cache-control` value](#default-cache-control-value)

The default value is `cache-control: public, max-age=0, must-revalidate` which instructs both the Edge Network and the browser not to cache.

## [Recommended settings](#recommended-settings)

We recommend that you set your cache to`max-age=0, s-maxage=86400`, adjusting 86400 to the number of seconds you want the response cached. This configuration tells browsers not to cache, allowing Vercel's Edge Network to cache responses and invalidate them when deployments update.

## [`s-maxage`](#s-maxage)

This directive sets the number of seconds a response is considered "fresh" by the Edge Network. After this period ends, Vercel's Edge Network will serve the "stale" response from the edge until the response is asynchronously revalidated with a "fresh" response to your Vercel Function.

`s-maxage` is consumed by Vercel's proxy and not included as part the final HTTP response to the client.

### [`s-maxage` example](#s-maxage-example)

The following example instructs the Edge Network to cache the response for 60 seconds. A response can be cached a minimum of `1` second and maximum of `31536000` seconds (1 year).

```
Cache-Control: s-maxage=60
```

## [`stale-while-revalidate`](#stale-while-revalidate)

This `cache-control` directive allows you to serve content from the Vercel cache while simultaneously updating the cache in the background with the response from your function. It is useful when:

*   Your content changes frequently, but regeneration is slow, such as content that relies on an expensive database query or upstream API request
*   Your content changes infrequently but you want to have the flexibility to update it without waiting for the cache to expire

`stale-while-revalidate` is consumed by Vercel's proxy and not included as part the final HTTP response to the client. This allows you to deliver the latest content to your visitors right after creating a new deployment (as opposed to waiting for browser cache to expire). It also prevents content-flash.

### [SWR example](#swr-example)

The following example instructs the Edge Network to:

*   Serve content from the cache for 1 second
*   Return a stale request (if requested after 1 second)
*   Update the cache in the background asynchronously (if requested after 1 second)

```
Cache-Control: s-maxage=1, stale-while-revalidate=59
```

The first request is served synchronously. Subsequent requests are served from the cache and revalidated asynchronously if the cache is "stale".

If you need to do a _synchronous_ revalidation you can set the `pragma: no-cache` header along with the `cache-control` header. This can be used to understand how long the background revalidation took. It sets the `x-vercel-cache` header to `REVALIDATED`.

Many browser developer tools set `pragma: no-cache` by default, which reveals the true load time of the page with the synchronous update to the cache.

## [`stale-if-error`](#stale-if-error)

This directive is currently not supported. `stale-if-error` is consumed by Vercel's proxy, and will not be included in the HTTP response sent to the client.

## [`proxy-revalidate`](#proxy-revalidate)

This directive is currently not supported.

## [Using `private`](#using-private)

Using the `private` directive specifies that the response can only be cached by the client and not by Vercel's Edge Network. Use this directive when you want to cache content on the user's browser, but prevent caching on Vercel's Edge Network.

## [`Pragma: no-cache`](#pragma:-no-cache)

When Vercel's Edge Network CDN receives a request with `Pragma: no-cache` (such as when the browser devtools are open), it will revalidate any stale resource synchronously, instead of in the background.

## [CDN-Cache-Control Header](#cdn-cache-control-header)

Sometimes the directives you set in a `Cache-Control` header can be interpreted differently by the different CDNs and proxies your content passes through between the origin server and a visitor's browser. To explicitly control caching you can use targeted cache control headers.

The `CDN-Cache-Control` and `Vercel-CDN-Cache-Control` headers are response headers that can be used to specify caching behavior on the Edge Network and/or CDNs.

You can use the same directives as [`Cache-Control`](#default-cache-control-value), but `CDN-Cache-Control` is only used by the Edge Network and CDNs.

## [Behavior](#behavior)

Origins can set the following headers:

*   `Vercel-CDN-Cache-Control`
*   `CDN-Cache-Control`
*   `Cache-Control`

When multiple of the above headers are set, Vercel's Edge Network will use the following priority to determine the caching behavior:

### [`Vercel-CDN-Cache-Control`](#vercel-cdn-cache-control)

`Vercel-CDN-Cache-Control` is exclusive to Vercel and has top priority, whether it's defined in a Vercel Function response or a `vercel.json` file. It controls caching behavior only within Vercel's Cache. It is removed from the response and not sent to the client or any CDNs.

### [`CDN-Cache-Control`](#cdn-cache-control)

`CDN-Cache-Control` is second in priority after `Vercel-CDN-Cache-Control`, and always overrides `Cache-Control` headers, whether defined in a Vercel Function response or a `vercel.json` file.

By default, `CDN-Cache-Control` configures Vercel's Cache and is used by other CDNs, allowing you to configure intermediary caches. If `Vercel-CDN-Cache-Control` is also set, `CDN-Cache-Control` only influences other CDN caches.

### [`Cache-Control`](#cache-control)

`Cache-Control` is a web standard header and last in priority. If neither `CDN-Cache-Control` nor `Vercel-CDN-Cache-Control` are set, this header will be used by Vercel's Cache before being forwarded to the client.

You can still set `Cache-Control` while using the other two, and it will be forwarded to the client as is.

If only `Cache-Control` is used, Vercel strips the `s-maxage` directive from the header before it's sent to the client.

## [Cache-Control comparison tables](#cache-control-comparison-tables)

The following tables demonstrate how Vercel's Cache behaves in different scenarios:

### [Functions have priority over config files](#functions-have-priority-over-config-files)

`Cache-Control` headers returned from Vercel Functions take priority over `Cache-Control` headers from `next.config.js` or `vercel.json` files.

| Parameter | Value |
| --- | --- |
| Vercel Function response headers | `Cache-Control: s-maxage=60` |
| `vercel.json` or `next.config.js` headers | `Cache-Control: s-maxage: 120` |
| Cache behavior | 60s TTL |
| Headers sent to the client | `Cache-Control: public, max-age: 0` |

### [`CDN-Cache-Control` priority](#cdn-cache-control-priority)

`CDN-Cache-Control` has priority over `Cache-Control`, even if defined in `vercel.json` or `next.config.js`.

| Parameter | Value |
| --- | --- |
| Vercel Function response headers | `Cache-Control: s-maxage=60` |
| `vercel.json` or `next.config.js` headers | `CDN-Cache-Control: max-age=120` |
| Cache behavior | 120s TTL |
| Headers sent to the client | `Cache-Control: s-maxage=60 CDN-Cache-Control: max-age=120` |

### [`Vercel-CDN-Cache-Control` priority](#vercel-cdn-cache-control-priority)

`Vercel-CDN-Cache-Control` has priority over both `CDN-Cache-Control` and `Cache-Control`. It only applies to Vercel, so it is not returned with the other headers, which will control cache behavior on the browser and other CDNs.

| Parameter | Value |
| --- | --- |
| Vercel Function response headers | `CDN-Cache-Control: max-age=120` |
| `vercel.json` or `next.config.js` headers | `Cache-Control: s-maxage=60 Vercel-CDN-Cache-Control: max-age=300` |
| Cache behavior | 300s TTL |
| Headers sent to the client | `Cache-Control: s-maxage=60 CDN-Cache-Control: max-age=120` |

## [Which Cache-Control headers to use with CDNs](#which-cache-control-headers-to-use-with-cdns)

*   If you want to control caching similarly on Vercel, CDNs, and the client, use `Cache-Control`
*   If you want to control caching on Vercel and also on other CDNs, use `CDN-Cache-Control`
*   If you want to control caching only on Vercel, use `Vercel-CDN-Cache-Control`
*   If you want to specify different caching behaviors for Vercel, other CDNs, and the client, you can set all three headers

## [Example usage](#example-usage)

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

## [Custom Response Headers](#custom-response-headers)

Using configuration, you can assign custom headers to each response.

Custom headers can be configured with the `headers` property in [`next.config.js`](https://nextjs.org/docs/api-reference/next.config.js/headers) for Next.js projects, or it can be configured in [`vercel.json`](/docs/project-configuration#headers) for all other projects.

Alternatively, a [Vercel Function](/docs/functions) can assign headers to the [Response](https://nodejs.org/api/http.html#http_response_setheader_name_value) object.

Response headers `x-matched-path`, `server`, and `content-length` are reserved and cannot be modified.

Last updated on July 18, 2025