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
            <img src="/avatars/avatar1.png" alt="Channel avatar" />
            <div className="stream-copy">
              <span className="eyebrow">LIVE STREAM</span>
              <h1>雪景色の線路を眺める配信</h1>
              <p>のんびりと雪景色の線路を眺める、癒やしのライブ配信です。</p>
            </div>
            <div className="stream-actions">
              <button type="button"><Heart size={18} /> お気に入り</button>
              <button type="button"><Share2 size={18} /> シェア</button>
            </div>
          </div>
        </section>
      </div>
      <ChatPanel />
    </div>
  );
}
