# Cross-site iframe prerendering test

- [Chrome Status](https://chromestatus.com/feature/5112398709129216)
- Origin trial: [Chrome](https://developer.chrome.com/origintrials/#/register_trial/790944684556943361) (M147 to M152), [Edge](https://developer.microsoft.com/microsoft-edge/origin-trials/trials/46c24517-496a-4a6b-a4d3-604b08620d43)
- [Explainer](https://github.com/WICG/nav-speculation/blob/main/prerendering-cross-origin-iframes.md)

When a page is prerendered, its cross-site iframes normally don't load until the user navigates to it, so they're still loading after activation. With `Supports-Loading-Mode: prerender-cross-origin-frames`, a cross-site iframe can opt in to loading during prerendering instead.

## What this demo shows

A prerendered page with two levels of nested cross-site iframes, each opting in. You should see every frame load while still prerendering, then fire `prerenderingchange` on activation. Removing the opt-in header from a frame makes it, and everything under it, wait for activation instead.

## How it works

```text
Page A                  site-a.test:8080
└─ prerenders Page B    site-a.test:8080
   └─ iframe: Page C    site-c.localhost:8082
      └─ iframe: iframe-content    site-b.example:8081
```

[`server.js`](server.js) runs one Express server per origin. Response headers come from sidecar `.headers` files. Page B and Page C both send the opt-in header, so it's tested at each level of nesting.

## Setup

1. In Chrome, enable `chrome://flags/#prerender2-cross-origin-iframes`.
2. Add these entries to your hosts file (`C:\Windows\System32\drivers\etc\hosts` or `/etc/hosts`):

   ```text
   127.0.0.1  site-a.test
   127.0.0.1  site-b.example
   127.0.0.1  site-c.localhost
   ```

3. Install and start the servers:

   ```sh
   npm install
   npm start
   ```

## Run the test

1. Open http://site-a.test:8080/page-a.html.
2. Click **Start Prerendering**. Confirm Page B is ready in DevTools under **Application > Speculative loads**.
3. Click **Navigate to Page B**.

Each frame logs its own state. When the opt-in works, Page B, Page C, and the nested iframe each log `document.prerendering = true` on load and fire `prerenderingchange` on activation.

## Compare without the opt-in

| Change | Expected result |
| --- | --- |
| Clear `page-c.html.headers` | Page C prerenders; its nested iframe waits for activation. |
| Clear `page-b.html.headers` | The whole iframe chain waits for activation. |

Headers are read on every request, so there's no need to restart the server.
