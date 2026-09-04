# HLS Server Specification — Multi-channel update

最終更新: 2026-09-03

## 概要

HLS サーバー `intern-hls-server.tomaton.workers.dev` は、従来の単一チャンネル配信からマルチチャンネル配信へ更新された。

フロントエンドは今後、固定の `/stream.m3u8` だけを直接再生するのではなく、まず `/channels.json` からチャンネル一覧を取得し、ユーザーが選択したチャンネルの `playlist` を HLS プレイヤーへ渡す構成を基本とする。

```text
Browser
  |
  | GET /channels.json
  v
Channel catalog
  |
  | select channel
  v
GET /ch/<id>/stream.m3u8
  |
  v
HLS.js / Native HLS
  |
  v
GET /ch/<id>/segments/{n}.ts
```

`/stream.m3u8` はサーバー互換用として存在するが、フロントエンドは`channels.json`の`playlist`だけを使い、このURL用のenvは持たない。

---

## Base URL

```text
https://intern-hls-server.tomaton.workers.dev
```

---

## エンドポイント

| Method | Path | 用途 |
| --- | --- | --- |
| GET | `/channels.json` | 配信中チャンネル一覧を取得 |
| GET | `/stream.m3u8` | デフォルトチャンネルの HLS プレイリスト |
| GET | `/ch/<id>/stream.m3u8` | 指定チャンネルの HLS プレイリスト |
| GET | `/ch/<id>/segments/{n}.ts` | 指定チャンネルの MPEG-TS セグメント |

### 1. `GET /channels.json`

チャンネル一覧を取得するためのエンドポイント。

共有された仕様から、各チャンネルには少なくとも次の情報が含まれる。

```ts
type Channel = {
  id: string;
  title: string;
  category: string;
  playlist: string;
  default: boolean;

  // attribution / license / sourceなどの出典情報も含まれる。
  [key: string]: unknown;
};
```

### 重要: `playlist` を優先して使う

フロント側で以下のように URL を組み立てることもできる。

```ts
`${BASE_URL}/ch/${channel.id}/stream.m3u8`
```

ただし `channels.json` に `playlist` が提供されているため、**通常は `playlist` をそのまま利用する方がよい**。

これにより、将来サーバー側でパス構造が変更されてもチャンネルカタログ側の変更だけで追随しやすい。

`playlist` が相対 URL の場合にも対応できるよう、次の形で正規化する。

```ts
const playlistUrl = new URL(channel.playlist, BASE_URL).href;
```

### Default channel

`default: true` のチャンネルを初期選択として扱う。

推奨フォールバック順:

```text
1. URL / route で明示された channel id
2. channels.json の default === true
3. channels[0]
```

---

### 2. `GET /stream.m3u8`

デフォルトチャンネル用プレイリスト。

```text
GET https://intern-hls-server.tomaton.workers.dev/stream.m3u8
```

従来フロントとの互換性維持用。現行フロントエンドからは参照しない。

---

### 3. `GET /ch/<id>/stream.m3u8`

チャンネルごとの HLS プレイリスト。

例:

```text
/ch/llamigos/stream.m3u8
/ch/llama-drama/stream.m3u8
/ch/gran-dillama/stream.m3u8
```

HLS.js を利用するブラウザでは、選択したチャンネルの URL を `loadSource()` に渡す。

Safari / iOS など Native HLS が利用できる環境では `video.src` を切り替える。

---

### 4. `GET /ch/<id>/segments/{n}.ts`

HLS プレイリストから参照される映像セグメント。

```text
/ch/<id>/segments/{n}.ts
```

通常のフロント実装でこの URL を手動 fetch する必要はない。

```text
playlist.m3u8
      |
      v
 HLS.js / browser
      |
      +--> segment N
      +--> segment N+1
      +--> segment N+2
```

セグメントの取得・バッファリング・再試行は HLS プレイヤーに任せる。

---

## 現在のチャンネル

| id | title | 尺 | ループ周期 |
| --- | --- | ---: | ---: |
| `llamigos` | Caminandes 3: Llamigos | 2:30 | 約 150 秒 |
| `llama-drama` | Caminandes 1: Llama Drama | 1:30 | 約 90 秒 |
| `gran-dillama` | Caminandes 2: Gran Dillama | 2:26 | 約 146 秒 |

### チャンネル一覧をハードコードしない

上記 3 本は現在の配信内容であり、フロントの恒久的な定数として扱わない。

```ts
// Avoid
const channels = ["llamigos", "llama-drama", "gran-dillama"];
```

代わりに:

```ts
const channels = await fetchChannels();
```

とし、`/channels.json` をチャンネルカタログの source of truth にする。

---

## 配信同期の仕様

### 同じチャンネルの視聴者は同じ時点を見る

各動画はループしているが、VOD のように「視聴を開始した人ごとに 0 秒から再生」されるわけではない。

```text
Viewer A ─────┐
              ├── llamigos ── 同じ時点の映像
Viewer B ─────┘
```

同じチャンネルを視聴しているユーザー同士では、同じ瞬間に同じ映像が流れる。

そのため UI も **VOD よりライブ配信として扱う**のが適切。

推奨:

- `LIVE` 表示
- 「先頭へ戻る」ではなく「ライブ位置へ戻る」
- seek bar を VOD の再生位置として誤解させない
- チャンネル変更時は新しいチャンネルの現在のライブ位置へ接続

### チャンネル間ではループ周期が異なる

動画尺が異なるため、それぞれ独立した周期でループする。

```text
llamigos      150 sec loop
llama-drama    90 sec loop
gran-dillama  146 sec loop
```

したがってチャンネル変更時に「元チャンネルと同じ再生秒数」を維持するという考え方は不要。

---

## フロントエンド統合方針

### 起動フロー

```text
App start
  |
  v
GET /channels.json
  |
  +--> success
  |      |
  |      v
  |   determine selected/default channel
  |      |
  |      v
  |   load channel.playlist
  |
  +--> failure
         |
         v
     show catalog error
```

### API adapter

推奨構成:

```text
src/lib/api/
├─ endpoints.ts
└─ channels.ts

src/features/player/
├─ StreamPlayer.tsx
├─ ChannelSelector.tsx
└─ useHlsPlayer.ts
```

UI から直接 URL を組み立てず、API adapter に閉じ込める。

### 推奨 API

```ts
import { endpoints } from "./endpoints";

export async function fetchChannels(signal?: AbortSignal) {
  const response = await fetch(endpoints.channels, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch channels: ${response.status}`);
  }

  return response.json();
}

export function resolvePlaylistUrl(playlist: string) {
  return new URL(playlist, endpoints.channels).href;
}
```

---

## チャンネル切り替え

### HLS.js

現在の `video` element はそのまま維持し、ソースだけ変更する。

概念的には:

```ts
hls.loadSource(nextPlaylistUrl);
```

切り替え中は UI に loading state を出す。

```text
Channel A
   |
   | user switches
   v
Loading...
   |
   v
Channel B / current live position
```

短時間に連続して切り替えられることを考慮し、古い非同期処理の結果で現在の選択を上書きしないようにする。

### Native HLS

```ts
video.src = nextPlaylistUrl;
video.play();
```

自動再生制限は従来と同様に考慮する。

---

## URL とチャンネル状態

選択チャンネルを URL に保持すると、reload / share / browser back との相性がよい。

例:

```text
/watch?channel=llamigos
```

または:

```text
/watch/llamigos
```

TanStack Router を使う現在の構成なら、route/search param を typed state として扱える。

おすすめは以下。

```text
URL channel id
      ↓
channels.json と照合
      ↓
存在する → 再生
存在しない → default channel
```

---

## Home での活用

以前はバックエンドに配信一覧 API がなかったため Home のライブ一覧を本物のデータで構築できなかった。

今回の `/channels.json` 追加によって、**現在配信されているチャンネル一覧とカテゴリーは実 API ベースで構築可能**になった。

```text
/channels.json
     |
     +--> Home: Live now
     +--> Watch: Channel selector
     +--> Sidebar: Channels
     +--> Default channel
```

ただし、提供されたチャンネル情報から確認できないものを捏造しない。

現時点でサーバー仕様として確認できない例:

- viewer count
- streamer account
- follower count
- thumbnail endpoint
- schedule
- ranking
- recommendation score

これらは API が追加されるまでは static presentation / local-only UI と明確に分離する。

---

## コメント・ギフト API との関係 — 重要

HLS サーバーはマルチチャンネル対応になったが、既存フロントで利用しているコメント API は別サーバーである。

現在確認できるコメント関連 I/O は:

```text
GET  /events
POST /messages
GET  /items
```

また、現在の送信 payload は:

```json
{
  "text": "...",
  "itemId": "..."
}
```

であり、`channelId` は含まれていない。

したがって **コメントサーバー側に別の未共有仕様が存在しない限り、HLS チャンネルを切り替えただけではコメント・ギフトをチャンネル別に分離できない**。

```text
HLS
├─ Channel A
├─ Channel B
└─ Channel C

Comment API
└─ /events   ← channel id が現在の契約にはない
```

### フロントだけで偽の分離をしない

例えば「Channel A を見ている間に受信したコメントだけを A のコメント」として保存すると、別ユーザーと整合しない。

チャンネル別チャットが必要なら、バックエンド契約として少なくとも以下のどちらかが必要。

```text
/events?channelId=llamigos
/messages { channelId, text, itemId }
```

またはイベント payload 自体に stable な `channelId` が必要。

API が固定されている現状では、コメント欄を **全チャンネル共通チャット**として扱うのが最も正直な実装になる。

---

## Service Worker / Cache

PWA の Service Worker では HLS メディアを積極的にキャッシュしない。

```text
Cache OK
├─ JS
├─ CSS
├─ fonts
├─ icons
└─ static mascot assets

Network
├─ /channels.json
├─ *.m3u8
├─ *.ts
├─ /events
└─ /messages
```

特にライブプレイリストや TS セグメントを App Shell と同じ戦略でキャッシュすると、古いライブ位置を返す原因になり得る。

`channels.json` をアプリ内メモリで短時間保持するのは問題ないが、永続的なチャンネル定数の代わりにはしない。

---

## エラー処理

### `/channels.json` が失敗

```text
channels.json failed
        ↓
show catalog error and do not start playback
```

チャンネル一覧取得の失敗だけでプレイヤー全体を使用不能にしない。

### 選択した channel が消えた

チャンネル一覧は将来変更される可能性があるため、URL に保存した id が存在しなくなるケースを想定する。

```text
requested id not found
      ↓
default channel
      ↓
first channel
```

### Playlist error

- recover 可能な HLS.js error は player 内で再試行
- fatal error は player overlay に表示
- チャンネル一覧 UI 自体は残す
- 別チャンネルへの切り替えを可能にする

---

## 現時点で未確認の点

共有されたサーバー更新情報だけでは、以下は断定しない。

- `channels.json` の実 JSON 全体
- 出典情報の正確な key 名・object shape
- `playlist` が常に absolute URL か relative URL か
- `.m3u8` が master playlist か media playlist か
- 複数 bitrate / quality level の有無
- playlist target duration
- segment duration
- CORS / Cache-Control の具体的レスポンスヘッダー
- channel が実行中に追加・削除される可能性と更新頻度

フロントではこれらを決め打ちせず、実レスポンスと HLS.js の runtime metadata を優先する。

特に quality selector は、実際に複数 HLS level が検出された場合だけ表示する。

---

## 実装優先順位

### P0

- `/channels.json` の API adapter
- default channel 判定
- `playlist` ベースの再生
- Channel selector
- channel switch

### P1

- URL に channel id を保持
- Home の live cards を `/channels.json` ベースに変更
- channel change loading/error state
- current channel indication

### P2

- playlist metadata に応じた quality UI
- channels catalog refresh
- channel transition polish

### Backend support が追加された場合

- channel-scoped comments
- channel-scoped gifts
- viewer counts
- thumbnails
- standalone category catalog
- follow / ranking / recommendations

---

## まとめ

今回の更新によって HLS 部分は:

```text
Before
1 fixed HLS stream

After
channels.json
   |
   +-- channel.category
   +-- channel.playlist
```

という構造になった。

フロント側で最も重要なのは、**チャンネルをコードに固定せず `/channels.json` を source of truth にすること**。

また、既存のコメント API には現時点で channel identifier がないため、**映像だけをマルチチャンネル対応にしたからといってチャットまでチャンネル別になったと解釈しないこと**。

この境界を守れば、固定バックエンドの範囲でも Home / Watch / Channel selector をかなり本物のストリーミングサービスに近づけられる。
