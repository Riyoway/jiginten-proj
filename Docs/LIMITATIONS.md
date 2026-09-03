# Current backend limitations

## APIから確認できるもの

- HLSチャンネル一覧(`/channels.json`、id/title/playlist/default)
- チャンネル別HLS再生(`/ch/<id>/stream.m3u8`)、単一互換ストリームURL(`/stream.m3u8`)
- SSE comments
- message POST
- gift item list
- gift send via `itemId`

## APIから確認できないもの

- user ID
- user name
- user avatar
- authentication
- channel profile
- follow state
- favorites sync
- real viewer count
- category list
- recommendation
- ranking
- gift point balance
- moderation API
- block/mute API
- past broadcast archive

## UIでどう扱うか

### User avatar

`public/avatars/`内の画像からランダムに選んで表示します（ユーザーごとの固定アイコンではありません）。

### User name

実ユーザー名がないため`Guest`として表示します。

### Viewer count

実数のような数字を捏造しません。

### Home recommendations

配信グリッドは`/channels.json`により実データになりました(チャンネル数ぶんの`StreamCard`をレンダー、水増しのダミーカードは追加しません)。一方カテゴリー・フォロー中・トップギフターは引き続き対応APIが無いため、数値・名前・ランキングを実データとして見せません。該当セクションは`ComingSoonPanel`で「近日公開」と明示し、抽象的なplaceholder行のみを表示します。

### Follow / Favorites / History

ローカルだけで実装する場合は必ず「この端末のみ」と分かる設計にします。
サーバー同期機能のように見せません。

## 追加APIが来たら優先する順番

1. stable `userId` / display name
2. ~~stream metadata / stream list~~ → `/channels.json`で解決済み(`Docs/HLS-SERVER.md`)
3. user profile / avatar
4. follow state
5. viewer count
6. moderation
7. ranking / recommendation
8. channel-scoped comments / gifts（`/events`・`/messages`に`channelId`が追加されたら）

ユーザー識別が追加されれば、チャットUIの品質が最も大きく改善します。
