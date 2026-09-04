import { Heart, Share2, UserCheck, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { watchRoute } from "../../app/router";
import { resolvePlaylistUrl, resolveSelectedChannel } from "../../lib/api/channels";
import { getStreamlyUserName } from "../../lib/streamlyUsers";
import { useChannels } from "../../store/channels";
import { useFavoriteStore } from "../../store/favorites";
import { useFollowStore } from "../../store/follows";
import { useHistoryStore } from "../../store/history";
import { ChatPanel } from "../chat/ChatPanel";
import { StreamPlayer } from "../player/StreamPlayer";

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

  // ponytail: 記録するのは「開いた」だけ。再生開始や視聴時間はAPIが無く自前計測になるので足さない。
  const recordHistory = useHistoryStore((state) => state.record);
  const selectedChannelId = selectedChannel?.id;
  useEffect(() => {
    if (selectedChannelId) recordHistory(selectedChannelId);
  }, [selectedChannelId, recordHistory]);

  const following = selectedChannel ? followedIds.includes(selectedChannel.id) : false;
  const favorited = selectedChannel ? favoritedIds.includes(selectedChannel.id) : false;
  const streamerName = selectedChannel
    ? getStreamlyUserName(
        selectedChannel.id,
        channels.map((channel) => channel.id),
      )
    : null;
  const category = selectedChannel?.category.trim();
  const [followNotice, setFollowNotice] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "shared" | "error">("idle");

  useEffect(() => {
    if (!selectedChannelId) return;
    setFollowNotice(false);
    setShareState("idle");
  }, [selectedChannelId]);

  const handleFollow = () => {
    if (!selectedChannel) return;
    const willFollow = !following;
    toggleFollow(selectedChannel.id);
    setFollowNotice(willFollow);
  };

  const handleShare = async () => {
    if (!selectedChannel) return;

    const shareData = { title: selectedChannel.title, url: window.location.href };
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
      }
      setShareState("shared");
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setShareState("error");
    }
  };

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
              <img src="/avatars/avatar1.png" alt="" />
              <div className="stream-copy">
                <h1>{selectedChannel.title}</h1>
                <div className="channel-identity">
                  <strong>{streamerName}</strong>
                  <button
                    type="button"
                    className={`follow-button ${following ? "active" : ""}`}
                    aria-pressed={following}
                    onClick={handleFollow}
                  >
                    {following ? <UserCheck size={15} /> : <UserPlus size={15} />}
                    {following ? "フォロー中" : "フォロー"}
                  </button>
                  <span className="follower-count">フォロワー {following ? 1 : 0}</span>
                </div>
                <div className="stream-tags">
                  <span>ライブ配信</span>
                  {category ? <span>{category}</span> : null}
                </div>
              </div>
              <div className="stream-actions">
                <button
                  type="button"
                  aria-pressed={favorited}
                  onClick={() => toggleFavorite(selectedChannel.id)}
                >
                  <Heart size={18} fill={favorited ? "currentColor" : "none"} /> お気に入り
                </button>
                <button type="button" onClick={handleShare}>
                  <Share2 size={18} /> シェア
                </button>
              </div>
            </div>
            {shareState !== "idle" ? (
              <p className={`share-status ${shareState}`} role="status">
                {shareState === "shared" ? "リンクを共有しました" : "リンクを共有できませんでした"}
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
      <ChatPanel followNotice={followNotice ? "Guestさんがこの配信をフォローしました！" : null} />
    </div>
  );
}
