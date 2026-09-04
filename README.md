# Streamly

HLSライブ配信、リアルタイムチャット、ギフト、弾幕表示に対応したストリーミングサービスのフロントエンドです。

## Stack

- React
- TypeScript
- Vite
- HeroUI / Tailwind CSS
- TanStack Router
- Zustand
- hls.js
- EventSource / Fetch API
- Vite PWA
- Vitest / Testing Library
- Playwright
- Biome

## Development

```powershell
pnpm install
pnpm dev
```

Production build:

```powershell
pnpm build
pnpm preview
```

## Routes

- `/` — ホーム
- `/watch` — ライブ配信視聴画面
- `/favorites` — お気に入り
- `/follows` — フォロー中
- `/history` — 視聴履歴

## Documentation

読む順番と各資料の役割は [`Docs/README.md`](Docs/README.md) にまとまっています。
実装状況と壊してはいけない判断は [`Docs/HANDOFF.md`](Docs/HANDOFF.md) から。
