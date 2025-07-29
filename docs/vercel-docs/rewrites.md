# Rewrites on Vercel

A rewrite routes a request to a different destination without changing the URL in the browser. Unlike redirects, the user won't see the URL change.

There are two main types:

1.  Same-application rewrites – Route requests to different pages within your Vercel project.
2.  External rewrites – Forward requests to an external API or website.

The /.well-known path is reserved and cannot be redirected or rewritten. Only Enterprise teams can configure custom SSL. [Contact sales](/contact/sales) to learn more.

## [Setting up rewrites](#setting-up-rewrites)

Rewrites are defined in a `vercel.json` file in your project's root directory:

```
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/source-path",
      "destination": "/destination-path"
    }
  ]
}
```

For all configuration options, see the [project configuration](/docs/project-configuration#rewrites) docs.

## [Same-application rewrites](#same-application-rewrites)

Same-application rewrites route requests to different destinations within your project. Common uses include:

*   Friendly URLs: Transform `/products/t-shirts` into `/catalog?category=t-shirts`
*   Device-specific content: Show different layouts based on device type
*   A/B testing: Route users to different versions of a page
*   Country-specific content: Show region-specific content based on the user's location

Example: Route image resize requests to a serverless function:

```
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/resize/:width/:height",
      "destination": "/api/sharp"
    }
  ]
}
```

This converts a request like `/resize/800/600` to `/api/sharp?width=800&height=600`.

Example: Route UK visitors to a UK-specific section:

```
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/:path((?!uk/).*)",
      "has": [
        { "type": "header", "key": "x-vercel-ip-country", "value": "GB" }
      ],
      "destination": "/uk/:path*"
    }
  ]
}
```

This routes a UK visitor requesting `/about` to `/uk/about`.

## [External rewrites](#external-rewrites)

External rewrites forward requests to APIs or websites outside your Vercel project, effectively allowing Vercel to function as a reverse proxy or standalone CDN. You can use this feature to:

*   Proxy API requests: Hide your actual API endpoint
*   Combine multiple services: Merge multiple backends under one domain
*   Create microfrontends: Combine multiple Vercel applications into a single website
*   Add caching: Cache external API responses at the edge
*   Serve externally hosted content: Serve content that is not hosted on Vercel.

Example: Forward API requests to an external endpoint:

```
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.example.com/:path*"
    }
  ]
}
```

A request to `/api/users` will be forwarded to `https://api.example.com/users` without changing the URL in the browser.

### [Caching external rewrites](#caching-external-rewrites)

The Edge Network can cache external rewrites for better performance. There are three approaches to enable caching:

1.  Directly from your API (preferred): When you control the backend API, the API itself can return [`CDN-Cache-Control`](/docs/headers/cache-control-headers#cdn-cache-control-header) or [`Vercel-CDN-Cache-Control`](/docs/headers/cache-control-headers#cdn-cache-control-header) headers in its response:
    
    `CDN-Cache-Control: max-age=60`
    
    This will cache API responses at the edge for 60 seconds.
    
2.  Using Vercel Configuration: When you can't modify the backend API, set the caching headers in your Vercel configuration:
    
    ```
    {
      "$schema": "https://openapi.vercel.sh/vercel.json",
      "rewrites": [
        {
          "source": "/api/:path*",
          "destination": "https://api.example.com/:path*"
        }
      ],
      "headers": [
        {
          "source": "/api/:path*",
          "headers": [
            {
              "key": "CDN-Cache-Control",
              "value": "max-age=60"
            }
          ]
        }
      ]
    }
    ```
    
    This will cache API responses at the edge for 60 seconds.
    
3.  Using `x-vercel-enable-rewrite-caching` (fallback): Use this approach only when you cannot control the caching headers from the external API and need to respect the `Cache-Control` header:
    
    ```
    {
      "$schema": "https://openapi.vercel.sh/vercel.json",
      "headers": [
        {
          "source": "/api/:path*",
          "headers": [{ "key": "x-vercel-enable-rewrite-caching", "value": "1" }]
        }
      ]
    }
    ```
    
    This instructs Vercel to respect the `Cache-Control` header from the external API.
    

For more information on caching headers and detailed options, see the [Cache-Control headers documentation](/docs/headers/cache-control-headers).

## [Framework considerations](#framework-considerations)

External rewrites work universally with all frameworks, making them ideal for API proxying, microfrontend architectures, and serving content from external origins through Vercel's global edge network as a reverse proxy or standalone CDN.

For same-application rewrites, always prefer your framework's native routing capabilities:

*   Next.js: [Next.js rewrites](https://nextjs.org/docs/api-reference/next.config.js/rewrites)
*   Astro: [Astro routing](/docs/frameworks/astro#rewrites)
*   SvelteKit: [SvelteKit routing](/docs/frameworks/sveltekit#rewrites)

Use `vercel.json` rewrites for same-application routing only when your framework doesn't provide native routing features. Always consult your framework's documentation for the recommended approach.

## [Testing rewrites](#testing-rewrites)

Use Vercel's preview deployments to test your rewrites before going to production. Each pull request creates a unique preview URL where you can verify your rewrites work correctly.

## [Wildcard path forwarding](#wildcard-path-forwarding)

You can capture and forward parts of a path using wildcards:

```
{
  "rewrites": [
    {
      "source": "/docs/:path*",
      "destination": "/help/:path*"
    }
  ]
}
```

Some redirects and rewrites configurations can accidentally become gateways for semantic attacks. Learn how to check and protect your configurations with the [Enhancing Security for Redirects and Rewrites guide](/guides/enhancing-security-for-redirects-and-rewrites).

A request to `/docs/getting-started/install` will be forwarded to `/help/getting-started/install`.

You can also capture multiple path segments:

```
{
  "rewrites": [
    {
      "source": "/blog/:year/:month/:slug*",
      "destination": "/posts?date=:year-:month&slug=:slug*"
    }
  ]
}
```

## [Using regular expressions](#using-regular-expressions)

For more complex patterns, you can use regular expressions with capture groups:

```
{
  "rewrites": [
    {
      "source": "^/articles/(\\d{4})/(\\d{2})/(.+)$",
      "destination": "/archive?year=$1&month=$2&slug=$3"
    }
  ]
}
```

This converts `/articles/2023/05/hello-world` to `/archive?year=2023&month=05&slug=hello-world`.

You can also use named capture groups:

```
{
  "rewrites": [
    {
      "source": "^/products/(?<category>[a-z]+)/(?<id>\\d+)$",
      "destination": "/shop?category=$category&item=$id"
    }
  ]
}
```

This converts `/products/shirts/123` to `/shop?category=shirts&item=123`.

## [When to use each type](#when-to-use-each-type)

*   Same-application rewrites: Use when routing within your own application
*   External rewrites: Use when connecting to external APIs, creating microfrontends, or using Vercel as a reverse proxy or standalone CDN for third-party content

Last updated on July 18, 2025