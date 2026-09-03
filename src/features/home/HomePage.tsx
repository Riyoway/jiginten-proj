import { Card } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Link } from "@tanstack/react-router";
import { BookOpen, Gamepad2, Gift, MessageCircle, Music, Palette, Play, Radio, Trophy } from "lucide-react";
import { useEffect } from "react";
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
  // ponytail: page (not a fixed-height panel) overflows the viewport, and
  // <html> (not <body>) is the actual scrolling element — scope hiding its
  // native scrollbar to Home via a class.
  useEffect(() => {
    document.documentElement.classList.add("home-no-scrollbar");
    return () => document.documentElement.classList.remove("home-no-scrollbar");
  }, []);

  return (
    <div className="home-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">ようこそ Streamly へ</span>
          <h1>
            好きな配信を見つけて
            <br />
            みんなで楽しもう!
          </h1>
          <p>ライブ、チャット、ギフトで配信をもっと楽しく。</p>
          <div className="hero-actions">
            <Link className="primary-button" to="/watch">
              <Play size={16} fill="currentColor" /> 配信を見る
            </Link>
          </div>
          <div className="capability-row">
            <span>
              <Radio size={15} /> ライブ配信
            </span>
            <span>
              <MessageCircle size={15} /> リアルタイムチャット
            </span>
            <span>
              <Gift size={15} /> ギフト
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
              note="近日、カテゴリーごとの絞り込みに対応予定です"
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
          <ComingSoonPanel eyebrow="FOLLOWING" title="フォロー中のライブ" note="近日対応予定です">
            <PlaceholderRows />
          </ComingSoonPanel>

          <ComingSoonPanel eyebrow="GIFTERS" title="トップギフター" note="近日公開予定です">
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
    </div>
  );
}
