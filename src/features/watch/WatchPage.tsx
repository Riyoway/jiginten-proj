import { Heart, Share2, UserCheck, UserPlus } from "lucide-react";
import { useEffect } from "react";
import { watchRoute } from "../../app/router";
import { resolvePlaylistUrl, resolveSelectedChannel } from "../../lib/api/channels";
import { getStreamlyUserName } from "../../lib/streamlyUsers";
import { useChannels } from "../../store/channels";
import { useFavoriteStore } from "../../store/favorites";
import { useFollowStore } from "../../store/follows";
import { useHistoryStore } from "../../store/history";
import { ChatPanel } from "../chat/ChatPanel";
import { StreamPlayer } from "../player/StreamPlayer";

// ponytail: フォロー/お気に入りAPIが無いため端末内保存のみ。サーバー同期はしない。

export function WatchPage() {
  const { channel: requestedChannelId } = watchRoute.useSearch();
  const { channels, status } = useChannels();

  const selectedChannel = resolveSelectedChannel(channels, requestedChannelId);
  const source = selectedChannel ? resolvePlaylistUrl(selectedChannel.playlist) : null;
  const unavailableMessage =
    status === "error"
      ? "配信情報を取得できませんでした。"
      : status === "loaded"
        ? "現在配信中のチャンネルはありません。"
        : "配信情報を読み込んでいます。";

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
        {source ? (
          <StreamPlayer source={source} />
        ) : (
          <section className="player-frame" aria-label="ライブ配信プレイヤー">
            <div className="player-error" role="status">
              {unavailableMessage}
            </div>
          </section>
        )}
        {selectedChannel ? (
          <section className="stream-meta">
            <div className="channel-row">
              <img src="/avatars/avatar1.png" alt="Channel avatar" />
              <div className="stream-copy">
                <h1>{selectedChannel.title}</h1>
                <div className="channel-identity">
                  <strong>
                    {getStreamlyUserName(
                      selectedChannel.id,
                      channels.map((channel) => channel.id),
                    )}
                  </strong>
                  <button
                    type="button"
                    className={`follow-button ${following ? "active" : ""}`}
                    aria-pressed={following}
                    onClick={() => toggleFollow(selectedChannel.id)}
                  >
                    {following ? <UserCheck size={15} /> : <UserPlus size={15} />}
                    {following ? "フォロー中" : "フォロー"}
                  </button>
                </div>
                <p>Streamlyでお届けする、ゆったり視聴できるライブ配信です。</p>
              </div>
              <div className="stream-actions">
                <button
                  type="button"
                  aria-pressed={favorited}
                  onClick={() => toggleFavorite(selectedChannel.id)}
                >
                  <Heart size={18} fill={favorited ? "currentColor" : "none"} /> お気に入り
                </button>
                <button type="button">
                  <Share2 size={18} /> シェア
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>
      <ChatPanel />
    </div>
  );
}
