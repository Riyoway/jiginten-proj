# Frontend / UX strategy

## 1. Player first

配信サービスの中心は動画です。
UIカードや装飾を増やすより、まず次を優先します。

- 映像面積
- 再生の安定性
- controlの視認性
- 横型/縦型切替
- fullscreen
- chatとのバランス

## 2. Landscape / Portrait

`loadedmetadata`後に次で判定します。

```ts
video.videoHeight > video.videoWidth
```

Landscape desktop:

```text
+-----------------------------+----------+
|            VIDEO            |   CHAT   |
|                             |          |
+-----------------------------+----------+
```

Portrait desktop:

```text
+-----------------------------+----------+
|       +-----------+         |   CHAT   |
|       |  9 : 16   |         |          |
|       |   VIDEO   |         |          |
|       +-----------+         |          |
+-----------------------------+----------+
```

Mobile:

```text
+------------------+
|      VIDEO       |
+------------------+
| stream metadata  |
+------------------+
|       CHAT       |
+------------------+
```

映像は`object-fit: contain`が基本です。

## 3. Danmaku

弾幕はチャットとは別UIですが、同じSSEデータを使います。

実装方針:

- connectionは共有
- 7 laneを順番に利用
- `transform: translate3d()`で移動
- `will-change: transform`
- pointer-events: none
- 最大表示時間を決めてDOMから削除
- `prefers-reduced-motion`を尊重

将来大量コメントが必要になったらCanvas/WebGLを検討します。現在規模ではCSS transformの方が保守しやすいです。

## 4. Gift UI

ギフトは絵文字リアクションではありません。

通常messageと視覚的階層を分けます。

### Normal

```text
[avatar] Guest
         こんにちは
```

### Gift only

```text
+--------------------------+
| [avatar] Guest    GIFT   |
|        [gift icon]       |
|        Heart             |
+--------------------------+
```

### Gift + message

```text
+--------------------------+
| [avatar] Guest    GIFT   |
|        [gift icon]       |
|        Heart             |
|   "がんばれー！"         |
+--------------------------+
```

入力欄のすぐ横にgift buttonを置き、open時だけcatalogを取得します。

## 5. Default avatar

APIからユーザー画像を取得できないので、チャットの各メッセージには`public/avatars/`内の画像からランダムに1枚選んで表示します（`src/lib/avatars.ts`）。

assets:

```text
public/avatars/avatar1.png
public/avatars/avatar2.png
public/avatars/avatar3.png
public/avatars/avatar4.png
```

## 6. Home

バックエンドに配信一覧APIがないため、ホームで「複数の実配信が存在する」ような偽データは出しません。

`Docs/reference/ui/home-concept.png`のレイアウト（Hero / カテゴリー / おすすめのライブ / 右カラム）は視覚的に再現しますが、実データの裏付けがないセクションは実データのふりをせず、明示的に「近日公開」で示します。

- ブランドhero + 実配信への導線（実データ）
- 人気のカテゴリー（レイアウトのみ再現、Coming soon。ラベルはあっても配信数は出さない）
- おすすめのライブ 5枚グリッド（1枚目は実配信、残り4枚はComing soonのplaceholderカード）
- 右カラム: フォロー中のライブ / トップギフター（いずれもComing soon）、ギフトCTA（実際の`/watch`へのリンク・実データ）
- feature説明

Coming soon表示は`src/components/ui/ComingSoonPanel.tsx`に集約し、具体的な偽の名前・数値・ランキングは一切含めません（抽象的なplaceholder行のみ）。配信一覧・カテゴリー・フォロー・ギフトランキングAPIが追加された時点で、該当パネルを実データ表示に差し替えます。

## 7. Accessibility

最低限守るもの:

- buttonにはaccessible name
- gift pickerは`aria-expanded`
- selected giftは`aria-pressed`
- chat streamは`aria-live="polite"`
- keyboard Enter送信時にIME compositionを考慮
- reduced motion対応
- focus ringを消さない

## 8. Performance

- commentsは300件上限
- gift listはlazy fetch
- EventSourceは1本
- HLS worker有効
-画像assetは必要サイズに縮小
- PWAでAPI/HLSをcacheしない

React memoを無差別に入れません。Profilerで必要な箇所だけ最適化します。
