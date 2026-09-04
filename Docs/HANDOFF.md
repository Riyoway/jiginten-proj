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

画面は `/`(Home)・`/watch`(視聴)・`/favorites`(お気に入り)・`/follows`(フォロー中)・
`/history`(履歴) の5つ。視聴チャンネルは
**URL の検索パラメータ**(`/watch?channel=<id>`)が正で、storeには持たせません。

---

## 2. 今どこまで実データで動いているか

| 機能 | 状態 | 実装 |
|---|---|---|
| HLS再生(マルチチャンネル) | **実データ** | `lib/api/channels.ts`, `store/channels.ts`, `features/player/*` |
| チャンネル一覧(Home グリッド / sidebar) | **実データ** | `features/home/StreamCard.tsx`, `AppShell.tsx` |
| チャット(SSE受信・送信) | **実データ** | `features/chat/*`, `store/comments.ts`(上限300件) |
| 弾幕 | **実データ**(チャットと同一ストリーム) | `features/danmaku/DanmakuLayer.tsx` |
| ギフト送信・一覧 | **実データ**(cost / group / animationUrl まで使用) | `features/gifts/*`, `lib/api/gifts.ts` |
| ギフトクレジット | **実データだが端末内のみ**(初期3000、送信成功でcost減算、補充なし) | `store/credits.ts` |
| ギフトのアニメーション演出 | **実データ**(SSEのanimationUrlを5秒再生) | `features/player/GiftOverlay.tsx` |
| フォロー / お気に入り | **実データだが端末内のみ**(localStorage) | `store/follows.ts`, `favorites.ts`, `createIdSetStore.ts` |
| 視聴履歴 | **実データだが端末内のみ**(新しい順・上限30件、`WatchPage`のmountで記録) | `store/history.ts` |
| フォロー中のライブ(Home右カラム) | **実データ**(フォロー済み ∩ 配信中) | `features/home/FollowedChannelsPanel.tsx` |
| お気に入り / フォロー中 / 履歴の一覧ページ | **実データ**(保存済み ∩ 配信中、配信していない分は件数のみ) | `features/collections/CollectionPages.tsx`(3画面で1コンポーネントを共有) |
| PWAインストール導線 | 実装済み | `lib/pwaInstall.ts` |
| カテゴリー / トップギフター | **未対応**(`ComingSoonPanel`) | `components/ui/ComingSoonPanel.tsx` |
| 検索 / 通知 / 人気 / プロフィール・設定メニュー | **未対応**(disabled表示のみ) | `AppShell.tsx` |
| 視聴者数・フォロワー数・ランキング・配信スケジュール | **出さない**(APIに無い) | — |

---

## 3. 壊してはいけない設計判断

1. **APIに無いデータを捏造しない。** 視聴者数・フォロワー数・ランキング・カテゴリー件数などは
   数値を出さず、`ComingSoonPanel`で「近日公開」と明示する。`Docs/LIMITATIONS.md`が一次資料。
2. **`channel.title` はコンテンツ名で、配信者名ではない。** 1チャンネル=最大1ライブなので、
   同時に3ライブが立っている今は「3つの別チャンネル」。チャンネル識別をアバターと並べて出す箇所
   (sidebar行 / 視聴画面のチャンネル行)は `getStreamlyUserName(id, channelIds)`(`lib/streamlyUsers.ts`)の
   仮名を使う。`channelIds`には取得したチャンネル一覧全体を渡し、`channel.title`は「配信中の内容」として
   別要素で表示する。chatの`Guest`と同じ理屈。
3. **チャットはチャンネル別に分けない。** `/events`・`/messages`に`channelId`が無いため、
   全チャンネル共通の1本のまま。フロントだけの偽の分離は禁止。
4. **`EventSource`は1本だけ。** `useCommentStream`/`useCommentStore`経由でチャットと弾幕が共有する。
5. **チャンネル一覧をコードに固定しない。** 必ず`fetchChannels()`→`useChannels()`経由で取得し、
   選択は`resolveSelectedChannel()`(URL指定 → `default:true` → 先頭 → `/stream.m3u8`)。
6. **リファレンス画像(`Docs/reference/ui/*.png`)に無い装飾を足さない。** 特に、セクション見出しの上に
   紫色の英語マイクロラベル(`CATEGORIES`等)は付けない。Home Heroの「ようこそ Streamly へ」だけが例外。
7. **Service WorkerでHLS/SSE/APIをキャッシュしない**(`vite.config.ts`の`NetworkOnly`)。
8. **CSSは機能単位のファイルへ。** `src/styles.css`は`@import`だけ。新規ルールは`src/styles/<feature>.css`。
9. **アニメーションWebPは`src`差し替え以外で止められない。** `animations/*.webp`はloop count 0の
   無限ループで、`<img>`に`play()`/`pause()`は無い。再生/停止は`iconUrl` ↔ `animationUrl`の差し替えで
   表現する(`features/gifts/GiftImage.tsx`に集約)。既定は静止アイコンで、
   ホバー中・プレイヤー演出の5秒間・チャットのギフト枠だけがアニメーションする。
   `base.css`の`prefers-reduced-motion`はCSSアニメーションにしか効かないので、
   モーション削減はJS側(`lib/reducedMotion.ts`)で静止アイコンに落とす。
10. **新着メッセージの検出は`useFreshMessages`を使う。** 件数差分で判定すると、
   commentストアが上限300件に達した瞬間から`messages.length`が固定されて新着が永久に取れなくなる
   (弾幕が死ぬバグが実際にあった)。最後に見たkey基準で判定する。
11. **「端末内のid集合 ∩ 配信中」の一覧を増やすときはページを複製しない。**
   `features/collections/CollectionPages.tsx`の共有コンポーネントに文言を渡すだけで足りる
   (お気に入り / フォロー中 / 履歴の3画面がこれで動いている)。

---

## 4. 直近のセッションでやったこと

- **マルチチャンネルHLS対応**: `/channels.json`起点に変更。`/watch?channel=<id>`、`/stream.m3u8`
  フォールバック、Homeグリッドとsidebarの実データ化。
- **ユーザー向け文言の監査**: 「固定 HLS endpoint」「API-aware UI」「このスターターで重視していること」など
  開発者向け文言を削除・書き換え。PWAマニフェスト/metaの英語説明も日本語の実文に変更。
- **リファレンス再照合**: 紫色の英語eyebrowを全削除(Hero以外)、sidebar見出しを「おすすめチャンネル」に、
  視聴画面のチャンネル名とコンテンツタイトルを分離。
- **フォロー / お気に入りを実装**(端末内のみ)。Home右カラムの「フォロー中のライブ」を実データ化し、
  sidebarの「お気に入り」を`/favorites`ページ(実データ)に接続。
- **視聴画面内のチャンネル切替UI(`ChannelSelector`)は明示的な依頼で削除済み。** 切替はHomeのカードか
  sidebarのリンクから`/watch?channel=<id>`へ遷移して行う。**勝手に復活させないこと。**
- **`/follows`と`/history`を追加し、sidebarの「フォロー中」「履歴」を実ページへ接続。** 既存の
  `FavoritesPage`を`features/collections/CollectionPages.tsx`の共有コンポーネントへ一般化して3画面で
  使い回している(CSSも`styles/favorites.css`→`styles/collections.css`、クラスは`.collection-*`)。
  履歴は`store/history.ts`(新しい順・上限30件)で、`/history`に「履歴を削除」ボタンがある。
- **sidebarの余白調整**: おすすめチャンネル行を詰め、Home右カラム「フォロー中のライブ」の行を大きくした。
- **モバイルのdockをiOSのtab bar風に作り直した**(`app-shell.css`の`max-width: 720px`ブロック)。
  元は`repeat(2, 1fr)`固定の角丸バーで、項目を増やすと64pxからはみ出して「お気に入り」が
  見えなくなっていた。現在は端まで伸ばした角丸なし・上辺hairline・半透明+`backdrop-filter`で、
  項目数に追従する1行グリッド、アイコン上に10pxラベル、tap領域は1タブ64x49px。
  activeはtint色のみ(rail用の左端barと横gradientはtab barでは向きが合わないので打ち消す)。
  下端の余白は`env(safe-area-inset-bottom)`で確保する(home indicator分を固定pxで足さない)。
  **sidebarのnav項目は「人気」も含めて全部dockに出す**(以前はモバイルで`.nav-item.muted`を
  非表示にしていた)。dockはnav専用なので、インストールボタンだけ
  `topbar-install-btn`としてモバイルのtopbarへ出している(プロフィールは元からtopbarのavatar)。

---

- **topbarの重なりを構造で解消**: 検索欄を中央寄せしつつ右のアクション(アイコン/アバター画像)を
  `position: absolute`で重ねていたため、800〜1280px付近で両者が重なっていた。
  `.topbar`を`1fr minmax(0, 520px) 1fr`の3トラックgridにして、狭いときは中央が縮んで避けるようにした
  (390〜1440pxで検索欄とアクションの間隔が常に正であることを確認済み)。
- **ネイティブスクロールバーを隠す範囲を整理**: `<html>`のスクロールバーはHomeだけがclass
  (`home-no-scrollbar`)で隠していたが、ルート間で有無が変わると幅が変動して内容が横にずれるので
  `base.css`で全画面に適用し、`HomePage`のuseEffectを削除。ギフト(アイテム選択欄)の
  `.gift-picker`も`.chat-list`と同じ扱いで非表示にした。スクロール自体は効く。
- **カードのサムネイルを「画像なし」プレースホルダー画像に変更**(`public/noimage.jpg`)。
  チャンネル別の3色グラデーション(`thumb-0/1/2`)は依頼により削除。サムネイルAPIが無いのは変わらず、
  実写や偽の内容は出していない。PNG 1MBで受け取ったものを960x540のJPEG(25KB)に落として置いている。

- **sidebarのチャンネル一覧をランダム5件に絞り、仮名の重複を直した**:
  `/channels.json`が3→13件に増えた結果、(1)sidebarが縦に溢れてプロフィール/インストールが
  スクロールしないと届かず、(2)`getStreamlyUserName`が10個の固定プールから選んでいたため
  別チャンネルに同じ「Streamly User 4」が付いていた。
  前者は`pickRandom(channels, 5)`(`lib/pickRandom.ts`)+ チャンネル一覧側で縦の余りを吸収する形にし、
  後者は**一覧全体を基準に一意な番号を振る**方式(`getStreamlyUserName(id, channelIds)`)へ変更。
  3つの呼び出し箇所すべてに同じ一覧を渡すこと(渡す一覧が違うと同じチャンネルが画面ごとに別名になる)。
- **ギフト周りを`/items`の全フィールドで作り直した**:
  `Gift`型を6フィールドに拡張(`gifts.ts`は生のitemsを返していたので実行時には元から乗っていた)、
  ピッカーにcost表示・グループタブ(HeroUI `Tabs`、**グループはAPIの値から動的生成**)・
  残高不足カードのdisabled、ヘッダーのギフトボタンをリンクからHeroUI `Tooltip`の残高表示に変更(遷移しない)、
  プレイヤー上に`GiftOverlay`(受信したギフトのanimationUrlを5秒再生、z-index 7)、
  チャットのギフト枠は常にアニメーション再生、Homeのギフト CTA はランダムチャンネルへ。
- **弾幕の実バグを修正**: `DanmakuLayer`が件数差分で新着判定していたため、
  commentストアが上限300件に達すると以降の弾幕が出なくなっていた。
  `store/comments.ts`の`useFreshMessages`(最後に見たkey基準)に統一し、回帰テストを追加。
  `GiftOverlay`も同じhookを使うので同じ罠を踏まない。

## 5. 未着手 / 既知の穴

- **トップギフター**: 依頼により未着手。ランキングAPIが無いので現状`ComingSoonPanel`のまま。
- **~~`/items`の未使用フィールド~~ 対応済み**: `cost`(価格表示)・`group`(グループタブ)・
  `animationUrl`(アニメーション演出)をすべて使用中。`Gift`型も6フィールドに拡張済み。
- **「人気」はランキングAPIが無いためdisabledのまま。** 一覧を出せる材料が無い。
- **quality selector**: `Docs/HLS-SERVER.md`の方針通り、hls.jsが実際に複数levelを検出したときだけ出す。未着手。
- **バンドルサイズ**: JSが約1.1MB(gzip約346KB)。HeroUI導入分。必要なら`dynamic import()`で分割。
- **HeroUI移行が中途**: Hero CTA・player controls・chat composer・gift picker等はまだ素の`<button>`。
  `CLAUDE.md`の方針(汎用UIはHeroUI優先)に合わせるなら段階的に置換。
- **~~既存のBiome指摘~~ 解消済み。`pnpm lint`は緑が正常になった。** 赤が出たらそれは自分の差分。
  経緯と、意図的に`biome-ignore`で残している箇所は「7. lintとBiomeの扱い」を参照。

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
pnpm lint       # biome check .(0件が正常。赤くなったら自分の差分が原因)
pnpm test       # vitest: unit + component (現在83件)
pnpm build      # tsc -b + vite build
pnpm test:e2e   # playwright: chromium + mobile (現在8件)
```

### lintとBiomeの扱い

`pnpm lint`は以前50 errors / 10 warningsで**構造的に絶対通らない**状態だったが、解消済み。原因と対処:

- **改行コード**: `core.autocrlf=true`のWindowsではチェックアウトのたびに全ファイルがCRLFになり、
  LF基準のBiomeが「触っていないファイルまで整形エラー」を出していた(41ファイル中29ファイルがこれ)。
  `.gitattributes`の`* text=auto eol=lf`で作業ツリーもLFに固定した。**このファイルを消すと再発する。**
  CRLF↔LFの変換はgitのcleanフィルタで正規化されるので、コミット差分には出ない。
- **残りの整形差分**は`biome check --write`で解消(14ファイル/117行、整形とimport順のみ)。
- **意図的に残している`!important`等**は`biome-ignore`に理由を書いてある(`base.css`の
  reduced-motion打ち消し、`app-shell.css`のHeroUI詳細度対策、`main.tsx`の`#root`)。
  ルール自体をbiome.jsonでoffにはしていないので、**理由の無い新規の`!important`はちゃんと警告が出る。**
- `biome.json`は`biome migrate`済み(schema 2.5.11 / `rules.preset`)。

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
