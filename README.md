# Cross-Site Iframe Prerendering Test

Tests the `Supports-Loading-Mode: prerender-cross-origin-frames` header for prerendering pages that contain cross-site (and nested cross-site) iframes via the Speculation Rules API.

## Architecture

```
Page A (site-a.test:8080)
  └─ prerenders Page B (site-a.test:8080) via Speculation Rules
       └─ embeds Page C (site-c.localhost:8082) — cross-site iframe
            └─ embeds iframe-content (site-b.example:8081) — nested cross-site iframe
```

Three Express servers run in a single process. Custom HTTP headers are applied via sidecar `.headers` files (e.g. `page-b.html.headers`).

## Prerequisites

- Node.js
- Chrome 146+

Add to your hosts file (`C:\Windows\System32\drivers\etc\hosts` or `/etc/hosts`):

```
127.0.0.1  site-a.test
127.0.0.1  site-b.example
127.0.0.1  site-c.localhost
```

## Run

```bash
npm install
npm start
```

Open http://site-a.test:8080/, then use DevTools Network tab (with "Preserve log") to observe iframe requests firing during prerender.

