import { Heart, Share2 } from "lucide-react";
import { ChatPanel } from "../chat/ChatPanel";
import { StreamPlayer } from "../player/StreamPlayer";

export function WatchPage() {
  return (
    <div className="watch-page">
      <div className="watch-main">
        <StreamPlayer />
        <section className="stream-meta">
          <div className="channel-row">
            <img src="/mascot/default-avatar.png" alt="Streamly mascot" />
            <div className="stream-copy">
              <span className="eyebrow">LIVE STREAM</span>
              <h1>雪景色の線路を眺める配信</h1>
              <p>固定 HLS API を利用した視聴画面スターターです。</p>
            </div>
            <div className="stream-actions">
              <button type="button"><Heart size={18} /> お気に入り</button>
              <button type="button"><Share2 size={18} /> シェア</button>
            </div>
          </div>
          <div className="api-note">
            <strong>API-aware UI</strong>
            <span>存在しない視聴者数・プロフィール・ランキング API は捏造せず、UIシェルとして分離しています。</span>
          </div>
        </section>
      </div>
      <ChatPanel />
    </div>
  );
}
