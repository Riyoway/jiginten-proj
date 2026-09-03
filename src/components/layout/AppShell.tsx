import { Avatar, Button, Dropdown, InputGroup, Kbd, Label, TextField } from "@heroui/react";
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
import type { PropsWithChildren } from "react";
import { usePwaInstallPrompt } from "../../lib/pwaInstall";
import { getStreamlyUserName } from "../../lib/streamlyUsers";
import { useChannels } from "../../store/channels";
import { ComingSoonPanel, PlaceholderRows } from "../ui/ComingSoonPanel";

const navItems = [
  { to: "/" as const, label: "ホーム", icon: Home },
  { to: "/watch" as const, label: "ライブ", icon: Radio },
];

// ponytail: フォロー/人気/お気に入り/履歴はいずれもAPIが存在しないため、
// 実装せず「押せない」ことが分かるmuted buttonとして配置するだけに留める。
const disabledNavItems = [
  { label: "フォロー中", icon: Users },
  { label: "人気", icon: Flame },
  { label: "お気に入り", icon: Heart },
  { label: "履歴", icon: History },
];

// ponytail: プロフィール/設定/ヘルプも同じ理由(実装先のページ・APIが無い)で
// 選択不可のまま項目だけ用意しておく。
const userMenuItems = [
  { id: "profile", label: "プロフィール", icon: User },
  { id: "settings", label: "設定", icon: Settings },
  { id: "help", label: "ヘルプ", icon: CircleHelp },
];

export function AppShell({ children }: PropsWithChildren) {
  const { canInstall, promptInstall } = usePwaInstallPrompt();
  const { channels, status } = useChannels();

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
              {channels.map((channel) => (
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
                  <span>{getStreamlyUserName(channel.id)}</span>
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
          <div>
            <strong>Guest</strong>
            <small>Default profile</small>
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
              className="topbar-icon-btn"
              isIconOnly
              size="lg"
              variant="ghost"
              aria-label="通知（近日公開）"
              isDisabled
            >
              <Bell size={22} />
            </Button>
            <Link
              className={`topbar-icon-btn ${buttonVariants({ variant: "ghost", isIconOnly: true, size: "lg" })}`}
              to="/watch"
              aria-label="ギフトを見る"
            >
              <Gift size={22} />
            </Link>
            <Dropdown>
              <Button className="user-menu-trigger" isIconOnly size="lg" variant="ghost" aria-label="ユーザーメニュー">
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
