import { Card } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import type { Channel } from "../../lib/api/contracts";
import { getStreamlyUserName } from "../../lib/streamlyUsers";
import { useFollowStore } from "../../store/follows";

interface FollowedChannelsPanelProps {
  channels: Channel[];
  loading: boolean;
}

// ponytail: フォローは端末内保存(store/follows.ts)なので、この枠はもう実データで出せる。
// /channels.jsonは配信中のチャンネルしか返さないため「フォロー済み ∩ 配信中」がこの一覧になる。
export function FollowedChannelsPanel({ channels, loading }: FollowedChannelsPanelProps) {
  const followedIds = useFollowStore((state) => state.ids);
  // 仮の表示名は一覧全体を基準にする(フォロー分だけで番号を振ると他画面と食い違う)。
  const channelIds = channels.map((channel) => channel.id);
  const followedLive = channels.filter((channel) => followedIds.includes(channel.id));

  return (
    <Card className="rail-panel" variant="transparent">
      <Card.Header className="rail-panel-header">
        <Card.Title>フォロー中のライブ</Card.Title>
        <Link className="rail-panel-link" to="/follows">
          すべて見る
        </Link>
      </Card.Header>
      <Card.Content>
        {followedLive.length > 0 ? (
          <div className="rail-channel-list">
            {followedLive.map((channel) => (
              <Link
                key={channel.id}
                className="rail-channel-row"
                to="/watch"
                search={{ channel: channel.id }}
              >
                <img className="rail-channel-thumbnail" src="/avatars/avatar1.png" alt="" />
                <span className="rail-channel-body">
                  <span className="rail-channel-topline">
                    <span className="live-badge rail-channel-live-badge">LIVE</span>
                    <span className="rail-channel-name">{getStreamlyUserName(channel.id, channelIds)}</span>
                  </span>
                  <strong className="rail-channel-title">{channel.title}</strong>
                  {channel.category.trim() ? (
                    <span className="rail-channel-category">{channel.category}</span>
                  ) : null}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <Card.Description>
            {followedIds.length === 0
              ? "配信画面でフォローすると、ここに表示されます"
              : loading
                ? "読み込み中…"
                : "フォロー中のチャンネルは現在配信していません"}
          </Card.Description>
        )}
      </Card.Content>
    </Card>
  );
}
