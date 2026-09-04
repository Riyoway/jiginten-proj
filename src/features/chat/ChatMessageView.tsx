import { Gift as GiftIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ChatMessage } from "../../lib/api/contracts";
import { getRandomAvatar } from "../../lib/avatars";
import { GIFT_ANIMATION_DURATION_MS, GiftImage } from "../gifts/GiftImage";

export function ChatMessageView({ message }: { message: ChatMessage }) {
  // ponytail: インスタンス=1メッセージなので、依存なしでそのメッセージの間だけ固定になる。
  // message.key(= payload.id)からアバターを導出してはいけない(発言者の同一性を作らない)。
  const avatar = useMemo(() => getRandomAvatar(), []);
  const animationUrl = message.gift?.animationUrl;
  const [animateGift, setAnimateGift] = useState(Boolean(animationUrl));

  useEffect(() => {
    if (!animationUrl) return;

    setAnimateGift(true);
    const timer = window.setTimeout(() => setAnimateGift(false), GIFT_ANIMATION_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [animationUrl]);

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
          {/* ponytail: チャットに流れてくる演出もプレイヤー上と同じ5秒で静止アイコンへ戻す。
              reduced-motion のときは GiftImage が最初から静止アイコンに落とす。 */}
          <div className="gift-highlight">
            <GiftImage
              className="gift-highlight-image"
              iconUrl={message.gift.iconUrl}
              animationUrl={message.gift.animationUrl}
              animate={animateGift}
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
