import { Card } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Clapperboard,
  Gamepad2,
  Gift,
  Laugh,
  MessageCircle,
  Music,
  Palette,
  Play,
  Rocket,
  Shapes,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ComingSoonPanel, PlaceholderRows } from "../../components/ui/ComingSoonPanel";
import { getRandomBanner } from "../../lib/banners";
import { useChannels } from "../../store/channels";
import { FollowedChannelsPanel } from "./FollowedChannelsPanel";
import { StreamCard, StreamCardSkeleton } from "./StreamCard";

const SKELETON_KEYS = ["skeleton-1", "skeleton-2", "skeleton-3"] as const;

const CATEGORY_OPTIONS: { label: string; icon: LucideIcon; tone: string }[] = [
  { label: "コメディ", icon: Laugh, tone: "coral" },
  { label: "ドラマ", icon: Clapperboard, tone: "amber" },
  { label: "ファンタジー", icon: Sparkles, tone: "violet" },
  { label: "SF", icon: Rocket, tone: "blue" },
  { label: "ゲーム", icon: Gamepad2, tone: "indigo" },
  { label: "雑談", icon: MessageCircle, tone: "sky" },
  { label: "音楽", icon: Music, tone: "pink" },
  { label: "学習・教育", icon: BookOpen, tone: "teal" },
  { label: "クリエイティブ", icon: Palette, tone: "peach" },
  { label: "スポーツ", icon: Trophy, tone: "green" },
  { label: "その他", icon: Shapes, tone: "slate" },
];

const CATEGORY_ICONS = new Map(CATEGORY_OPTIONS.map(({ label, icon }) => [label, icon]));
const CATEGORY_TONES = new Map(CATEGORY_OPTIONS.map(({ label, tone }) => [label, tone]));

function normalizeCategory(category: string) {
  return category.trim() || "その他";
}

export function HomePage() {
  // ponytail: random per page load, memoized so it doesn't swap mid-session.
  const banner = useMemo(() => getRandomBanner(), []);

  const { channels, status } = useChannels();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const categories = useMemo(() => {
    const counts = new Map(CATEGORY_OPTIONS.map(({ label }) => [label, 0]));
    for (const channel of channels) {
      const category = normalizeCategory(channel.category);
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }

    return [...counts]
      .map(([label, count]) => ({
        label,
        count,
        Icon: CATEGORY_ICONS.get(label) ?? Shapes,
        tone: CATEGORY_TONES.get(label) ?? "violet",
      }))
      .sort((left, right) => right.count - left.count);
  }, [channels]);
  const visibleChannels = selectedCategory
    ? channels.filter((channel) => normalizeCategory(channel.category) === selectedCategory)
    : channels;
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
              <button
                className="category-toggle"
                type="button"
                aria-controls="home-category-list"
                aria-expanded={showAllCategories}
                onClick={() => setShowAllCategories((current) => !current)}
              >
                {showAllCategories ? "折りたたむ" : "すべて見る"}
              </button>
            </div>
            <fieldset
              className={`category-row${showAllCategories ? " expanded" : ""}`}
              id="home-category-list"
              aria-label="カテゴリーで絞り込む"
            >
              {categories.map(({ label, count, Icon, tone }) => (
                <button
                  type="button"
                  className="category-card"
                  data-tone={tone}
                  aria-label={`${label} ${count}件`}
                  aria-pressed={selectedCategory === label}
                  disabled={count === 0}
                  onClick={() => setSelectedCategory((current) => (current === label ? null : label))}
                  key={label}
                >
                  <span className="category-icon">
                    <Icon size={18} />
                  </span>
                  <span className="category-copy">
                    <strong>{label}</strong>
                    <span>{count}件</span>
                  </span>
                </button>
              ))}
            </fieldset>
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
              ) : visibleChannels.length > 0 ? (
                visibleChannels.map((channel) => <StreamCard key={channel.id} channel={channel} />)
              ) : (
                <p className="inline-error">
                  {status === "error"
                    ? "配信一覧を取得できませんでした。"
                    : "現在配信中のチャンネルはありません。"}
                </p>
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
