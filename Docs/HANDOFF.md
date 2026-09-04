# Handoff

最終更新: 2026-09-04 / 対象ブランチ: `main`

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
| チャンネル一覧(Homeグリッド=全件 / sidebar=ランダム5件) | **実データ** | `features/home/StreamCard.tsx`, `AppShell.tsx`, `lib/pickRandom.ts` |
| 配信サムネイル | **実データ**(playlistの初回フレームを端末内キャッシュ、取得失敗時はnoimage) | `features/home/StreamThumbnail.tsx` |
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
| カテゴリー | **実データ**(`channel.category`を集計・絞り込み、0件はdisabled) | `features/home/HomePage.tsx` |
| トップギフター | **未対応**(`ComingSoonPanel`) | `components/ui/ComingSoonPanel.tsx` |
| 検索 / 通知 / 人気 / プロフィール・設定メニュー | **未対応**(disabled表示のみ) | `AppShell.tsx` |
| 視聴者数・フォロワー数・ランキング・配信スケジュール | **出さない**(APIに無い) | — |

---

## 3. 壊してはいけない設計判断

1. **APIに無いデータを捏造しない。** 視聴者数・フォロワー数・ランキングは
   数値を出さず、`ComingSoonPanel`で「近日公開」と明示する。カテゴリー件数は
   `/channels.json`の`category`から導出する。`Docs/LIMITATIONS.md`が一次資料。
2. **`channel.title` はコンテンツ名で、配信者名ではない。** 1チャンネル=最大1ライブなので、
   `/channels.json`のN件は「N個の別チャンネル」(**3件から13件に増えた実績あり。件数を前提にしない**)。
   チャンネル識別をアバターと並べて出す箇所
   (sidebar行 / 視聴画面のチャンネル行)は `getStreamlyUserName(id, channelIds)`(`lib/streamlyUsers.ts`)の
   仮名を使う。`channelIds`には取得したチャンネル一覧全体を渡し、`channel.title`は「配信中の内容」として
   別要素で表示する。chatの`Guest`と同じ理屈。
3. **チャットはチャンネル別に分けない。** `/events`・`/messages`に`channelId`が無いため、
   全チャンネル共通の1本のまま。フロントだけの偽の分離は禁止。
4. **`EventSource`は1本だけ。** `useCommentStream`/`useCommentStore`経由でチャットと弾幕が共有する。
5. **チャンネル一覧をコードに固定しない。** 必ず`fetchChannels()`→`useChannels()`経由で取得し、
   選択は`resolveSelectedChannel()`(URL指定 → `default:true` → 先頭)。playlistはレスポンス値を使う。
6. **リファレンス画像(`Docs/reference/ui/*.png`)に無い装飾を足さない。** 特に、セクション見出しの上に
   紫色の英語マイクロラベル(`CATEGORIES`等)は付けない。Home Heroの「ようこそ Streamly へ」だけが例外。
7. **Service WorkerでHLS/SSE/APIを扱わない。** 外部APIはruntimeCachingに登録せず、ブラウザから直接ネットワークへ送る。
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

## 4. これまでにやったこと(新しい順)

### Homeカテゴリー / HLS設定(直近)

- **カテゴリーを実データ化**: `/channels.json`の`category`を集計して件数順に表示し、選択すると
  Homeのライブ一覧を絞り込む。既存のカテゴリー選択肢は0件でも残し、操作だけdisabledにする。
- **単体ストリーム設定を廃止**: 専用の環境変数とendpoint定義を削除。
  再生URLは常に選択した`channel.playlist`を`VITE_CHANNELS_URL`基準で解決する。
  `/channels.json`取得失敗・空の場合は互換ストリームへ切り替えず、取得エラーを表示する。

### ギフト / クレジット(直近)

- **`/items`の全フィールドを使うようにした**: `Gift`型を6フィールドへ拡張
  (`gifts.ts`は生のitemsを返していたので実行時には元から乗っていた=型を広げるだけで解禁できた)。
  ピッカーにcost表示・グループタブ(HeroUI `Tabs`、**グループはAPIの値から動的生成**)・
  残高不足カードのdisabled、ヘッダーのギフトボタンをリンクからHeroUI `Tooltip`の残高表示へ(遷移しない)、
  プレイヤー上に`GiftOverlay`(受信ギフトのanimationUrlを5秒再生、z-index 7)、
  チャットのギフト枠は常にアニメーション再生、Homeのギフト CTA はランダムチャンネルへ。
- **クレジット(端末内)**: `store/credits.ts`、初期3000、`POST /messages`が2xxで返った時点で`cost`を引く。
  補充手段は無し。詳細と「なぜその減算タイミングしか無いのか」は`Docs/LIMITATIONS.md`の Gift credits 節。
- **SSEの`item`が`cost`/`group`/`animationUrl`を含むことを実測で確定**(`Docs/ITEMS-API.md`の
  未確認事項から移動済み)。受信ギフトの演出に`/items`との突き合わせは不要。
- **弾幕の実バグを修正**: `DanmakuLayer`が件数差分で新着判定していたため、commentストアが上限300件に
  達すると以降の弾幕が永久に出なくなっていた。`store/comments.ts`の`useFreshMessages`
  (最後に見たkey基準)に統一し、回帰テストを追加。`GiftOverlay`も同じhookなので同じ罠を踏まない。
- **sidebarをランダム5件に絞り、仮名の重複を解消**: `/channels.json`が3→13件に増えた結果、
  (1)sidebarが縦に溢れてプロフィール/インストールがスクロールしないと届かず、
  (2)`getStreamlyUserName`が10個の固定プールからハッシュで選んでいたため別チャンネルに
  同じ「Streamly User 4」が付いていた(10枠に13件なので構造的に必然)。
  前者は`pickRandom(channels, 5)`+チャンネル一覧側で縦の余りを吸収、
  後者は**一覧全体を基準に一意な番号を振る**方式へ変更。

### 表示・レイアウト

- **topbarの重なりを構造で解消**: 検索欄を中央寄せしつつ右のアクションを`position: absolute`で
  重ねていたため800〜1280pxで衝突していた。`.topbar`を`1fr minmax(0, 520px) 1fr`の3トラックgridにし、
  狭いときは中央が縮んで避ける(390〜1440pxで間隔が常に正であることを確認済み)。
- **モバイルのdockをiOSのtab bar風に作り直した**(`app-shell.css`の`max-width: 720px`ブロック)。
  元は`repeat(2, 1fr)`固定の角丸バーで、項目を増やすと64pxからはみ出して「お気に入り」が
  見えなくなっていた。現在は端まで伸ばした角丸なし・上辺hairline・半透明+`backdrop-filter`で、
  項目数に追従する1行グリッド、アイコン上に10pxラベル、tap領域は1タブ64x49px。
  activeはtint色のみ(rail用の左端barと横gradientはtab barでは向きが合わないので打ち消す)。
  下端の余白は`env(safe-area-inset-bottom)`で確保する(home indicator分を固定pxで足さない)。
  **sidebarのnav項目は「人気」も含めて全部dockに出す。** dockはnav専用なので、インストールボタンだけ
  `topbar-install-btn`としてモバイルのtopbarへ出している(プロフィールは元からtopbarのavatar)。
- **ネイティブスクロールバーを隠す範囲を整理**: `<html>`のスクロールバーはHomeだけがclassで
  隠していたが、ルート間で有無が変わると幅が変動して内容が横にずれるので`base.css`で全画面に適用し、
  `HomePage`のuseEffectを削除。`.gift-picker`も`.chat-list`と同じ扱いにした。スクロール自体は効く。
- **配信サムネイルを実装**(`features/home/StreamThumbnail.tsx`)。表示領域に近づいたカードの`playlist`から
  初回に取得できたフレームをJPEG化し、チャンネル単位で端末内キャッシュする。取得前・失敗時は
  `public/noimage.jpg`を表示し、サムネイルAPIや偽の映像は追加していない。
- **sidebarの余白調整**: おすすめチャンネル行を詰め、Home右カラム「フォロー中のライブ」の行を大きくした。

### 一覧ページ / 端末内ステート

- **`/follows`と`/history`を追加し、sidebarの「フォロー中」「履歴」を実ページへ接続。** 既存の
  `FavoritesPage`を`features/collections/CollectionPages.tsx`の共有コンポーネントへ一般化して3画面で
  使い回している(CSSも`styles/favorites.css`→`styles/collections.css`、クラスは`.collection-*`)。
  履歴は`store/history.ts`(新しい順・上限30件)で、`/history`に「履歴を削除」ボタンがある。
- **フォロー / お気に入りを実装**(端末内のみ)。Home右カラムの「フォロー中のライブ」を実データ化。

### それ以前(いまは前提として定着している)

- **マルチチャンネルHLS対応**: `/channels.json`起点へ変更。`/watch?channel=<id>`、
  Homeグリッドとsidebarの実データ化(→ §3-5)。
- **ユーザー向け文言の監査**: 開発者向け文言(「固定 HLS endpoint」等)を削除・書き換え。
  PWAマニフェスト/metaの英語説明も日本語の実文に変更。
- **リファレンス再照合**: 紫色の英語eyebrowを全削除(Hero以外)、sidebar見出しを
  「おすすめチャンネル」に、視聴画面のチャンネル名とコンテンツタイトルを分離(→ §3-2, §3-6)。
- **視聴画面内のチャンネル切替UI(`ChannelSelector`)は明示的な依頼で削除済み。** 切替はHomeのカードか
  sidebarのリンクから`/watch?channel=<id>`へ遷移して行う。**勝手に復活させないこと。**

---

## 5. 未着手 / 既知の穴

- **トップギフター**: 依頼により未着手。ランキングAPIが無いので現状`ComingSoonPanel`のまま。
- **~~`/items`の未使用フィールド~~ 対応済み**: `cost`(価格表示)・`group`(グループタブ)・
  `animationUrl`(アニメーション演出)をすべて使用中。`Gift`型も6フィールドに拡張済み。
- **「人気」はランキングAPIが無いためdisabledのまま。** 一覧を出せる材料が無い。
- **quality selector**: `Docs/HLS-SERVER.md`の方針通り、hls.jsが実際に複数levelを検出したときだけ出す。未着手。
- **バンドルサイズ**: JSが約1.13MB(gzip約356KB)、CSSが約436KB(gzip約44KB)。ほぼHeroUI分。
  vite が 500KB 超の警告を出し続けている。必要なら`dynamic import()`で分割。
- **HeroUI移行が中途**: `Tabs`(ギフトのグループ)・`Tooltip`(残高)・`Button`・`Card`・`Dropdown`は
  HeroUIだが、Hero CTA・player controls・chat composer・ギフトカードはまだ素の`<button>`。
  ギフトカードのように「HeroUIに相当物が無い独自UI」はそのままでよい。汎用UIだけ段階的に置換する。
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

- **5つの`VITE_*_URL`はすべて必須。** ホスティング側で値なしにすると`fetch("")` /
  `new EventSource("")`が現在のページURLへ相対解決し、送受信が死んだ実例がある。
  `lib/api/endpointConfig.ts`をVite設定とアプリで共有し、未設定・空・相対URL・HTTP(S)以外を
  dev server/build開始前に拒否する。実URLのソースコード内フォールバックは置かない。
  デプロイ済みバンドルを直接見るのが一番速い切り分けになる
  (`curl <site>/assets/index-*.js | grep -o '{stream:[^}]*'`)。

- **`/messages`はPOST専用。GETすると404。** `curl .../messages`は既定がGETなので404が返り、
  「エンドポイントが無い」と誤診しやすい。疎通確認は`-X POST`で行う。
  POSTは`202 Accepted` + `{id, timestamp}`を返し、**そのidはSSEイベントのidと一致する**。

### ギフト周りで実際に踏んだもの

- **`alt=""`の画像は`role="presentation"`になる。** `getByRole("img")`では絶対に取れないので、
  ギフト画像の検証は`container.querySelector("img")`で見る。
- **ギフトカードのアクセシブル名は「名前+コスト」の連結。** `{ name: "拍手" }`の完全一致では取れない
  (実際は`拍手1,000`)。`{ name: /拍手/ }`で部分一致させる。
- **`fireEvent.pointerEnter`はReactの`onPointerEnter`を発火しない。** Reactは
  `pointerover`/`pointerout`から enter/leave を合成しているので、テストでは`pointerOver`/`pointerOut`を使う。
  同様に`fireEvent.focus`も不安定なので、`act(() => el.focus())`と実物を呼ぶ。
- **React AriaのTooltipは最初の1回だけ表示までのウォームアップが長い**(0.8秒程度)。
  ホバー後600msで確認して「出ていない」と誤判定した。実装は正しかった。
- **HeroUIの`Tabs`は各タブに`width: 100%`を当てる**ので、5個並べると1個で幅を使い切る。
  `width: auto`で内容なりの幅にする。`data-slot`は`tabs` / `tabs-list` / `tabs-tab` / **`tabs-panel`**
  (`tab-panel`ではない — 間違えると縦のflexが繋がらずスクロール位置がずれる)。
- **`overflow: hidden`の兄弟がいるcolumn flexでは、要素の自動最小サイズが0になって潰れる。**
  ギフトカードのアイコンが28→22pxに潰れ、名前が見えなくなった。`flex: 0 0 auto`で固定する。
- **Playwrightの固定待ちで判定しない。** `/channels.json`は1.2秒では返らないことがあり、
  「ランダムチャンネルのリンクが付いていない」「アイコンが出ていない」と誤判定した。
  `waitForFunction`で条件を待つ。

---

## 7. 完了の定義 / 検証コマンド

```powershell
pnpm lint       # biome check .(0件が正常。赤くなったら自分の差分が原因)
pnpm test       # vitest: unit + component (現在88件)
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

> **ギフト送信の実地確認は共有の本番チャットに実際に投稿される**(全視聴者に見える)。
> 検証は最小限の回数にとどめる。5秒演出や減算はコンポーネントテスト側で押さえてあるので、
> 送信そのものを確認したいとき以外は投稿しなくてよい。

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
