import { useChannels } from "../../store/channels";
import { useFavoriteStore } from "../../store/favorites";
// ponytail: カードはHomeのライブグリッドと同じ見た目にしたいので、features/homeのものを再利用する
// (3箇所目の利用が出てきたらcomponents/uiへ昇格させる)。
import { StreamCard, StreamCardSkeleton } from "../home/StreamCard";

const SKELETON_KEYS = ["favorite-skeleton-1", "favorite-skeleton-2"] as const;

export function FavoritesPage() {
  const { channels, status } = useChannels();
  const favoriteIds = useFavoriteStore((state) => state.ids);
  const loading = status === "loading" || status === "idle";

  // /channels.jsonは配信中のチャンネルしか返さないため、お気に入り ∩ 配信中 が表示対象。
  // 残りは「今は配信していないお気に入り」として件数だけ伝える(名前は取得できないので出さない)。
  const liveFavorites = channels.filter((channel) => favoriteIds.includes(channel.id));
  const offlineCount = favoriteIds.length - liveFavorites.length;

  return (
    <div className="favorites-page">
      <section className="section-block">
        <div className="section-title">
          <div>
            <h2>お気に入り</h2>
            <span className="favorites-note">この端末に保存されています</span>
          </div>
        </div>

        {loading ? (
          <div className="stream-grid">
            {SKELETON_KEYS.map((key) => (
              <StreamCardSkeleton key={key} />
            ))}
          </div>
        ) : favoriteIds.length === 0 ? (
          <p className="favorites-empty">
            配信画面の「お気に入り」を押すと、ここにまとまります(この端末のみ)。
          </p>
        ) : (
          <>
            {liveFavorites.length > 0 ? (
              <div className="stream-grid">
                {liveFavorites.map((channel) => (
                  <StreamCard key={channel.id} channel={channel} />
                ))}
              </div>
            ) : (
              <p className="favorites-empty">お気に入りのチャンネルは現在配信していません。</p>
            )}
            {liveFavorites.length > 0 && offlineCount > 0 ? (
              <p className="favorites-note offline-note">
                他{offlineCount}件のお気に入りは現在配信していません。
              </p>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
