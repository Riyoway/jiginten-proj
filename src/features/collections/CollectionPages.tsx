import { Button } from "@heroui/react";
import type { ReactNode } from "react";
import type { Channel } from "../../lib/api/contracts";
import { useChannels } from "../../store/channels";
import { useFavoriteStore } from "../../store/favorites";
import { useFollowStore } from "../../store/follows";
import { useHistoryStore } from "../../store/history";
// ponytail: カードはHomeのライブグリッドと同じ見た目にしたいので、features/homeのものを再利用する
// (3箇所目の利用が出てきたらcomponents/uiへ昇格させる)。
import { StreamCard, StreamCardSkeleton } from "../home/StreamCard";

const SKELETON_KEYS = ["collection-skeleton-1", "collection-skeleton-2"] as const;

interface ChannelCollectionPageProps {
  title: string;
  /** 表示したい順に並んだチャンネルid(お気に入り/フォローは追加順、履歴は新しい順)。 */
  ids: string[];
  emptyText: string;
  offlineText: string;
  offlineCountText: (count: number) => string;
  action?: ReactNode;
}

// ponytail: お気に入り / フォロー中 / 履歴はどれも「端末内のid集合 ∩ 配信中」で形が同じなので、
// 1つのページコンポーネントに文言だけ差し替えて使う(FollowedChannelsPanelと同じ考え方)。
function ChannelCollectionPage({
  title,
  ids,
  emptyText,
  offlineText,
  offlineCountText,
  action,
}: ChannelCollectionPageProps) {
  const { channels, status } = useChannels();
  const loading = status === "loading" || status === "idle";

  // /channels.jsonは配信中のチャンネルしか返さないため、保存済み ∩ 配信中 が表示対象。
  // 残りは「今は配信していない分」として件数だけ伝える(名前は取得できないので出さない)。
  const live = ids
    .map((id) => channels.find((channel) => channel.id === id))
    .filter((channel): channel is Channel => channel !== undefined);
  const offlineCount = ids.length - live.length;

  return (
    <div className="collection-page">
      <section className="section-block">
        <div className="section-title">
          <div>
            <h2>{title}</h2>
          </div>
          {action}
        </div>

        {loading ? (
          <div className="stream-grid">
            {SKELETON_KEYS.map((key) => (
              <StreamCardSkeleton key={key} />
            ))}
          </div>
        ) : ids.length === 0 ? (
          <p className="collection-empty">{emptyText}</p>
        ) : (
          <>
            {live.length > 0 ? (
              <div className="stream-grid">
                {live.map((channel) => (
                  <StreamCard key={channel.id} channel={channel} />
                ))}
              </div>
            ) : (
              <p className="collection-empty">{offlineText}</p>
            )}
            {live.length > 0 && offlineCount > 0 ? (
              <p className="collection-note offline-note">{offlineCountText(offlineCount)}</p>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

export function FavoritesPage() {
  const ids = useFavoriteStore((state) => state.ids);

  return (
    <ChannelCollectionPage
      title="お気に入り"
      ids={ids}
      emptyText="配信画面の「お気に入り」を押すと、ここにまとまります。"
      offlineText="お気に入りのチャンネルは現在配信していません。"
      offlineCountText={(count) => `他${count}件のお気に入りは現在配信していません。`}
    />
  );
}

export function FollowsPage() {
  const ids = useFollowStore((state) => state.ids);

  return (
    <ChannelCollectionPage
      title="フォロー中"
      ids={ids}
      emptyText="配信画面の「フォロー」を押すと、ここにまとまります。"
      offlineText="フォロー中のチャンネルは現在配信していません。"
      offlineCountText={(count) => `他${count}件のフォロー中チャンネルは現在配信していません。`}
    />
  );
}

export function HistoryPage() {
  const ids = useHistoryStore((state) => state.ids);
  const clear = useHistoryStore((state) => state.clear);

  return (
    <ChannelCollectionPage
      title="履歴"
      ids={ids}
      emptyText="配信を視聴すると、ここに履歴が残ります。"
      offlineText="履歴のチャンネルは現在配信していません。"
      offlineCountText={(count) => `他${count}件の履歴は現在配信していません。`}
      action={
        ids.length > 0 ? (
          <Button size="sm" variant="ghost" onPress={clear}>
            履歴を削除
          </Button>
        ) : null
      }
    />
  );
}
