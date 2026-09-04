import { Avatar, Button, Dropdown, InputGroup, Kbd, Label, TextField, Tooltip } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  Download,
  Flame,
  Gift,
  Heart,
  History,
  Home,
  Radio,
  Search,
  Settings,
  User,
  Users,
} from "lucide-react";
import { type PropsWithChildren, useMemo } from "react";
import { pickRandom } from "../../lib/pickRandom";
import { usePwaInstallPrompt } from "../../lib/pwaInstall";
import { getStreamlyUserName } from "../../lib/streamlyUsers";
import { useChannels } from "../../store/channels";
import { useCreditStore } from "../../store/credits";
import { ComingSoonPanel, PlaceholderRows } from "../ui/ComingSoonPanel";

const navItems = [
  { to: "/" as const, label: "ホーム", icon: Home },
  { to: "/watch" as const, label: "ライブ", icon: Radio },
  // お気に入り/フォロー中/履歴は端末内保存(store/{favorites,follows,history}.ts)で
  // 実装済みなので実ページへ遷移する。
  { to: "/favorites" as const, label: "お気に入り", icon: Heart },
  { to: "/follows" as const, label: "フォロー中", icon: Users },
  { to: "/history" as const, label: "履歴", icon: History },
];

// ponytail: 人気はランキングAPIが無く一覧を出せないため、「押せない」ことが分かる
// muted buttonとして項目だけ置く。
const disabledNavItems = [{ label: "人気", icon: Flame }];

// ponytail: プロフィール/設定/ヘルプも同じ理由(実装先のページ・APIが無い)で
// 選択不可のまま項目だけ用意しておく。
// ponytail: 「おすすめ」なので全件並べる必要はない。13チャンネルを全部出すとsidebarが
// 縦に溢れてプロフィール/インストールがスクロールしないと届かなくなるため、ランダムに絞る。
const SIDEBAR_CHANNEL_COUNT = 5;

const userMenuItems = [
  { id: "profile", label: "プロフィール", icon: User },
  { id: "settings", label: "設定", icon: Settings },
  { id: "help", label: "ヘルプ", icon: CircleHelp },
];

export function AppShell({ children }: PropsWithChildren) {
  const { canInstall, promptInstall } = usePwaInstallPrompt();
  const { channels, status } = useChannels();
  const credits = useCreditStore((state) => state.balance);
  // 仮の表示名は「一覧全体」を基準に振る(表示するのは5件でも番号は全13件で一意にする)。
  const channelIds = useMemo(() => channels.map((channel) => channel.id), [channels]);
  // channelsは非同期に埋まるので依存は[channels]。引き直るのは取得完了の1回だけ。
  const featuredChannels = useMemo(() => pickRandom(channels, SIDEBAR_CHANNEL_COUNT), [channels]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/" aria-label="Streamly ホーム">
          <img className="brand-mark" src="/icon.png" alt="" />
          <span className="brand-text">
            <strong>Streamly</strong>
            <small>Watch. Chat. Enjoy.</small>
          </span>
        </Link>

        <nav className="side-nav" aria-label="メインナビゲーション">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="nav-item" activeProps={{ className: "nav-item active" }}>
              <Icon size={19} />
              <span>{label}</span>
            </Link>
          ))}
          {disabledNavItems.map(({ label, icon: Icon }) => (
            <button key={label} className="nav-item muted" type="button" disabled>
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {channels.length > 0 ? (
          <div className="sidebar-channels">
            {/* ponytail: 1チャンネル=最大1ライブなので、3ライブ同時に立っている今は
                3つの別チャンネルが存在するということ。「おすすめチャンネル」表記が正しい。 */}
            <strong className="sidebar-channels-title">おすすめチャンネル</strong>
            <div className="sidebar-channel-list">
              {featuredChannels.map((channel) => (
                <Link
                  key={channel.id}
                  className="sidebar-channel-link"
                  to="/watch"
                  search={{ channel: channel.id }}
                >
                  <img src="/avatars/avatar1.png" alt="" />
                  {/* ponytail: channel.titleはコンテンツ名であって配信者名ではない。
                      配信者アカウントAPIが無いのはchatのGuestと同じ制約なので、
                      id単位で決定的に選んだ仮の表示名(Streamly User N)にする。 */}
                  <span>{getStreamlyUserName(channel.id, channelIds)}</span>
                  {/* ponytail: 数値(視聴者数等)は出さないが、実際に配信中という事実だけは示す。
                      一覧の全行が常にliveなので情報量が無く、リンクのaccessible nameには含めない。 */}
                  <span className="sidebar-channel-live-dot" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <ComingSoonPanel
            title="おすすめチャンネル"
            note={status === "error" ? "配信一覧を取得できませんでした" : "近日公開予定です"}
          >
            <PlaceholderRows />
          </ComingSoonPanel>
        )}

        <Button
          className="pwa-install-btn"
          variant="ghost"
          fullWidth
          isDisabled={!canInstall}
          onPress={promptInstall}
        >
          <Download size={16} /> インストール
        </Button>

        <div className="sidebar-spacer" />
        <div className="profile-card">
          <Avatar size="sm">
            <Avatar.Image src="/avatars/avatar1.png" alt="" />
            <Avatar.Fallback>G</Avatar.Fallback>
          </Avatar>
          <div className="profile-card-details">
            <strong>Guest</strong>
            <small className="profile-tier">Premium</small>
            <span className="profile-credits">
              <img className="profile-credit-icon" src="/credits.svg" alt="" />
              <span>{credits.toLocaleString()} P</span>
            </span>
          </div>
          <ChevronRight className="profile-card-chevron" size={18} aria-hidden="true" />
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <TextField aria-label="配信を検索" className="search-field" isDisabled>
            <InputGroup>
              <InputGroup.Prefix>
                <Search size={16} />
              </InputGroup.Prefix>
              <InputGroup.Input placeholder="検索..." />
              <InputGroup.Suffix>
                <Kbd className="topbar-kbd">
                  <Kbd.Abbr keyValue="command" />
                  <Kbd.Content>K</Kbd.Content>
                </Kbd>
              </InputGroup.Suffix>
            </InputGroup>
          </TextField>
          <div className="top-actions">
            <Link className={`topbar-cta ${buttonVariants({ variant: "primary" })}`} to="/watch">
              <Radio size={16} />
              配信を見る
            </Link>
            <Button
              className="topbar-icon-btn"
              isIconOnly
              size="lg"
              variant="ghost"
              aria-label="通知（近日公開）"
              isDisabled
            >
              <Bell size={22} />
            </Button>
            {/* ponytail: モバイルではsidebarがdock(nav専用)になりインストールボタンの
                置き場が無くなるため、インストール可能なときだけtopbarへ出す。 */}
            {canInstall ? (
              <Button
                className="topbar-icon-btn topbar-install-btn"
                isIconOnly
                size="lg"
                variant="ghost"
                aria-label="インストール"
                onPress={promptInstall}
              >
                <Download size={22} />
              </Button>
            ) : null}
            {/* ponytail: 以前は/watchへのリンクだったが、残高を見せるだけの表示に変えたので遷移しない。
                Tooltipはhoverとキーボードフォーカスの両方で開く(HeroUIのCSSは@heroui/stylesに入っている)。
                aria-labelに残高を入れて、ツールチップを開かなくても読み上げられるようにする。 */}
            <Tooltip delay={150} closeDelay={100}>
              <Button
                className="topbar-icon-btn"
                isIconOnly
                size="lg"
                variant="ghost"
                aria-label={`ギフトクレジット ${credits.toLocaleString()}`}
              >
                <Gift size={22} />
              </Button>
              <Tooltip.Content>
                <span className="topbar-credit-value">{credits.toLocaleString()} クレジット</span>
                <span className="topbar-credit-note">
                  この端末だけに保存されます(サーバーの残高ではありません)
                </span>
              </Tooltip.Content>
            </Tooltip>
            <Dropdown>
              <Button
                className="user-menu-trigger"
                isIconOnly
                size="lg"
                variant="ghost"
                aria-label="ユーザーメニュー"
              >
                <Avatar size="md">
                  <Avatar.Image src="/avatars/avatar1.png" alt="Guest" />
                  <Avatar.Fallback>G</Avatar.Fallback>
                </Avatar>
              </Button>
              <Dropdown.Popover>
                <Dropdown.Menu disabledKeys={userMenuItems.map((item) => item.id)}>
                  {userMenuItems.map(({ id, label, icon: Icon }) => (
                    <Dropdown.Item key={id} id={id} textValue={label}>
                      <Icon className="size-4 shrink-0 text-muted" />
                      <Label>{label}</Label>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
