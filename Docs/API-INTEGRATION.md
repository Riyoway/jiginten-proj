# Fixed API integration strategy

## 前提

今回バックエンドは変更できません。
`Docs/reference/legacy.main.js` から確認できるコメント/ギフト系I/Oは次の3つです。

```text
GET  /events       -> SSE comments
POST /messages     -> comment / gift / gift+message
GET  /items        -> gift catalog
```

HLSサーバーは`Docs/HLS-SERVER.md`の更新により単一固定ストリームから3チャンネル配信になりました(下記「1. HLS」参照)。

フロントエンドはこの契約を拡張したふりをせず、「既存APIから取れる情報をどう良い体験に変換するか」に集中します。

## 1. HLS(マルチチャンネル)

Base URL:

```text
https://intern-hls-server.tomaton.workers.dev
```

```text
GET /channels.json          -> チャンネル一覧(source of truth)
GET /stream.m3u8            -> デフォルトチャンネルの互換フォールバック
GET /ch/<id>/stream.m3u8    -> チャンネル別プレイリスト
GET /ch/<id>/segments/{n}.ts
```

起動フロー:

```text
GET /channels.json
  +-- success -> resolveSelectedChannel(channels, URLのchannel id)
  |               -> URL指定 -> default:true -> channels[0]
  +-- failure -> /stream.m3u8 にフォールバック
```

`playlist`はそのまま使い、相対URLの場合は`resolvePlaylistUrl`
(`new URL(playlist, endpoints.channels)`)でenv設定済みのチャンネルURLを基準に正規化します
(`src/lib/api/channels.ts`)。チャンネル一覧をコードに固定しません。

選択中チャンネルはZustand storeではなく**URL(`/watch?channel=<id>`)をsource of truthにします**(`src/app/router.tsx`の`validateSearch`)。

利用方法:

- Chromium/Firefox: hls.js
- Safari/iOS: native HLS
- `loadedmetadata` 後に `videoWidth/videoHeight` を比較してportrait/landscapeを判定
- `object-fit: contain` を基本にし、勝手に映像をcropしない
- autoplayはブラウザ制限を考慮してmuted開始
- Fullscreenはvideo単体ではなくoverlayを含むplayer frameに対して行う
- 各チャンネルはループしているが「同じチャンネルの視聴者は同じ時点を見る」ライブ配信として扱う。VODのような0秒からの再生・シーク位置の表示はしない

APIが固定でも改善できるもの:

- 再生/停止
- mute/volume
- fullscreen
- keyboard shortcuts
- quality selector（実際に複数levelが検出された場合のみ表示。master playlistの構造は未確認のため決め打ちしない）
- reconnect/recover UI
- orientation-aware layout
- Media Session API
- Picture-in-Picture（必要なら追加）

### コメント/ギフトはチャンネル別にしない

`/events`・`/messages`・`/items`のpayloadに`channelId`は含まれていません。HLSが3チャンネルになっても、**チャットは全チャンネル共通の1本のまま**扱います。「今見ているチャンネルのコメントだけ表示」のようなフロント側だけの偽の分離はしません。バックエンドに`channelId`付きの契約が追加されない限りこの方針は変わりません。

## 2. SSE comments

Endpoint:

```text
https://intern-comment-server.intern-comment-server.deno.net/events
```

### 接続は1本

チャットと弾幕のためにEventSourceを2本作ってはいけません。

```text
EventSource x 1
      |
      v
comment store
   /      \
Chat     Danmaku
```

これでサーバー負荷と重複イベント処理を避けます。

### 重複排除

元実装と同様、payloadに`id`がある場合は`Set`で重複を除外します。

### 最大件数

DOM/React treeが増え続けないように最大300件を保持します。
必要になったらTanStack Virtual等を追加しますが、最初からvirtualizationを入れる必要はありません。

## 3. Message send

Endpoint:

```text
POST https://intern-comment-server.intern-comment-server.deno.net/messages
Content-Type: application/json
```

Payload:

```json
{ "text": "こんにちは" }
```

Gift only:

```json
{ "itemId": "..." }
```

Gift + message:

```json
{
  "text": "がんばれー！",
  "itemId": "..."
}
```

### レスポンス(実測)

```text
202 Accepted
Content-Type: application/json

{"id": "5f410107-dc9c-48bd-8fda-36a7ec8ac622", "timestamp": "2026-09-04T02:14:15.899Z"}
```

**この`id`はSSEイベントの`id`と一致します**(実測で確認)。`sendMessage`は現状レスポンスを
読んでいませんが、「自分が送ったものだけ演出する」等が必要になればここを使えます。

**`/messages`はPOST専用で、GETすると404を返します。** `curl .../messages`(既定はGET)で404を見て
「エンドポイントが無い」と誤診しやすいので注意。疎通確認は必ずPOSTで行うこと。

```powershell
curl -X POST https://intern-comment-server.intern-comment-server.deno.net/messages `
  -H "Content-Type: application/json" --data '{"text":"接続確認"}'
```

### 表示は3種類に分ける

1. Normal message
2. Gift
3. Gift + message

バックエンドpayloadは似ていても、UI上ではギフトを通常コメントの横に小さく置くだけにしません。ギフトは配信サービス内の重要イベントとしてカード・背景・アイコン・弾幕表現を変えます。

### SSEを表示のsource of truthにする

POST成功直後にローカルで同じコメントを追加せず、SSEで戻ってきたイベントを最終表示に使います。

理由:

- 二重表示を避ける
- サーバーが受理したデータだけを表示する
- 元実装の設計を維持する

## 4. Gift catalog

Endpoint:

```text
GET https://intern-comment-server.intern-comment-server.deno.net/items
```

### Lazy load

画面表示時には取得せず、ユーザーが入力欄のギフトボタンを最初に開いた時だけ取得します。

理由:

- ギフトを使わない視聴者に不要なrequestを送らない
- 初期表示を軽くする
- 元実装の意図を維持する

一度成功したcatalogはsession中メモリに保持します。

## ユーザー情報がない問題

現在確認できるcomment payloadには、フロントが信頼して利用できるuser id / avatar URLがありません。

したがって現在は:

```text
avatar = public/avatars/*.png からランダム選択
name   = Guest
```

とします。

### やってはいけないこと

- コメント本文からユーザーを推測する
- payload.idをuser idとして扱う
- ランダムな名前を生成して「実ユーザー」のように見せる
- refreshごとに違うavatarを割り当てる

### 将来userIdが追加されたら

APIにstableな`userId`が追加された場合のみ、次のようなdeterministic avatar variationが可能です。

```text
hash(userId) % avatarVariants.length
```

同じStreamlyマスコットの色違いを用意すれば、個人情報を追加取得せずにユーザーを視覚的に区別できます。

## API adapterを必ず挟む

UIコンポーネント内にendpoint URLを直接書きません。

```text
src/lib/api/endpoints.ts
src/lib/api/comments.ts
src/lib/api/messages.ts
src/lib/api/gifts.ts
```

に集約します。

APIが固定だからこそadapter層が重要です。将来endpoint変更やmock serverへの差し替えが必要になっても、feature側を変更せずに済みます。

## エラー時の方針

HLS:
- fatal/non-fatalを分ける
- 再接続可能ならplayer内でrecover
- 再生不能ならplayer overlayに明示

SSE:
- EventSourceの標準reconnectを利用
- UIには「再接続中」を出す
- reconnectのたびに別connectionを追加しない

POST:
- 送信中は多重送信を防止
- 失敗時は入力内容と選択giftを残す

GET /items:
- 失敗時はgift picker内だけでエラー表示
- player/chat全体を壊さない

## PWA / Service Worker

ストリームやリアルタイムAPIはService Worker cacheに入れません。

App shellと静的assetだけをcacheし、外部APIはruntimeCachingに登録せずネットワークへ直接送ります。
