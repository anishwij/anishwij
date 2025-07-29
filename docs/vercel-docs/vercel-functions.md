# @vercel/functions API Reference

## [Install and use the package](#install-and-use-the-package)

1.  Install the `@vercel/functions` package:

pnpmyarnnpmbun

```
pnpm i @vercel/functions
```

2.  Import the `@vercel/functions` package (non-Next.js frameworks or Next.js versions below 13.4):

Other frameworks

```
import { waitUntil } from '@vercel/functions';
 
export function GET(request: Request) {
  // ...
}
```

For [OIDC](/docs/functions/functions-api-reference/vercel-functions-package#oidc-methods) methods, import `@vercel/functions/oidc`

## [Usage with Next.js](#usage-with-next.js)

If you’re using Next.js 13.4 or above, we recommend using the built-in [`after()`](https://nextjs.org/docs/app/api-reference/functions/after) function from `next/server` instead of `waitUntil()`.

`after()` allows you to schedule work that runs after the response has been sent or the prerender has completed. This is especially useful to avoid blocking rendering for side effects such as logging, analytics, or other background tasks.

```
import { after } from 'next/server';
 
export async function GET(request: Request) {
  const country = request.headers.get('x-vercel-ip-country') || 'unknown';
 
  // Returns a response immediately
  const response = new Response(`You're visiting from ${country}`);
 
  // Schedule a side-effect after the response is sent
  after(async () => {
    // For example, log or increment analytics in the background
    await fetch(
      `https://my-analytics-service.example.com/log?country=${country}`,
    );
  });
 
  return response;
}
```

*   `after()` does not block the response. The callback runs once rendering or the response is finished.
*   `after()` is not a [Dynamic API](https://nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-apis); calling it does not cause a route to become dynamic.
*   If you need to configure or extend the timeout for tasks, you can use [`maxDuration`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#maxduration) in Next.js.
*   For more usage examples (including in Server Components, Server Actions, or Middleware), see [after() in the Next.js docs](https://nextjs.org/docs/app/api-reference/functions/after).

## [Helper methods (non-Next.js usage or older Next.js versions)](#helper-methods-non-next.js-usage-or-older-next.js-versions)

If you're not using Next.js 13.4 or above (or you are using other frameworks), you can use the methods from `@vercel/functions` below.

### [`waitUntil`](#waituntil)

Description: Extends the lifetime of the request handler for the lifetime of the given Promise. The `waitUntil()` method enqueues an asynchronous task to be performed during the lifecycle of the request. You can use it for anything that can be done after the response is sent, such as logging, sending analytics, or updating a cache, without blocking the response. `waitUntil()` is available in Node.js and in the [Edge Runtime](/docs/functions/runtimes/edge).

Promises passed to `waitUntil()` will have the same timeout as the function itself. If the function times out, the promises will be cancelled.

| Name | Type | Description |
| --- | --- | --- |
| `promise` | [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) | The promise to wait for. |

If you're using Next.js 13.4 or above, use [`after()`](#using-after-in-nextjs) from `next/server` instead. Otherwise, see below.

```
import { waitUntil } from '@vercel/functions';
 
async function getBlog() {
  const res = await fetch('https://my-analytics-service.example.com/blog/1');
  return res.json();
}
 
export function GET(request: Request) {
  waitUntil(getBlog().then((json) => console.log({ json })));
  return new Response(`Hello from ${request.url}, I'm a Vercel Function!`);
}
```

### [`getEnv`](#getenv)

Description: Gets the [System Environment Variables](/docs/environment-variables/system-environment-variables#system-environment-variables) exposed by Vercel.

```
import { getEnv } from '@vercel/functions';
 
export function GET(request) {
  const { VERCEL_REGION } = getEnv();
  return new Response(`Hello from ${VERCEL_REGION}`);
}
```

### [`geolocation`](#geolocation)

Description: Returns the location information for the incoming request, in the following way:

```
{
  "city": "New York",
  "country": "US",
  "flag": "🇺🇸",
  "countryRegion": "NY",
  "region": "iad1",
  "latitude": "40.7128",
  "longitude": "-74.0060",
  "postalCode": "10001"
}
```

| Name | Type | Description |
| --- | --- | --- |
| `request` | [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) | The incoming request object which provides the IP |

```
import { geolocation } from '@vercel/functions';
 
export function GET(request) {
  const details = geolocation(request);
  return Response.json(details);
}
```

### [`ipAddress`](#ipaddress)

Description: Returns the IP address of the request from the headers.

| Name | Type | Description |
| --- | --- | --- |
| `request` | [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) | The incoming request object which provides the IP |

```
import { ipAddress } from '@vercel/functions';
 
export function GET(request) {
  const ip = ipAddress(request)
  return new Response('Your ip is' ${ip});
}
```

### [OIDC methods](#oidc-methods)

To use OIDC methods, import the `@vercel/functions/oidc` package:

```
import { awsCredentialsProvider } from '@vercel/functions/oidc'
 
export function GET() {
  ...
}
```

#### [`awsCredentialsProvider`](#awscredentialsprovider)

Description: Obtains the Vercel OIDC token and creates an AWS credential provider function that gets AWS credentials by calling the STS `AssumeRoleWithWebIdentity` API.

| Name | Type | Description |
| --- | --- | --- |
| `roleArn` | `string` | ARN of the role that the caller is assuming. |
| `clientConfig` | `Object` | Custom STS client configurations overriding the default ones. |
| `clientPlugins` | `Array` | Custom STS client middleware plugin to modify the client default behavior. |
| `roleAssumerWithWebIdentity` | `Function` | A function that assumes a role with web identity and returns a promise fulfilled with credentials for the assumed role. |
| `roleSessionName` | `string` | An identifier for the assumed role session. |
| `providerId` | `string` | The fully qualified host component of the domain name of the identity provider. |
| `policyArns` | `Array` | ARNs of the IAM managed policies that you want to use as managed session policies. |
| `policy` | `string` | An IAM policy in JSON format that you want to use as an inline session policy. |
| `durationSeconds` | `number` | The duration, in seconds, of the role session. Defaults to 3600 seconds. |

```
import * as s3 from '@aws-sdk/client-s3';
import { awsCredentialsProvider } from '@vercel/functions/oidc';
 
const s3Client = new s3.S3Client({
  credentials: awsCredentialsProvider({
    roleArn: process.env.AWS_ROLE_ARN,
  }),
});
```

#### [`getVercelOidcToken`](#getverceloidctoken)

Description: Returns the OIDC token from the request context or the environment variable. This function first checks if the OIDC token is available in the environment variable `VERCEL_OIDC_TOKEN`. If it is not found there, it retrieves the token from the request context headers.

```
import { ClientAssertionCredential } from '@azure/identity';
import { CosmosClient } from '@azure/cosmos';
import { getVercelOidcToken } from '@vercel/functions/oidc';
 
const credentialsProvider = new ClientAssertionCredential(
  process.env.AZURE_TENANT_ID,
  process.env.AZURE_CLIENT_ID,
  getVercelOidcToken,
);
 
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_DB_ENDPOINT,
  aadCredentials: credentialsProvider,
});
 
export const GET = () => {
  const container = cosmosClient
    .database(process.env.COSMOS_DB_NAME)
    .container(process.env.COSMOS_DB_CONTAINER);
  const items = await container.items.query('SELECT * FROM f').fetchAll();
  return Response.json({ items: items.resources });
};
```

Last updated on July 18, 2025