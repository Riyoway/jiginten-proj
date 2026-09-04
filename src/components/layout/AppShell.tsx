import { Avatar, Button, Dropdown, InputGroup, Kbd, Label, TextField, Tooltip } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Link } from "@tanstack/react-router";
import {
  Bell,
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
import { type PropsWithChildren, useEffect, useMemo } from "react";
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

// ponytail: ランキングAPIが無く一覧を出せないため、「押せない」ことが分かるmuted buttonとして置く。
const disabledNavItems = [{ label: "人気", icon: Flame }];

// ponytail: 全件並べるとsidebarが縦に溢れてプロフィールまで届かなくなるので絞る。
const SIDEBAR_CHANNEL_COUNT = 5;

// ponytail: プロフィール/設定/ヘルプも実装先のページ・APIが無いため選択不可のまま項目だけ置く。
const userMenuItems = [
  { id: "profile", label: "プロフィール", icon: User },
  { id: "settings", label: "設定", icon: Settings },
  { id: "help", label: "ヘルプ", icon: CircleHelp },
];

function preventImageSaving(event: Event) {
  if (event.target instanceof HTMLImageElement) {
    event.preventDefault();
  }
}

export function AppShell({ children }: PropsWithChildren) {
  useEffect(() => {
    document.addEventListener("contextmenu", preventImageSaving);
    document.addEventListener("dragstart", preventImageSaving);

    return () => {
      document.removeEventListener("contextmenu", preventImageSaving);
      document.removeEventListener("dragstart", preventImageSaving);
    };
  }, []);

  const { canInstall, promptInstall } = usePwaInstallPrompt();
  const { channels, status } = useChannels();
  const credits = useCreditStore((state) => state.balance);
  // 仮の表示名は「一覧全体」を基準に振る(表示は5件でも番号は全チャンネルで一意にする)。
  const channelIds = useMemo(() => channels.map((channel) => channel.id), [channels]);
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
            {/* ponytail: 1チャンネル=最大1ライブなので、同時配信N本 = N個の別チャンネル。 */}
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
                  {/* ponytail: channel.titleはコンテンツ名で配信者名ではないので、仮の表示名を出す。 */}
                  <span>{getStreamlyUserName(channel.id, channelIds)}</span>
                  {/* 全行が常にliveでaccessible nameとしては情報量が無いのでaria-hidden。 */}
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
              className="topbar-icon-btn topbar-install-btn"
              isIconOnly
              size="lg"
              variant="ghost"
              aria-label="インストール"
              isDisabled={!canInstall}
              onPress={promptInstall}
            >
              <Download size={22} />
            </Button>
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
            {/* 残高を見せるだけなので遷移しない。ツールチップを開かなくても読めるようaria-labelに入れる。 */}
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
