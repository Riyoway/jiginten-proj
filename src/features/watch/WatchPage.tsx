import { Heart, Share2, UserCheck, UserPlus } from "lucide-react";
import { useEffect } from "react";
import { watchRoute } from "../../app/router";
import { resolvePlaylistUrl, resolveSelectedChannel } from "../../lib/api/channels";
import { endpoints } from "../../lib/api/endpoints";
import { getStreamlyUserName } from "../../lib/streamlyUsers";
import { useChannels } from "../../store/channels";
import { useFavoriteStore } from "../../store/favorites";
import { useFollowStore } from "../../store/follows";
import { useHistoryStore } from "../../store/history";
import { ChatPanel } from "../chat/ChatPanel";
import { StreamPlayer } from "../player/StreamPlayer";

// ponytail: フォロー/お気に入りAPIが無いため端末内保存のみ。サーバー同期のように見せない
// (hoverで見えるtitle属性に明記)。
const LOCAL_ONLY_HINT = "この端末だけに保存されます(アカウント同期なし)";

export function WatchPage() {
  const { channel: requestedChannelId } = watchRoute.useSearch();
  const { channels, status } = useChannels();

  const selectedChannel = resolveSelectedChannel(channels, requestedChannelId);
  // channels.jsonが失敗/空の場合は、従来通り互換エンドポイントの単一配信にフォールバックする。
  const source = selectedChannel ? resolvePlaylistUrl(selectedChannel.playlist) : endpoints.stream;
  const title = selectedChannel?.title ?? "雪景色の線路を眺める配信";

  const followedIds = useFollowStore((state) => state.ids);
  const toggleFollow = useFollowStore((state) => state.toggle);
  const favoritedIds = useFavoriteStore((state) => state.ids);
  const toggleFavorite = useFavoriteStore((state) => state.toggle);

  // ponytail: 視聴履歴は「このチャンネルを開いた」だけを端末内に記録する(再生開始や視聴時間の
  // 判定はAPIが無く自前計測になるので、必要になってから足す)。
  const recordHistory = useHistoryStore((state) => state.record);
  const selectedChannelId = selectedChannel?.id;
  useEffect(() => {
    if (selectedChannelId) recordHistory(selectedChannelId);
  }, [selectedChannelId, recordHistory]);

  const following = selectedChannel ? followedIds.includes(selectedChannel.id) : false;
  const favorited = selectedChannel ? favoritedIds.includes(selectedChannel.id) : false;

  return (
    <div className="watch-page">
      <div className="watch-main">
        <StreamPlayer source={source} />
        <section className="stream-meta">
          <div className="channel-row">
            <img src="/avatars/avatar1.png" alt="Channel avatar" />
            <div className="stream-copy">
              <h1>{title}</h1>
              {selectedChannel ? (
                <div className="channel-identity">
                  <strong>{getStreamlyUserName(selectedChannel.id)}</strong>
                  <button
                    type="button"
                    className={`follow-button ${following ? "active" : ""}`}
                    aria-pressed={following}
                    title={LOCAL_ONLY_HINT}
                    onClick={() => toggleFollow(selectedChannel.id)}
                  >
                    {following ? <UserCheck size={15} /> : <UserPlus size={15} />}
                    {following ? "フォロー中" : "フォロー"}
                  </button>
                </div>
              ) : null}
              <p>Streamlyでお届けする、ゆったり視聴できるライブ配信です。</p>
            </div>
            <div className="stream-actions">
              <button
                type="button"
                aria-pressed={favorited}
                disabled={!selectedChannel}
                title={LOCAL_ONLY_HINT}
                onClick={() => selectedChannel && toggleFavorite(selectedChannel.id)}
              >
                <Heart size={18} fill={favorited ? "currentColor" : "none"} /> お気に入り
              </button>
              <button type="button">
                <Share2 size={18} /> シェア
              </button>
            </div>
          </div>
          {status === "error" ? (
            <p className="inline-error channel-fallback-note">
              配信一覧を取得できなかったため、既定の配信を表示しています。
            </p>
          ) : null}
        </section>
      </div>
      <ChatPanel />
    </div>
  );
}
