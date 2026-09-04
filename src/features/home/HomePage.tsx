import { Card } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Link } from "@tanstack/react-router";
import { BookOpen, Gamepad2, Gift, MessageCircle, Music, Palette, Play, Trophy } from "lucide-react";
import { useMemo } from "react";
import { ComingSoonPanel, PlaceholderRows } from "../../components/ui/ComingSoonPanel";
import { getRandomBanner } from "../../lib/banners";
import { useChannels } from "../../store/channels";
import { FollowedChannelsPanel } from "./FollowedChannelsPanel";
import { StreamCard, StreamCardSkeleton } from "./StreamCard";

const SKELETON_KEYS = ["skeleton-1", "skeleton-2", "skeleton-3"] as const;

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
  // ponytail: random per page load, memoized so it doesn't swap mid-session.
  const banner = useMemo(() => getRandomBanner(), []);

  const { channels, status } = useChannels();
  // ponytail: ギフトCTAの飛び先。channelsは非同期に埋まるので依存は[channels](bannerの[]とは違う)。
  // 引き直るのは取得完了の1回だけ。未取得ならパラメータ無し = resolveSelectedChannelがdefaultへ落とす。
  // hrefは描画時に決まるので「アクセスごと」にランダム。onClickでの都度抽選にすると
  // 中クリックや新規タブが壊れるのでやらない。
  const giftChannel = useMemo(() => channels[Math.floor(Math.random() * channels.length)], [channels]);
  const channelsLoading = status === "loading" || status === "idle";

  return (
    <div className="home-page">
      <div className="home-layout">
        <div className="home-main">
          <section className="hero-panel" style={{ backgroundImage: `url(${banner})` }}>
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
            </div>
          </section>

          <section className="section-block">
            <div className="section-title">
              <div>
                <h2>人気のカテゴリー</h2>
              </div>
            </div>
            <ComingSoonPanel title="カテゴリー一覧" note="近日、カテゴリーごとの絞り込みに対応予定です">
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
                <h2>おすすめのライブ</h2>
              </div>
            </div>
            <div className="stream-grid">
              {channelsLoading ? (
                SKELETON_KEYS.map((key) => <StreamCardSkeleton key={key} />)
              ) : channels.length > 0 ? (
                channels.map((channel) => <StreamCard key={channel.id} channel={channel} />)
              ) : (
                // channels.json取得失敗/空 -> 互換エンドポイントの単一配信にフォールバック
                <Link className="stream-card stream-card-live" to="/watch">
                  <div className="stream-card-thumb live-thumb">
                    <img src="/noimage.jpg" alt="" loading="lazy" />
                    <span className="live-badge">LIVE</span>
                    <span className="stream-card-play">
                      <Play size={22} fill="currentColor" />
                    </span>
                  </div>
                  <div className="stream-card-body">
                    <img src="/avatars/avatar1.png" alt="" />
                    <div>
                      <strong>ライブ配信中</strong>
                      <span>Streamly</span>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </section>
        </div>

        <aside className="right-rail">
          <FollowedChannelsPanel channels={channels} loading={channelsLoading} />

          <ComingSoonPanel title="トップギフター" note="近日公開予定です">
            <PlaceholderRows />
          </ComingSoonPanel>

          <Card className="gift-cta-card" variant="secondary">
            <Card.Header>
              <Card.Title>ギフトで配信を応援しよう</Card.Title>
              <Card.Description>ライブ視聴画面から実際にギフトを送れます。</Card.Description>
            </Card.Header>
            <Card.Footer>
              <Link
                className={buttonVariants({ variant: "primary" })}
                to="/watch"
                search={{ channel: giftChannel?.id }}
              >
                <Gift size={16} /> ギフトを見る
              </Link>
            </Card.Footer>
          </Card>
        </aside>
      </div>
    </div>
  );
}
