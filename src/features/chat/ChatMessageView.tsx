import { useMemo } from "react";
import { Gift as GiftIcon } from "lucide-react";
import type { ChatMessage } from "../../lib/api/contracts";
import { getRandomAvatar } from "../../lib/avatars";

export function ChatMessageView({ message }: { message: ChatMessage }) {
  // ponytail: random per message.key, memoized so it doesn't reshuffle on re-render
  const avatar = useMemo(() => getRandomAvatar(), [message.key]);

  if (message.gift) {
    return (
      <article className="chat-message gift-message">
        <img className="chat-avatar" src={avatar} alt="" />
        <div className="chat-body">
          <div className="chat-meta">
            <strong>Guest</strong>
            <span className="gift-chip"><GiftIcon size={12} /> GIFT</span>
          </div>
          <div className="gift-highlight">
            {message.gift.iconUrl ? <img src={message.gift.iconUrl} alt="" /> : <GiftIcon size={24} />}
            <strong>{message.gift.name}</strong>
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
