# Response headers

The following headers are included in Vercel deployment responses and indicate certain factors of the environment. These headers can be viewed from the Browser's Dev Tools or using an HTTP client such as `curl -I <DEPLOYMENT_URL>`.

## [`cache-control`](#cache-control)

Used to specify directives for caching mechanisms in both the [Network layer cache](/docs/edge-network/caching) and the browser cache. See the [Cache Control Headers](/docs/headers#cache-control-header) section for more detail.

If you use this header to instruct the Edge Network to cache data, such as with the [`s-maxage`](/docs/headers/cache-control-headers#s-maxage) directive, Vercel returns the following `cache-control` header to the client:

\-`cache-control: public, max-age=0, must-revalidate`

## [`content-length`](#content-length)

An integer that indicates the number of bytes in the response.

## [`content-type`](#content-type)

The [media type](https://developer.mozilla.org/docs/Web/HTTP/Basics_of_HTTP/MIME_types) that describes the nature and format of the response.

## [`date`](#date)

A timestamp indicating when the response was generated.

## [`server: Vercel`](#server:-vercel)

Shows where the request came from. This header can be overridden by other proxies (e.g., Cloudflare).

## [`strict-transport-security`](#strict-transport-security)

A header often abbreviated as [HSTS](https://developer.mozilla.org/docs/Glossary/HSTS) that tells browsers that the resource should only be requested over HTTPS. The default value is `strict-transport-security: max-age=63072000` (2 years)

## [`x-robots-tag`](#x-robots-tag)

Present only on:

*   [Preview deployments](/docs/deployments/environments#preview-environment-pre-production)
*   Outdated [production deployments](/docs/deployments). When you [promote a new deployment to production](/docs/deployments/promoting-a-deployment), the `x-robots-tag` header will be sent to requests for outdated production deployments

We add this header automatically with a value of `noindex` to prevent search engines from crawling your Preview Deployments and outdated Production Deployments, which could cause them to penalize your site for duplicate content.

You can prevent this header from being added to your Preview Deployment by:

*   [Assigning a production domain](/docs/domains/working-with-domains/assign-domain-to-a-git-branch) to it
*   Disabling it manually [using vercel.json](/docs/project-configuration#headers)

## [`x-vercel-cache`](#x-vercel-cache)

The `x-vercel-cache` header is primarily used to indicate the cache status of static assets and responses from Vercel's Edge Network. For dynamic routes and fetch requests that utilize the [Vercel Data Cache](/docs/infrastructure/data-cache), this header will often show `MISS` even if the data is being served from the Data Cache. Use [custom headers](/docs/headers/cache-control-headers#custom-response-headers) or [runtime logs](/docs/runtime-logs) to determine if a fetch response was served from the Data Cache.

The following values are possible when the content being served [is static](/docs/edge-network/caching#static-files-caching) or uses [a Cache-Control header](/docs/headers#cache-control-header):

### [`MISS`](#miss)

The response was not found in the cache and was fetched from the origin server.

![MISS: The response was not found in the cache and was fetched from the origin server](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-miss2x.png%3Flightbox&w=1920&q=75)![MISS: The response was not found in the cache and was fetched from the origin server](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-miss2x.png%3Flightbox&w=1920&q=75)

MISS: The response was not found in the cache and was fetched from the origin server

Zoom Image

![MISS: The response was not found in the cache and was fetched from the origin server](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-miss2x.png%3Flightbox&w=1920&q=75)![MISS: The response was not found in the cache and was fetched from the origin server](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-miss2x.png%3Flightbox&w=1920&q=75)

MISS: The response was not found in the cache and was fetched from the origin server

### [`HIT`](#hit)

The response was served from the cache.

![HIT: The response was served from the cache](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-hit2x.png%3Flightbox&w=1920&q=75)![HIT: The response was served from the cache](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-hit2x.png%3Flightbox&w=1920&q=75)

HIT: The response was served from the cache

Zoom Image

![HIT: The response was served from the cache](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-hit2x.png%3Flightbox&w=1920&q=75)![HIT: The response was served from the cache](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-hit2x.png%3Flightbox&w=1920&q=75)

HIT: The response was served from the cache

### [`STALE`](#stale)

The response was served from the cache. A background request to the origin server was made to update the content. A background request to the origin was made to get a fresh version. (see [Stale-While-Revalidate](/docs/edge-network/caching#cache-invalidation) for more information)

![STALE: The response was served from the cache. A background request to the origin server was made to update the content.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-stale2x.png%3Flightbox&w=1920&q=75)![STALE: The response was served from the cache. A background request to the origin server was made to update the content.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-stale2x.png%3Flightbox&w=1920&q=75)

STALE: The response was served from the cache. A background request to the origin server was made to update the content.

Zoom Image

![STALE: The response was served from the cache. A background request to the origin server was made to update the content.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-stale2x.png%3Flightbox&w=1920&q=75)![STALE: The response was served from the cache. A background request to the origin server was made to update the content.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-stale2x.png%3Flightbox&w=1920&q=75)

STALE: The response was served from the cache. A background request to the origin server was made to update the content.

### [`PRERENDER`](#prerender)

The response was served from static storage. An example of prerender is in `Next.js`, when setting `fallback:true` in `getStaticPaths`. However, `fallback:blocking` will not return prerender.

![PRERENDER: The response was served from static storage.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-prerender2x.png%3Flightbox&w=1920&q=75)![PRERENDER: The response was served from static storage.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-prerender2x.png%3Flightbox&w=1920&q=75)

PRERENDER: The response was served from static storage.

Zoom Image

![PRERENDER: The response was served from static storage.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-prerender2x.png%3Flightbox&w=1920&q=75)![PRERENDER: The response was served from static storage.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-prerender2x.png%3Flightbox&w=1920&q=75)

PRERENDER: The response was served from static storage.

### [`REVALIDATED`](#revalidated)

The response was served from the origin server and the cache was refreshed due to an authorization from the user in the incoming request.

![REVALIDATED: The response was served from the origin server and the cache was refreshed due to an authorization from the user in the incoming request.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-revalidated2x.png%3Flightbox&w=1920&q=75)![REVALIDATED: The response was served from the origin server and the cache was refreshed due to an authorization from the user in the incoming request.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-revalidated2x.png%3Flightbox&w=1920&q=75)

REVALIDATED: The response was served from the origin server and the cache was refreshed due to an authorization from the user in the incoming request.

Zoom Image

![REVALIDATED: The response was served from the origin server and the cache was refreshed due to an authorization from the user in the incoming request.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-revalidated2x.png%3Flightbox&w=1920&q=75)![REVALIDATED: The response was served from the origin server and the cache was refreshed due to an authorization from the user in the incoming request.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1689795055%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fedge-network%2Fx-vercel-cache-revalidated2x.png%3Flightbox&w=1920&q=75)

REVALIDATED: The response was served from the origin server and the cache was refreshed due to an authorization from the user in the incoming request.

## [`x-vercel-id`](#x-vercel-id)

This header contains a list of [Vercel regions](/docs/edge-network/regions) your request hit, as well as the region the function was executed in (for both Edge and Serverless).

It also allows Vercel to automatically prevent infinite loops.

Last updated on July 18, 2025