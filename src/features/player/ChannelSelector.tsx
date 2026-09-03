import { Link } from "@tanstack/react-router";
import type { Channel } from "../../lib/api/contracts";

interface ChannelSelectorProps {
  channels: Channel[];
  selectedId?: string;
}

// ponytail: 切り替え先が無い(0-1チャンネル)ときは意味の無いUIになるので何も出さない。
// 表示文言は「チャンネル」ではなく「ライブ」にする: channel.titleはコンテンツ名で、
// 実体は「1つのStreamlyチャンネルが持つ複数のライブ」を切り替えるUIのため。
export function ChannelSelector({ channels, selectedId }: ChannelSelectorProps) {
  if (channels.length < 2) return null;

  return (
    <nav className="channel-selector" aria-label="ライブを選ぶ">
      {channels.map((channel) => (
        <Link
          key={channel.id}
          className={`channel-tab ${channel.id === selectedId ? "active" : ""}`}
          to="/watch"
          search={{ channel: channel.id }}
          aria-current={channel.id === selectedId ? "true" : undefined}
        >
          {channel.title}
        </Link>
      ))}
    </nav>
  );
}
