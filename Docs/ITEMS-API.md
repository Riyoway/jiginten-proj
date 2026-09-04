# Items API 仕様書

## 概要

ギフト / アイテム一覧を取得する API。

- Method: `GET`
- Endpoint: `https://intern-comment-server.intern-comment-server.deno.net/items`
- Response: JSON
- 用途:
  - ギフト一覧表示
  - ギフト選択 UI
  - 価格表示
  - グループ別表示
  - アニメーション付きギフトの判定

---

## レスポンス形式

```json
{
  "items": [
    {
      "id": "heart",
      "name": "ハート",
      "iconUrl": "https://intern-comment-server.intern-comment-server.deno.net/icons/heart.webp?v=fcd08515",
      "cost": 10,
      "group": "気持ち",
      "animationUrl": null
    }
  ]
}
```

トップレベルは `items` 配列を持つオブジェクト。

---

## TypeScript 型定義

```ts
export type Item = {
  id: string;
  name: string;
  iconUrl: string;
  cost: number;
  group: string;
  animationUrl: string | null;
};

export type ItemsResponse = {
  items: Item[];
};
```

---

## Item フィールド

| フィールド | 型 | Nullable | 説明 |
|---|---|---:|---|
| `id` | `string` | No | アイテムを一意に識別する ID |
| `name` | `string` | No | UI に表示するアイテム名 |
| `iconUrl` | `string` | No | 一覧・チャット等で使用する WebP アイコン URL |
| `cost` | `number` | No | アイテムのコスト |
| `group` | `string` | No | アイテムのカテゴリ / グループ名 |
| `animationUrl` | `string \| null` | Yes | アニメーション用 WebP。アニメーションがない場合は `null` |

### URL について

`iconUrl` / `animationUrl` には以下のような `?v=...` が付与されている。

```text
/icons/heart.webp?v=fcd08515
```

```text
/animations/clap.webp?v=ddc48ca1
```

フロント側では URL を加工せず、API から返された値をそのまま使用する。

---

# 現在のアイテム一覧

現在のレスポンスには **20 アイテム**が含まれている。

## 気持ち

| id | name | cost | animation |
|---|---|---:|---|
| `heart` | ハート | 10 | なし |
| `star` | スター | 50 | なし |
| `sparkle-heart` | きらめくハート | 150 | なし |
| `thumbs-up` | いいね | 400 | なし |
| `clap` | 拍手 | 1000 | あり |

## 自然

| id | name | cost | animation |
|---|---|---:|---|
| `flower` | お花 | 10 | なし |
| `clover` | 四つ葉 | 50 | なし |
| `sun` | 太陽 | 150 | なし |
| `rainbow` | 虹 | 400 | なし |
| `butterfly` | 蝶 | 1000 | あり |

## 食べ物

| id | name | cost | animation |
|---|---|---:|---|
| `candy` | キャンディ | 10 | なし |
| `doughnut` | ドーナツ | 50 | なし |
| `ice-cream` | ソフトクリーム | 150 | なし |
| `pizza` | 大人気よくばりチーズたっぷりマルゲリータ | 400 | なし |
| `cake` | バースデーケーキ | 1000 | あり |

## お祝い

| id | name | cost | animation |
|---|---|---:|---|
| `balloon` | 風船 | 10 | なし |
| `gift` | プレゼント | 50 | なし |
| `crown` | 王冠 | 150 | なし |
| `trophy` | トロフィー | 400 | なし |
| `party-popper` | クラッカー | 1000 | あり |

---

# 現在確認できる規則性

レスポンス上では、各グループに 5 アイテムずつ存在する。

```text
気持ち
自然
食べ物
お祝い
```

各グループの `cost` は現在以下の並びになっている。

```text
10
50
150
400
1000
```

また、現在のレスポンスでは各グループの `cost: 1000` のアイテムだけ `animationUrl` が設定されている。

```text
clap
butterfly
cake
party-popper
```

ただし、これは現時点のレスポンスから確認できる規則であり、
将来も「1000 cost のアイテムだけにアニメーションがある」とは決めつけないこと。

フロント側では必ず、

```ts
if (item.animationUrl) {
  // animation を表示
}
```

のように `animationUrl` の有無を直接判定する。

---

# 推奨取得処理

```ts
const ITEMS_URL =
  "https://intern-comment-server.intern-comment-server.deno.net/items";

export async function fetchItems(): Promise<Item[]> {
  const response = await fetch(ITEMS_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch items: ${response.status}`);
  }

  const data = (await response.json()) as ItemsResponse;

  return data.items;
}
```

---

# グループ別表示

`group` が追加されているため、
フロント側で固定カテゴリをハードコードするより API の値から動的に生成する。

```ts
const groupedItems = items.reduce<Record<string, Item[]>>(
  (groups, item) => {
    (groups[item.group] ??= []).push(item);
    return groups;
  },
  {},
);
```

UI 例:

```text
すべて

気持ち
  ハート
  スター
  きらめくハート
  いいね
  拍手

自然
  お花
  四つ葉
  太陽
  虹
  蝶

食べ物
  ...

お祝い
  ...
```

---

# Gift Picker での利用

ギフト選択 UI では最低限以下を表示できる。

```text
iconUrl
name
cost
group
```

推奨カード:

```text
┌──────────────────┐
│      [icon]      │
│ ハート           │
│ 10               │
└──────────────────┘
```

`pizza` のように非常に長い名前も存在するため、
UI は固定幅 + 省略表示を前提にする。

例:

```css
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
```

ただし Tooltip / Popover 等ではフルネームを確認できるようにする。

---

# animationUrl の扱い

`animationUrl !== null` のギフトは、送信時に通常アイコンとは別に
アニメーション演出へ利用できる。

例:

```ts
function playGift(item: Item) {
  const visualUrl = item.animationUrl ?? item.iconUrl;

  // visualUrl を GiftOverlay 等に渡す
}
```

推奨:

```text
送信
 ↓
通常のチャット / Gift Message を追加
 ↓
animationUrl がある
 ├─ Yes → Player 上に Gift Animation
 └─ No  → 通常の Gift 表示のみ
```

---

# Chat / Gift Message との統合

既存のコメント API では `itemId` を送信できるため、
選択された `Item.id` を使用する。

```ts
const payload = {
  text: message || undefined,
  itemId: selectedItem?.id,
};
```

表示上は以下を分けることを推奨する。

### 通常メッセージ

```text
username
こんにちは！
```

### Gift のみ

```text
username   GIFT

[heart]
ハート
```

### Gift + Message

```text
username   GIFT

[star]
スター

がんばれー！
```

---

# キャッシュ方針

アイテム一覧は配信視聴画面を開いた直後に必須ではないため、
ギフト UI を初めて開いた時に取得する Lazy Load が適している。

```text
Watch Page
   ↓
Gift button clicked
   ↓
items 未取得?
   ├─ Yes → GET /items
   └─ No  → cache を利用
```

同一ページ滞在中は再取得しなくてもよい。

ただし API 側でアイテムが更新される可能性があるため、
永続キャッシュを行う場合は失効戦略を別途検討する。

---

# エラー処理

`GET /items` が失敗した場合でも配信・コメント機能は継続できるようにする。

```text
HLS Player     → 継続
Chat           → 継続
Danmaku        → 継続
Gift Picker    → Error state
```

Gift Picker には以下のような UI を表示する。

```text
ギフトを読み込めませんでした
[再読み込み]
```

---

# UI 実装上の注意

## 1. group を固定 enum と決めつけない

現在は、

```text
気持ち
自然
食べ物
お祝い
```

の 4 種類だが、API にグループが追加される可能性を考慮し、
原則として文字列として扱う。

```ts
group: string;
```

## 2. cost の段階を固定しない

現在は、

```text
10 / 50 / 150 / 400 / 1000
```

だが、価格帯追加に耐えられるようにする。

## 3. animationUrl の有無で直接判定する

`cost === 1000` のような判定はしない。

```ts
const animated = item.animationUrl !== null;
```

## 4. name の長さを仮定しない

現在のレスポンスには、

```text
大人気よくばりチーズたっぷりマルゲリータ
```

のような長い名称が存在する。

カードやチャット表示は長文でもレイアウト崩れしないようにする。

## 5. icon / animation 読み込み失敗を考慮する

画像ロード失敗時は、Gift UI 全体を壊さない。

---

# 推奨コンポーネント構成

```text
features/gifts/
├─ api/
│  └─ fetch-items.ts
│
├─ components/
│  ├─ GiftPicker.tsx
│  ├─ GiftGroupTabs.tsx
│  ├─ GiftGrid.tsx
│  ├─ GiftCard.tsx
│  └─ GiftAnimation.tsx
│
├─ types/
│  └─ item.ts
│
└─ utils/
   └─ group-items.ts
```

Chat 側:

```text
features/chat/
├─ ChatMessage.tsx
├─ GiftMessage.tsx
└─ GiftWithMessage.tsx
```

Player 側:

```text
features/player/
└─ GiftOverlay.tsx
```

---

# 既存仕様からの主な変更点

以前のフロント実装では、アイテムについて主に以下だけを使用していた。

```text
id
name
iconUrl
```

現在のレスポンスではさらに、

```text
cost
group
animationUrl
```

を利用できる。

これによりフロント側では、

- 価格付き Gift UI
- グループ別 Gift Picker
- 高価な Gift を目立たせる表示
- Gift アニメーション
- Gift + Message の強調表示

などを API の実データに基づいて実装できる。

---

# 未確認事項

## 確認済み: SSE の `item` は `/items` と同じ形

`GET /events` を実測したところ、ギフト付きイベントの `item` は
`cost` / `group` / `animationUrl` をそのまま含んでいた。

```json
{
  "id": "6058...",
  "text": null,
  "item": {
    "id": "star",
    "name": "スター",
    "iconUrl": ".../icons/star.webp?v=3440103d",
    "cost": 50,
    "group": "気持ち",
    "animationUrl": null
  },
  "timestamp": "..."
}
```

受信したギフトを表示・演出するために `/items` と突き合わせる必要はない。

なお `animations/*.webp` は**loop count 0 の無限ループ**(clap は 192x192 / 20フレーム)。
`<img>` に `play()` / `pause()` は無いので、再生・停止は
`src` を `iconUrl` ↔ `animationUrl` で差し替えて表現する。

---

# 未確認事項

今回提供された `GET /items` のレスポンスだけでは、
以下の仕様は確認できていない。

- `cost` が実際にサーバー側で消費・検証されるか
- ユーザーごとの残高 API が存在するか
- `animationUrl` をいつ / 何回再生すべきか
- アイテムの並び順が API 上で保証されているか
- group の順序が保証されているか
- アイテム一覧の更新頻度
- retired / disabled に相当するフィールドが将来追加されるか

これらについては、API 仕様または実レスポンスを確認してからフロント実装を確定する。

---

## 更新日

2026-09-03
