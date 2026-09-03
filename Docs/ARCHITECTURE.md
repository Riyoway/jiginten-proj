# Frontend architecture

## Directory

```text
src/
├─ app/
│  └─ router.tsx           # /watch は channel search param を validateSearch で型付け
├─ components/
│  ├─ layout/               # AppShell(sidebarのチャンネルリンク一覧。遷移先は実チャンネル、
│  │                          #   表示名はchannel.titleを使わず固定"Streamly User")
│  └─ ui/                   # ComingSoonPanel など
├─ features/
│  ├─ home/                 # HomePage, StreamCard(実チャンネルのライブグリッド)
│  ├─ watch/
│  ├─ player/                # StreamPlayer, useHlsPlayer
│  ├─ chat/
│  ├─ danmaku/
│  └─ gifts/
├─ lib/
│  └─ api/                  # endpoints.ts, channels.ts, comments.ts, messages.ts, gifts.ts
├─ store/                    # comments.ts, preferences.ts, channels.ts
└─ test/
```

feature-firstにしている理由は、配信サービスではplayer/chat/gift/danmakuがそれぞれ独立した変更速度を持つためです。

## Data flow

### Channel catalog

```text
GET /channels.json (useChannelStore, 一度だけ取得)
    |
    +--> AppShell: sidebarのリンク一覧(遷移先=channel.id、表示名は固定 "Streamly User")
    +--> HomePage: ライブグリッド(1チャンネル=1 StreamCard、表示名にchannel.titleを使用)
    +--> WatchPage: resolveSelectedChannel(channels, URLのchannel)
```

選択中チャンネルはstoreではなくURL(`/watch?channel=<id>`)が正。取得失敗/空なら`endpoints.stream`(単一互換ストリーム)にフォールバックする。

`channel.title`はコンテンツ名であって配信者名ではない。avatar+name形式で「誰の配信か」を表す文脈(sidebarの`.sidebar-channel-link`)では、配信者アカウントAPIが無いchatの`Guest`表示と同じ理由で実データを人物名のように見せず、`getStreamlyUserName`(id単位で決定的な"Streamly User N")にする。一方StreamCardや視聴画面の見出しのようにコンテンツ名として明示的に扱う文脈では引き続き`channel.title`を表示する。

視聴画面内でのライブ切り替えUI(旧`ChannelSelector`)は削除済み。ライブの選択はHomeのライブグリッドかsidebarのリンクから`/watch?channel=<id>`への遷移のみで行う。

### Playback

```text
WatchPageが解決したplaylist URL (resolvePlaylistUrl)
    |
    v
StreamPlayer(source prop)
    |
    v
useHlsPlayer
    |
    v
HTMLVideoElement
    |
    +--> orientation detection
    +--> player controls
```

### Realtime comments

```text
EventSource
    |
    v
openCommentStream
    |
    v
useCommentStore (max 300)
    |                  |
    v                  v
ChatPanel          DanmakuLayer
```

### Gift catalog

```text
Gift button open
    |
    v
useGiftCatalog
    |
    v
GET /items (first open only)
    |
    v
memory cache in component lifecycle
```

### Send

```text
ChatComposer
   |
   +-- text
   +-- selected gift
   |
   v
POST /messages
   |
   v
SSE response
   |
   v
UI rendering
```

## Server state vs UI state

Server-derived:

- HLS media
- channel catalog(`/channels.json`)
- comments
- gift catalog

Local preference:

- muted
- volume
- danmaku enabled
- danmaku opacity
- chat visibility

この2種類を混ぜません。

## Route strategy

スターターではcode-based TanStack Routerです。
routeが2つしかない状態でgenerated route treeを必須にしないことで、zipを展開した直後の構造を読みやすくしています。

routeが増えたらTanStack Routerのfile-based routingへ移行してください。

## Component boundary principles

`StreamPlayer`:
- video/HLS/fullscreen
- player overlay
- danmaku container
- `source` propで再生対象を受け取るだけ(チャンネル解決はWatchPage側の責務)

`ChatPanel`:
- SSE lifecycle
- comment list
- composer

`GiftPicker`:
- lazy load
- gift selection

`ChatComposer`:
- text + gift payload
- send state
- error preservation

API requestそのものはfeature componentから`src/lib/api`へ逃がします。
