import { Gift as GiftIcon } from "lucide-react";
import { useMemo } from "react";
import type { ChatMessage } from "../../lib/api/contracts";
import { getRandomAvatar } from "../../lib/avatars";
import { GiftImage } from "../gifts/GiftImage";

export function ChatMessageView({ message }: { message: ChatMessage }) {
  // ponytail: ChatPanelが key={message.key} で描画するのでインスタンス=1メッセージ。
  // 依存なしで「そのメッセージの間だけ固定」になる(再描画で引き直さない)。
  // message.key は payload.id なので、そこからアバターを導出してはいけない
  // (CLAUDE.md: idやテキストから発言者の同一性を作らない)。
  const avatar = useMemo(() => getRandomAvatar(), []);

  if (message.gift) {
    return (
      <article className="chat-message gift-message">
        <img className="chat-avatar" src={avatar} alt="" />
        <div className="chat-body">
          <div className="chat-meta">
            <strong>Guest</strong>
            <time>{formatTime(message.receivedAt)}</time>
            <span className="gift-chip">
              <GiftIcon size={12} /> GIFT
            </span>
          </div>
          {/* ponytail: 「アニメーション付きのギフトだ」と分かるように、ここだけは常に再生する
              (他の場所の既定は静止アイコン)。loop count 0 なので回り続けるが、
              画面外のチャットはブラウザがアニメーションを止めるので放置してよい。
              reduced-motion のときは GiftImage が静止アイコンに落とす。 */}
          <div className="gift-highlight">
            <GiftImage
              className="gift-highlight-image"
              iconUrl={message.gift.iconUrl}
              animationUrl={message.gift.animationUrl}
              animate
            />
            <div className="gift-highlight-body">
              <strong>{message.gift.name}</strong>
              {message.gift.cost != null ? (
                <span className="gift-highlight-cost">{message.gift.cost.toLocaleString()}</span>
              ) : null}
            </div>
          </div>
          {message.text ? <p className="gift-caption">{message.text}</p> : null}
        </div>
      </article>
    );
  }

  return (
    <article className="chat-message">
      <img className="chat-avatar" src={avatar} alt="" />
      <div className="chat-body">
        <div className="chat-meta">
          <strong>Guest</strong>
          <time>{formatTime(message.receivedAt)}</time>
        </div>
        <p>{message.text || "…"}</p>
      </div>
    </article>
  );
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}
