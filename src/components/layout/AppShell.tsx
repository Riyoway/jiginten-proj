import { Link } from "@tanstack/react-router";
import { Gift, Heart, History, Home, Radio, Search, Settings } from "lucide-react";
import type { PropsWithChildren } from "react";

const navItems = [
  { to: "/" as const, label: "ホーム", icon: Home },
  { to: "/watch" as const, label: "ライブ", icon: Radio },
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
          <button className="nav-item muted" type="button" disabled>
            <Heart size={19} />
            <span>お気に入り</span>
          </button>
          <button className="nav-item muted" type="button" disabled>
            <History size={19} />
            <span>履歴</span>
          </button>
        </nav>

        <div className="sidebar-spacer" />
        <div className="profile-card">
          <img src="/avatars/avatar1.png" alt="Guest avatar" />
          <div>
            <strong>Guest</strong>
            <small>Default profile</small>
          </div>
        </div>
        <button className="icon-button" type="button" aria-label="設定">
          <Settings size={18} />
        </button>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="search-box" role="search">
            <Search size={18} />
            <input aria-label="配信を検索" placeholder="検索..." disabled />
            <span className="kbd">⌘K</span>
          </div>
          <div className="top-actions">
            <Link className="primary-button" to="/watch">
              <Radio size={17} />
              配信を見る
            </Link>
            <button className="icon-button" aria-label="ギフト" type="button">
              <Gift size={18} />
            </button>
            <img className="top-avatar" src="/avatars/avatar1.png" alt="Guest" />
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
