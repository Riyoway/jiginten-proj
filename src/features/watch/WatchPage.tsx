import { Heart, Share2 } from "lucide-react";
import { watchRoute } from "../../app/router";
import { resolvePlaylistUrl, resolveSelectedChannel } from "../../lib/api/channels";
import { endpoints } from "../../lib/api/endpoints";
import { useChannels } from "../../store/channels";
import { ChatPanel } from "../chat/ChatPanel";
import { ChannelSelector } from "../player/ChannelSelector";
import { StreamPlayer } from "../player/StreamPlayer";

export function WatchPage() {
  const { channel: requestedChannelId } = watchRoute.useSearch();
  const { channels, status } = useChannels();

  const selectedChannel = resolveSelectedChannel(channels, requestedChannelId);
  // channels.jsonが失敗/空の場合は、従来通り互換エンドポイントの単一配信にフォールバックする。
  const source = selectedChannel ? resolvePlaylistUrl(selectedChannel.playlist) : endpoints.stream;
  const title = selectedChannel?.title ?? "雪景色の線路を眺める配信";

  return (
    <div className="watch-page">
      <div className="watch-main">
        <StreamPlayer source={source} />
        <ChannelSelector channels={channels} selectedId={selectedChannel?.id} />
        <section className="stream-meta">
          <div className="channel-row">
            <img src="/avatars/avatar1.png" alt="Channel avatar" />
            <div className="stream-copy">
              <span className="eyebrow">LIVE STREAM</span>
              <h1>{title}</h1>
              <p>Streamlyでお届けする、ゆったり視聴できるライブ配信です。</p>
            </div>
            <div className="stream-actions">
              <button type="button">
                <Heart size={18} /> お気に入り
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
