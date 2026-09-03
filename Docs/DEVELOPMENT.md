# Development guide

## Requirements

- Node.js 24 LTS
- Corepack
- pnpm 10

## First run

PowerShell:

```powershell
corepack enable; corepack prepare pnpm@10.15.1 --activate; pnpm install; Copy-Item .env.example .env -ErrorAction SilentlyContinue; pnpm dev
```

`.env`を作らなくても、現在の固定endpointがdefault値として入っています。

## Commands

```text
pnpm dev       development server
pnpm build     typecheck + production build
pnpm preview   preview production build
pnpm lint      Biome check
pnpm lint:fix  Biome autofix/format
pnpm test      Vitest
pnpm test:e2e  Playwright
```

## Environment variables

```text
VITE_STREAM_URL
VITE_COMMENTS_URL
VITE_MESSAGES_URL
VITE_GIFTS_URL
```

固定APIを差し替える必要がない限り変更不要です。

## Deploy

このアプリはCSRなので、Vercel / Cloudflare Pagesどちらでも静的buildとして配信できます。

Build command:

```text
pnpm build
```

Output:

```text
dist/
```

SPA fallbackで`index.html`へrewriteしてください。

## PWA caveat

Service Workerは外部APIをNetworkOnlyにしています。
配信manifest/segmentやSSEをcacheする設定に変更しないでください。

## Testing strategy

Unit:
- payload creation
- API adapter behavior
- store dedupe
- gift selection

Component:
- chat composer
- gift+message
- danmaku toggle

E2E:
- home renders
- desktop/mobile layout
- watch route loads

外部APIのavailabilityをCI success条件にしない方が安全です。
