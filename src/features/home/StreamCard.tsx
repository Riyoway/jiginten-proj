import { Link } from "@tanstack/react-router";
import { Hourglass, Play } from "lucide-react";
import type { Channel } from "../../lib/api/contracts";
import { StreamThumbnail } from "./StreamThumbnail";

interface StreamCardProps {
  channel: Channel;
}

export function StreamCard({ channel }: StreamCardProps) {
  return (
    <Link className="stream-card stream-card-live" to="/watch" search={{ channel: channel.id }}>
      <div className="stream-card-thumb live-thumb">
        <StreamThumbnail channel={channel} className="stream-card-thumbnail" />
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
