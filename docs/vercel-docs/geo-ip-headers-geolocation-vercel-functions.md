# How can I use geolocation IP headers?

Learn how to read geolocation headers on Vercel with Next.js or any frontend framework.

Last updated on March 15, 2025

Edge Network & CachingFunctions

---

Vercel enables you to read a visitor's geolocation or IP address inside of Vercel Functions or Vercel Edge Middleware, enabling you to show localized content or block malicious IPs.

You can also use the Vercel [Web Application Firewall (WAF)](https://vercel.com/docs/security/vercel-waf) to block IPs from a specific geolocation by configuring a [custom rule](https://vercel.com/docs/security/vercel-waf/custom-rules#get-started) with the request [parameters](https://vercel.com/docs/security/vercel-waf/rule-configuration#parameters) of continent, state, country and city.

This guide will show how to read geolocation IP headers with any framework on Vercel.

This feature does not work if you're using a proxy in front of your deployment. However, Enterprise customers can purchase and enable Trusted Proxy to override this behavior. If you're interested, please [contact us](https://vercel.com/contact/sales) for more details.

All Vercel deployments include the following geolocation headers:

-   ```
    X-Vercel-IP-Country
    ```
     – The 2-letter country code of the IP sending the request.
-   ```
    X-Vercel-IP-Country-Region
    ```
     – The [ISO 3166-2](https://en.wikipedia.org/wiki/ISO_3166-2) region code associated to the IP.
-   ```
    X-Vercel-IP-City
    ```
     – The city name associated to the IP.

When testing locally, the geolocation headers will not be set. You can only view geolocation information after making a deployment and reading the incoming request headers.

[
```
@vercel/functions
```
](https://vercel.com/docs/functions/functions-api-reference) provides the following helpers for use in Vercel Functions or Vercel Edge Middleware, built on top of the geolocation headers:

-   ```
    geolocation
    ```
    : Returns the location information for the incoming request.
-   ```
    ipAddress
    ```
    : Returns the IP address of the request from the headers.

These can be used with any framework and allow you to read geo IP headers. To get started, add 
```
@vercel/functions
```
 to your project.

The 
```
geolocation
```
 helper returns location information for an incoming request. It takes a request object as input and returns properties such as city, country, latitude, longitude, and region ([Vercel Edge Network region](https://vercel.com/docs/edge-network/regions) that received the request).

Each property is returned as a string or 
```
undefined
```
. Here's an example code snippet demonstrating how to use it within the Next.js App Router and Route Handlers:

```tsx


import{ geolocation }from'@vercel/functions';

exportfunctionGET(request: Request){

const{ city }=geolocation(request);

returnnewResponse(`<h1>Your location is ${city}</h1>`,{

    headers:{'content-type':'text/html'},

});

}




```

Reading the city from the geo IP headers in a Vercel Function.

We recommend using the above for both Pages and App Router applications (both directories can exist together). When using Vercel Functions with any framework on Vercel, you can do the following:

```tsx


import{ geolocation }from'@vercel/functions';

exportfunctionGET(request: Request){

const{ city }=geolocation(request);

returnnewResponse(`<h1>Your location is ${city}</h1>`,{

    headers:{'content-type':'text/html'},

});

}




```

Reading the city from the geo IP headers in a Vercel Function.

In the above example, we import the 
```
geolocation
```
 helper from 
```
@vercel/functions
```
. We then call it with the incoming request object and extract the city property. Finally, we return a response containing the extracted city information.

By leveraging the power of geo IP headers with Vercel, you can create dynamic and personalized experiences for your users based on their location. Whether it's displaying localized content or implementing custom logic based on geographic data, these helpers provide a convenient way to achieve geolocation functionality in your Vercel projects.

For more details on using geo IP headers with Vercel for geolocation in Vercel Functions and Middleware, refer to [Vercel documentation](https://vercel.com/docs/functions/edge-functions/edge-functions-api#geolocation). You can also [clone and deploy an example](https://edge-functions-geolocation.vercel.sh/) to see the geo IP headers in action.