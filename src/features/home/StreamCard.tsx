import { Link } from "@tanstack/react-router";
import { Hourglass, Play } from "lucide-react";

interface StreamCardProps {
  variant: "live" | "placeholder";
}

// ponytail: 配信一覧APIが無いので本物は1枚だけ。残りのグリッド枠は
// コンセプト通りのレイアウトを保ちつつ「準備中」と正直に示すplaceholder。
export function StreamCard({ variant }: StreamCardProps) {
  if (variant === "placeholder") {
    return (
      <div className="stream-card stream-card-placeholder" aria-hidden="true">
        <div className="stream-card-thumb placeholder-thumb">
          <Hourglass size={20} />
        </div>
        <div className="stream-card-body">
          <strong>近日公開</strong>
          <span>近日公開予定です</span>
        </div>
      </div>
    );
  }

  return (
    <Link className="stream-card stream-card-live" to="/watch">
      <div className="stream-card-thumb live-thumb">
        <span className="live-badge">LIVE</span>
        <span className="stream-card-play">
          <Play size={22} fill="currentColor" />
        </span>
      </div>
      <div className="stream-card-body">
        <img src="/avatars/avatar1.png" alt="" />
        <div>
          <strong>雪景色の線路を眺める配信</strong>
          <span>Streamly · ライブ配信中</span>
        </div>
      </div>
    </Link>
  );
}
