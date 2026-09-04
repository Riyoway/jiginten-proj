# Current backend limitations

## APIから確認できるもの

- HLSチャンネル一覧(`/channels.json`、id/title/category/playlist/default)
- チャンネル別HLS再生(`/ch/<id>/stream.m3u8`)
- チャンネル単位のカテゴリーと、配信中チャンネルから導出するカテゴリー件数
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
- 独立したcategory master
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

配信グリッドは`/channels.json`により実データになりました(チャンネル数ぶんの`StreamCard`をレンダー、水増しのダミーカードは追加しません)。カテゴリーは各チャンネルの`category`を集計し、件数表示とライブ一覧の絞り込みに使います。0件のカテゴリーはUI上の選択肢として表示しつつdisabledにします。右カラムの「フォロー中のライブ」も端末内フォロー(`store/follows.ts`)と`/channels.json`の突き合わせで実データ表示になりました(`FollowedChannelsPanel`)。トップギフターだけは対応APIが無いため、`ComingSoonPanel`で抽象的なplaceholder行のみを表示します。

### Follow / Favorites / History

Follow・お気に入りは`src/store/follows.ts` / `favorites.ts`(`createIdSetStore`、Zustand + localStorage)で端末内完結のトグルとして実装済みです。サーバー同期機能はありません。

- フォロー → Home右カラムの「フォロー中のライブ」に反映(配信中のチャンネルのみ)
- お気に入り → `/favorites`ページ(`features/favorites/FavoritesPage.tsx`)に一覧表示
- お気に入りのうち配信していないものは、名前を捏造せず**件数だけ**伝えます(`/channels.json`は配信中のチャンネルしか返さないため)
- 履歴とフォロー中の専用ページはまだ無いため、sidebarの該当nav項目は引き続き無効化のままです

### Gift credits

残高APIが無いため(上記「APIから確認できないもの」の`gift point balance`)、ギフトクレジットは
`src/store/credits.ts`(Zustand + localStorage)の**端末内完結**です。follow / お気に入り / 履歴と同じ扱いで、
サーバー残高のようには見せません。

- 初期値は3000。`POST /messages`が成功した時点で`cost`を引きます
- 減算は`POST /messages`が2xx(実際は`202 Accepted`)を返した時点です。サーバーが受理したことを
  そこで確定できるため、SSEの到着を待つ必要がありません(待つと取りこぼし時に引き忘れるだけ)
- なお`POST /messages`は`{"id": "...", "timestamp": "..."}`を返し、**この`id`はSSEイベントの`id`と
  一致します**(実測確認済み)。SSEに`userId`は無いものの、このidを保持しておけば
  「流れてきたどのイベントが自分の送信か」を特定することは可能です。
  現状その必要が無いので`sendMessage`はレスポンスを読んでいません
- 補充・リセット手段は用意していません(依頼による判断)

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
