import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Gift, MessageCircle, Play, Radio, Sparkles } from "lucide-react";

export function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">STREAMLY STREAMING</span>
          <h1>見る、話す、贈る。<br />配信の体験を一つに。</h1>
          <p>HLS・SSE・ギフトAPIを最大限活かし、フロントエンドの体験に集中したストリーミングUI。</p>
          <div className="hero-actions">
            <Link className="primary-button large" to="/watch"><Play size={18} fill="currentColor" /> 配信を見る</Link>
            <a className="secondary-button large" href="#architecture">設計を見る</a>
          </div>
          <div className="capability-row">
            <span><Radio size={15} /> HLS</span>
            <span><MessageCircle size={15} /> SSE Chat</span>
            <span><Gift size={15} /> Gifts</span>
          </div>
        </div>
        <div className="hero-mascot-wrap">
          <div className="hero-glow" />
          <img className="hero-mascot" src="/avatars/avatar1.png" alt="" />
        </div>
      </section>

      <section className="section-block">
        <div className="section-title">
          <div>
            <span className="eyebrow">AVAILABLE NOW</span>
            <h2>現在利用できる配信</h2>
          </div>
          <span className="source-pill">固定 API × 1</span>
        </div>
        <Link className="live-card" to="/watch">
          <div className="live-preview">
            <div className="preview-sky" />
            <span className="live-badge">LIVE</span>
            <span className="preview-play"><Play size={25} fill="currentColor" /></span>
          </div>
          <div className="live-card-body">
            <img src="/avatars/avatar1.png" alt="" />
            <div>
              <strong>雪景色の線路を眺める配信</strong>
              <span>Streamly · HLS live stream</span>
            </div>
          </div>
        </Link>
      </section>

      <section className="section-block" id="architecture">
        <div className="section-title">
          <div>
            <span className="eyebrow">FRONTEND FIRST</span>
            <h2>このスターターで重視していること</h2>
          </div>
        </div>
        <div className="feature-grid">
          <Feature icon={<Radio />} title="Adaptive player" text="横型・縦型を metadata から判定。映像は crop せず contain を基本にします。" />
          <Feature icon={<MessageCircle />} title="One SSE stream" text="チャットと弾幕は同じ EventSource を共有し、接続数を増やしません。" />
          <Feature icon={<Gift />} title="Gift-first UX" text="通常コメント、ギフト、ギフト＋メッセージを別の見た目で扱います。" />
          <Feature icon={<Sparkles />} title="Honest shell" text="バックエンドに存在しないデータは本物の機能として見せず、拡張ポイントに留めます。" />
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="feature-card">
      <div className="feature-icon">{icon}</div>
      <strong>{title}</strong>
      <p>{text}</p>
    </article>
  );
}
