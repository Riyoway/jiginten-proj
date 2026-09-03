import { Avatar, Button, InputGroup, Kbd, TextField } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Link } from "@tanstack/react-router";
import { Bell, Flame, Gift, Heart, History, Home, Radio, Search, Settings, Users } from "lucide-react";
import type { PropsWithChildren } from "react";
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

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/" aria-label="Streamly ホーム">
          <span className="brand-mark">S</span>
          <span>Streamly</span>
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

        <ComingSoonPanel
          eyebrow="CHANNELS"
          title="おすすめチャンネル"
          note="配信一覧APIが追加され次第表示されます"
        >
          <PlaceholderRows />
        </ComingSoonPanel>

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
        <Button className="sidebar-icon-btn" isIconOnly variant="ghost" aria-label="設定">
          <Settings size={18} />
        </Button>
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
              variant="ghost"
              aria-label="通知（近日公開）"
              isDisabled
            >
              <Bell size={18} />
            </Button>
            <Link
              className={`topbar-icon-btn ${buttonVariants({ variant: "ghost", isIconOnly: true })}`}
              to="/watch"
              aria-label="ギフトを見る"
            >
              <Gift size={18} />
            </Link>
            <Avatar size="sm">
              <Avatar.Image src="/avatars/avatar1.png" alt="Guest" />
              <Avatar.Fallback>G</Avatar.Fallback>
            </Avatar>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
