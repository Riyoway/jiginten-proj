# Handoff

最終更新: 2026-09-04 / 対象ブランチ: `feature/local-engagement`

このファイルは「次に触る人が最初に読む1枚」です。設計の理由は各設計資料(`README.md`の読む順番)に、
ここには**今どこまで動いているか・何を壊してはいけないか・どこに穴があるか**だけを書きます。

---

## 1. 何を作っているか

Streamly — HLSライブ配信の視聴フロントエンド(React 19 + Vite + TanStack Router + Zustand + HeroUI v3)。
バックエンドは変更不可で、使える I/O は以下だけです。

```text
HLS      GET /channels.json / /stream.m3u8 / /ch/<id>/stream.m3u8 / /ch/<id>/segments/{n}.ts
コメント  GET /events (SSE) / POST /messages
ギフト    GET /items
```

画面は `/`(Home) と `/watch`(視聴) の2つだけ。視聴チャンネルは **URL の検索パラメータ**
(`/watch?channel=<id>`)が正で、storeには持たせません。

---

## 2. 今どこまで実データで動いているか

| 機能 | 状態 | 実装 |
|---|---|---|
| HLS再生(マルチチャンネル) | **実データ** | `lib/api/channels.ts`, `store/channels.ts`, `features/player/*` |
| チャンネル一覧(Home グリッド / sidebar) | **実データ** | `features/home/StreamCard.tsx`, `AppShell.tsx` |
| チャット(SSE受信・送信) | **実データ** | `features/chat/*`, `store/comments.ts`(上限300件) |
| 弾幕 | **実データ**(チャットと同一ストリーム) | `features/danmaku/DanmakuLayer.tsx` |
| ギフト送信・一覧 | **実データ** | `features/gifts/*`, `lib/api/gifts.ts` |
| フォロー / お気に入り | **実データだが端末内のみ**(localStorage) | `store/follows.ts`, `favorites.ts`, `createIdSetStore.ts` |
| フォロー中のライブ(Home右カラム) | **実データ**(フォロー済み ∩ 配信中) | `features/home/FollowedChannelsPanel.tsx` |
| PWAインストール導線 | 実装済み | `lib/pwaInstall.ts` |
| カテゴリー / トップギフター | **未対応**(`ComingSoonPanel`) | `components/ui/ComingSoonPanel.tsx` |
| 検索 / 通知 / 履歴 / プロフィール・設定メニュー | **未対応**(disabled表示のみ) | `AppShell.tsx` |
| 視聴者数・フォロワー数・ランキング・配信スケジュール | **出さない**(APIに無い) | — |

---

## 3. 壊してはいけない設計判断

1. **APIに無いデータを捏造しない。** 視聴者数・フォロワー数・ランキング・カテゴリー件数などは
   数値を出さず、`ComingSoonPanel`で「近日公開」と明示する。`Docs/LIMITATIONS.md`が一次資料。
2. **`channel.title` はコンテンツ名で、配信者名ではない。** 1チャンネル=最大1ライブなので、
   同時に3ライブが立っている今は「3つの別チャンネル」。チャンネル識別をアバターと並べて出す箇所
   (sidebar行 / 視聴画面のチャンネル行)は `getStreamlyUserName(id)`(`lib/streamlyUsers.ts`)の
   仮名を使い、`channel.title`は「配信中の内容」として別要素で表示する。chatの`Guest`と同じ理屈。
3. **チャットはチャンネル別に分けない。** `/events`・`/messages`に`channelId`が無いため、
   全チャンネル共通の1本のまま。フロントだけの偽の分離は禁止。
4. **`EventSource`は1本だけ。** `useCommentStream`/`useCommentStore`経由でチャットと弾幕が共有する。
5. **チャンネル一覧をコードに固定しない。** 必ず`fetchChannels()`→`useChannels()`経由で取得し、
   選択は`resolveSelectedChannel()`(URL指定 → `default:true` → 先頭 → `/stream.m3u8`)。
6. **リファレンス画像(`Docs/reference/ui/*.png`)に無い装飾を足さない。** 特に、セクション見出しの上に
   紫色の英語マイクロラベル(`CATEGORIES`等)は付けない。Home Heroの「ようこそ Streamly へ」だけが例外。
7. **Service WorkerでHLS/SSE/APIをキャッシュしない**(`vite.config.ts`の`NetworkOnly`)。
8. **CSSは機能単位のファイルへ。** `src/styles.css`は`@import`だけ。新規ルールは`src/styles/<feature>.css`。

---

## 4. 直近のセッションでやったこと

- **マルチチャンネルHLS対応**: `/channels.json`起点に変更。`/watch?channel=<id>`、`/stream.m3u8`
  フォールバック、Homeグリッドとsidebarの実データ化。
- **ユーザー向け文言の監査**: 「固定 HLS endpoint」「API-aware UI」「このスターターで重視していること」など
  開発者向け文言を削除・書き換え。PWAマニフェスト/metaの英語説明も日本語の実文に変更。
- **リファレンス再照合**: 紫色の英語eyebrowを全削除(Hero以外)、sidebar見出しを「おすすめチャンネル」に、
  視聴画面のチャンネル名とコンテンツタイトルを分離。
- **フォロー / お気に入りを実装**(端末内のみ)+ Home右カラムの「フォロー中のライブ」を実データ化。
- **視聴画面内のチャンネル切替UI(`ChannelSelector`)は明示的な依頼で削除済み。** 切替はHomeのカードか
  sidebarのリンクから`/watch?channel=<id>`へ遷移して行う。**勝手に復活させないこと。**

---

## 5. 未着手 / 既知の穴

- **トップギフター**: 依頼により未着手。ランキングAPIが無いので現状`ComingSoonPanel`のまま。
- **`/items`の未使用フィールド**: `Docs/ITEMS-API.md`の通り`cost` / `group` / `animationUrl`が実在するが、
  `lib/api/contracts.ts`の`Gift`型はid/name/iconUrlのみ。価格表示・グループ分けタブ・アニメーション
  ギフトは**実データで作れる余地がある**。
- **フォロー中/お気に入りの一覧ページが無い**ため、sidebarの該当nav項目はdisabledのまま。
- **quality selector**: `Docs/HLS-SERVER.md`の方針通り、hls.jsが実際に複数levelを検出したときだけ出す。未着手。
- **バンドルサイズ**: JSが約1.1MB(gzip約346KB)。HeroUI導入分。必要なら`dynamic import()`で分割。
- **HeroUI移行が中途**: Hero CTA・player controls・chat composer・gift picker等はまだ素の`<button>`。
  `CLAUDE.md`の方針(汎用UIはHeroUI優先)に合わせるなら段階的に置換。
- **既存のBiome指摘が残っている**: `hero-panel::before`のフォーマット、`.topbar-icon-btn svg`の`!important`、
  `player.css`のdescending specificity、`GiftPicker`の`aria-label`、`ChatPanel`のuseEffect依存など。
  いずれも今回のタスク範囲外として温存。`pnpm lint`はこれらで失敗するので、変更前後の差分で判断すること。

---

## 6. 落とし穴(先に知っておくと得)

- **jsdomの穴はテストセットアップで埋めてある**(`src/test/setup.ts`)。`EventSource`・`Element.scrollTo`・
  `HTMLMediaElement.play`のstubが無いと、`/watch`をrenderするテストは全部落ちる。
- **コンポーネントテストは実ネットワークを叩かせない。** `useChannelStore.setState({channels, status:"loaded"})`
  でシードすると`load()`が早期returnする。`Docs/DEVELOPMENT.md`の「外部APIをCI成功条件にしない」方針。
- **同じテキストが複数箇所に出るため`getByText`/`getByRole`が衝突しやすい。** sidebarとメイン領域に
  同じチャンネル名が出るので、`within(...)`でコンテナを絞るか`pressed:`などで絞る。
- **e2eは実サーバーの`/channels.json`に依存する。** 並列ワーカーで遅延することがあるので、
  `tests/e2e/watch.spec.ts`ではタイムアウトを15秒に緩めてある。
- **Pythonでファイルを書くときは`newline="\n"`を指定する。** Windowsの`write_text`は`\n`→`\r\n`に変換し、
  Biomeが全行差分を出す(このリポジトリはLF)。
- **devサーバーのポートが流れる。** 5173が空いていないと5174, 5175…と上がる。終了時は残プロセスを掃除する。

---

## 7. 完了の定義 / 検証コマンド

```powershell
pnpm lint       # biome(既存指摘は上記参照。自分の差分がクリーンかで判断)
pnpm test       # vitest: unit + component (現在28件)
pnpm build      # tsc -b + vite build
pnpm test:e2e   # playwright: chromium + mobile (現在8件)
```

UI・レイアウト・レスポンシブ・状態表示を触ったら、**実ブラウザでデスクトップ幅とモバイル幅の両方**を
確認すること(`CLAUDE.md`のルール)。Claude in Chromeが使えないときは、`@playwright/test`を直接使った
使い捨てスクリプトでスクリーンショットとconsoleエラーを確認できる(プロジェクト直下に置いて実行する)。

---

## 8. 資料の読む順番

`Docs/README.md`参照。要点だけ:

- `STACK.md` — 技術選定の理由
- `API-INTEGRATION.md` — 固定APIの扱い方(HLS / SSE / messages / items)
- `HLS-SERVER.md` — マルチチャンネルHLSの仕様(一次資料)
- `ITEMS-API.md` — ギフトAPIの実レスポンス仕様
- `ARCHITECTURE.md` — ディレクトリとデータフロー
- `FRONTEND-UX.md` — 画面構成とUX方針
- `LIMITATIONS.md` — **APIに無いものの一覧と、UIでの誠実な扱い方**
- `DEVELOPMENT.md` — 開発・テスト・デプロイ
- `reference/ui/*.png` — Home/視聴画面のビジュアルターゲット
