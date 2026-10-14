# Cross-site iframe prerendering test

Tests [`Supports-Loading-Mode: prerender-cross-origin-frames`](https://github.com/WICG/nav-speculation/blob/main/prerendering-cross-origin-iframes.md), which lets a prerendered page load its cross-site iframes before activation instead of deferring them.

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
