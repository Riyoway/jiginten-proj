import { Link } from "@tanstack/react-router";
import { Hourglass, Play } from "lucide-react";
import type { Channel } from "../../lib/api/contracts";

interface StreamCardProps {
  channel: Channel;
}

const THUMB_VARIANTS = 3;

// ponytail: サムネイル画像APIが無いため、チャンネルごとに見た目を変える
// (同じ枠を使い回すと全カードが同一に見えて壊れて見えるため)。
// channel.idのハッシュで固定色を選ぶ — 並び順が変わっても同じチャンネルは同じ色。
function thumbVariant(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % THUMB_VARIANTS;
  return hash;
}

export function StreamCard({ channel }: StreamCardProps) {
  return (
    <Link className="stream-card stream-card-live" to="/watch" search={{ channel: channel.id }}>
      <div className={`stream-card-thumb live-thumb thumb-${thumbVariant(channel.id)}`}>
        <span className="live-badge">LIVE</span>
        <span className="stream-card-play">
          <Play size={22} fill="currentColor" />
        </span>
      </div>
      <div className="stream-card-body">
        <img src="/avatars/avatar1.png" alt="" />
        <div>
          <strong>{channel.title}</strong>
          <span>Streamly · ライブ配信中</span>
        </div>
      </div>
    </Link>
  );
}

// ponytail: /channels.json取得中だけ表示する本物のローディングskeleton
// (以前の「機能が無いので誤魔化す」placeholderとは意味が違うので注意)。
export function StreamCardSkeleton() {
  return (
    <div className="stream-card stream-card-placeholder" aria-hidden="true">
      <div className="stream-card-thumb placeholder-thumb">
        <Hourglass size={20} />
      </div>
      <div className="stream-card-body">
        <strong>読み込み中</strong>
        <span>チャンネル情報を取得しています</span>
      </div>
    </div>
  );
}
