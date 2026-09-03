# Frontend architecture

## Directory

```text
src/
├─ app/
│  └─ router.tsx
├─ components/
│  └─ layout/
├─ features/
│  ├─ home/
│  ├─ watch/
│  ├─ player/
│  ├─ chat/
│  ├─ danmaku/
│  └─ gifts/
├─ lib/
│  └─ api/
├─ store/
└─ test/
```

feature-firstにしている理由は、配信サービスではplayer/chat/gift/danmakuがそれぞれ独立した変更速度を持つためです。

## Data flow

### Playback

```text
endpoints.stream
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
