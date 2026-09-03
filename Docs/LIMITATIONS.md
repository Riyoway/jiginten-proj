# Current backend limitations

## APIから確認できるもの

- 1つのHLS stream URL
- SSE comments
- message POST
- gift item list
- gift send via `itemId`

## APIから確認できないもの

- user ID
- user name
- user avatar
- authentication
- stream list
- stream ID
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

実APIが追加されるまでmockをproduction UIの実データとして見せません。

### Follow / Favorites / History

ローカルだけで実装する場合は必ず「この端末のみ」と分かる設計にします。
サーバー同期機能のように見せません。

## 追加APIが来たら優先する順番

1. stable `userId` / display name
2. stream metadata / stream list
3. user profile / avatar
4. follow state
5. viewer count
6. moderation
7. ranking / recommendation

ユーザー識別が追加されれば、チャットUIの品質が最も大きく改善します。
