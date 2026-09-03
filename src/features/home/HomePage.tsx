import { Card } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Gamepad2,
  Gift,
  MessageCircle,
  Music,
  Palette,
  Play,
  Radio,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { ReactNode } from "react";
import { ComingSoonPanel, PlaceholderRows } from "../../components/ui/ComingSoonPanel";
import { StreamCard } from "./StreamCard";

// ponytail: ラベルのみ。カウントは出さない(カテゴリー別の配信数APIが無いため)。
const CATEGORIES = [
  { label: "ゲーム", icon: Gamepad2 },
  { label: "雑談", icon: MessageCircle },
  { label: "音楽", icon: Music },
  { label: "学習・教育", icon: BookOpen },
  { label: "クリエイティブ", icon: Palette },
  { label: "スポーツ", icon: Trophy },
];

export function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">STREAMLY STREAMING</span>
          <h1>
            見る、話す、贈る。
            <br />
            配信の体験を一つに。
          </h1>
          <p>HLS・SSE・ギフトAPIを最大限活かし、フロントエンドの体験に集中したストリーミングUI。</p>
          <div className="hero-actions">
            <Link className="primary-button large" to="/watch">
              <Play size={18} fill="currentColor" /> 配信を見る
            </Link>
            <a className="secondary-button large" href="#architecture">
              設計を見る
            </a>
          </div>
          <div className="capability-row">
            <span>
              <Radio size={15} /> HLS
            </span>
            <span>
              <MessageCircle size={15} /> SSE Chat
            </span>
            <span>
              <Gift size={15} /> Gifts
            </span>
          </div>
        </div>
        <div className="hero-mascot-wrap">
          <div className="hero-glow" />
          <img className="hero-mascot" src="/avatars/avatar1.png" alt="" />
        </div>
      </section>

      <div className="home-layout">
        <div className="home-main">
          <section className="section-block">
            <div className="section-title">
              <div>
                <span className="eyebrow">CATEGORIES</span>
                <h2>人気のカテゴリー</h2>
              </div>
            </div>
            <ComingSoonPanel
              eyebrow="CATEGORIES"
              title="カテゴリー一覧"
              note="配信一覧・カテゴリーAPIが追加され次第、絞り込みが有効になります"
            >
              <div className="category-row">
                {CATEGORIES.map(({ label, icon: Icon }) => (
                  <span className="category-pill" key={label}>
                    <Icon size={16} />
                    {label}
                  </span>
                ))}
              </div>
            </ComingSoonPanel>
          </section>

          <section className="section-block">
            <div className="section-title">
              <div>
                <span className="eyebrow">AVAILABLE NOW</span>
                <h2>おすすめのライブ</h2>
              </div>
              <span className="source-pill">固定 API × 1</span>
            </div>
            <div className="stream-grid">
              <StreamCard variant="live" />
              <StreamCard variant="placeholder" />
              <StreamCard variant="placeholder" />
              <StreamCard variant="placeholder" />
              <StreamCard variant="placeholder" />
            </div>
          </section>
        </div>

        <aside className="right-rail">
          <ComingSoonPanel
            eyebrow="FOLLOWING"
            title="フォロー中のライブ"
            note="フォロー機能はアカウント基盤が追加され次第対応します"
          >
            <PlaceholderRows />
          </ComingSoonPanel>

          <ComingSoonPanel
            eyebrow="GIFTERS"
            title="トップギフター"
            note="ギフト送信ランキングAPIが追加され次第表示されます"
          >
            <PlaceholderRows />
          </ComingSoonPanel>

          <Card className="gift-cta-card" variant="secondary">
            <Card.Header>
              <Card.Title>ギフトで配信を応援しよう</Card.Title>
              <Card.Description>ライブ視聴画面から実際にギフトを送れます。</Card.Description>
            </Card.Header>
            <Card.Footer>
              <Link className={buttonVariants({ variant: "primary" })} to="/watch">
                <Gift size={16} /> ギフトを見る
              </Link>
            </Card.Footer>
          </Card>
        </aside>
      </div>

      <section className="section-block" id="architecture">
        <div className="section-title">
          <div>
            <span className="eyebrow">FRONTEND FIRST</span>
            <h2>このスターターで重視していること</h2>
          </div>
        </div>
        <div className="feature-grid">
          <Feature
            icon={<Radio />}
            title="Adaptive player"
            text="横型・縦型を metadata から判定。映像は crop せず contain を基本にします。"
          />
          <Feature
            icon={<MessageCircle />}
            title="One SSE stream"
            text="チャットと弾幕は同じ EventSource を共有し、接続数を増やしません。"
          />
          <Feature
            icon={<Gift />}
            title="Gift-first UX"
            text="通常コメント、ギフト、ギフト＋メッセージを別の見た目で扱います。"
          />
          <Feature
            icon={<Sparkles />}
            title="Honest shell"
            text="バックエンドに存在しないデータは本物の機能として見せず、拡張ポイントに留めます。"
          />
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
