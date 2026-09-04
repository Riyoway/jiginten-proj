# Stack decision — 2026

更新基準日: 2026-09-03

## 結論

この案件は **React 19.2 + TypeScript 7 + Vite 8.2 + HeroUI v3 + Tailwind CSS v4.3 + TanStack Router + Zustand + hls.js + native EventSource/fetch** を中心にします。

バックエンドが固定なので、Next.jsのServer Actions/RSC/API Routesのようなサーバー側機能を増やしても、利用可能なデータや操作は増えません。むしろブラウザAPI中心の配信画面ではCSRを明確にした方が構造が単純です。

## React 19.2

採用理由:

- 大規模UIをfeature単位に分割しやすい。
- プレイヤー、チャット、ギフト、弾幕など「独立して状態を持つUI」をコンポーネント境界で整理できる。
- 2026年時点のReact公式最新系が19.2。
- HeroUI v3の要件がReact 19+。

この案件でReactを使う目的はSSRではなく、複雑なクライアントUIを安全に分割することです。

## TypeScript 7

採用理由:

- APIレスポンスを `IncomingComment`, `Gift`, `SendMessagePayload` として明文化できる。
- 「APIに本当に存在するもの」と「UI上の表示モデル」を型で分離できる。
- 2026年のTypeScript 7はネイティブ実装になり、大規模な型チェックが大幅に高速化されています。

このプロジェクトでは特に、バックエンド仕様が薄いからこそTypeScriptが重要です。曖昧なpayloadにフロント側の推測を混ぜないために使います。

## Vite 8.2

採用理由:

- 完全CSRとの相性が良い。
- Vite 8はRolldownベースになり、開発・ビルドが高速。
- HLS、EventSource、Fullscreen、PWAなどブラウザ中心の構成に余分なサーバー層を追加しない。
- Vercel / Cloudflare Pagesのどちらでも静的配信しやすい。

### なぜNext.jsではないか

Next.jsを否定しているわけではありません。今回の条件では不要なだけです。

現状のデータ経路は以下です。

```text
Browser
  ├─ HLS URL
  ├─ SSE /events
  ├─ POST /messages
  └─ GET /items
```

SSRやServer Componentsを入れても、このAPI契約自体は増えません。SEOが必要な公開ランディングページを後から別に作る場合は、その部分だけSSG/SSRを検討できます。

## HeroUI v3 + Tailwind CSS v4.3

役割を分けます。

HeroUI:

- Button
- Modal / Drawer
- Popover
- Tooltip
- Menu
- Form controls
- accessible primitives

Tailwind / project CSS:

- プレイヤーレイアウト
- 縦型/横型切替
- チャット配置
- 弾幕
- ギフトカード
- レスポンシブ
- ブランドトークン

HeroUI v3はReact Ariaをベースにしており、アクセシビリティの土台を自作しなくてよい点を評価しています。一方、動画プレイヤーのような特殊UIをHeroUIだけで無理に構成しません。

## TanStack Router

現在のスターターは生成ファイルを必要としないcode-based routingで開始しています。

理由:

- `/` と `/watch` の2routeからすぐ動かせる。
- 型安全なLink/navigationを使える。
- routeが増えた時はfile-based routingへ移行できる。

将来的に `/following`, `/favorites`, `/history`, `/settings` が本実装される段階でfile-based routingに変更して構いません。

## Zustand

グローバル状態は少なく保ちます。

保存するもの:

- mute
- volume
- danmaku on/off
- danmaku opacity
- chat visibility

リアルタイムコメントもZustandに入れていますが、最大300件に制限しています。大量履歴を永続化する用途には使いません。

### Reduxを使わない理由

現状のドメイン状態が小さく、Redux Toolkitの導入コストに見合いません。複数配信、認証、権限、複雑なサーバー同期が入るまではZustandで十分です。

## hls.js

既存配信URLが `.m3u8` なので、Chromium/Firefox系ではhls.js、Safari/iOSではnative HLSへfallbackします。

安定版を優先し、RC版ではなく1.6系を採用しています。配信基盤を変更できない以上、プレイヤー側は「安定再生・エラー復旧・UI」が最優先です。

## Native EventSource / fetch

SSEのために別ライブラリは追加しません。

- SSE: `EventSource`
- GET/POST: `fetch`

で必要十分です。

Axios等を入れない理由は、現在のAPIが少数かつ単純だからです。

## TanStack Queryを初期導入しない理由

TanStack Queryは優秀ですが、現在のデータは次の性質です。

- HLS: 長寿命media connection
- SSE: 長寿命event connection
- POST messages: 単発mutation
- GET items: 初回open時に1回取得

一般的な `GET → cache → invalidate → refetch` が中心ではないため、最初から入れません。

APIが増え、配信一覧、ユーザープロフィール、検索、フォロー状態などのserver stateが追加されたら導入候補です。

## PWA

PWAはApp Shellのみキャッシュ対象にします。

**絶対にキャッシュしないもの:**

- `.m3u8`
- HLS segment
- SSE `/events`
- `/messages`
- `/items`

このスターターでは外部APIをruntimeCachingに登録せず、Service Workerを通さずにネットワークへ直接送ります。

## Testing

- Vitest: unit/component
- Testing Library: UI behavior
- Playwright: desktop/mobile E2E
- Biome: lint + format

配信APIが外部に固定されているため、テストでは実APIに依存しすぎないことが重要です。API adapter単位でmockし、E2Eの最小smokeだけUIシェルを確認する方針です。
