import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../../lib/api/contracts";
import { useCommentStore } from "../../store/comments";
import { usePreferenceStore } from "../../store/preferences";

interface ActiveDanmaku {
  key: string;
  text: string;
  lane: number;
  gift: boolean;
}

const LANE_COUNT = 7;

export function DanmakuLayer() {
  const messages = useCommentStore((state) => state.messages);
  const enabled = usePreferenceStore((state) => state.danmakuEnabled);
  const opacity = usePreferenceStore((state) => state.danmakuOpacity);
  const [active, setActive] = useState<ActiveDanmaku[]>([]);
  const previousCount = useRef(0);
  const nextLane = useRef(0);

  useEffect(() => {
    if (messages.length <= previousCount.current) {
      previousCount.current = messages.length;
      return;
    }

    const fresh = messages.slice(previousCount.current).filter(hasRenderableText);
    previousCount.current = messages.length;
    if (!fresh.length) return;

    const additions = fresh.map((message) => {
      const lane = nextLane.current;
      nextLane.current = (nextLane.current + 1) % LANE_COUNT;
      return {
        key: `${message.key}-danmaku`,
        text: message.text,
        lane,
        gift: Boolean(message.gift),
      };
    });

    setActive((current) => [...current, ...additions]);
    const timer = window.setTimeout(() => {
      const expired = new Set(additions.map((item) => item.key));
      setActive((current) => current.filter((item) => !expired.has(item.key)));
    }, 9000);

    return () => window.clearTimeout(timer);
  }, [messages]);

  if (!enabled) return null;

  return (
    <div className="danmaku-layer" aria-hidden="true" style={{ opacity }}>
      {active.map((item) => (
        <span
          className={`danmaku-item ${item.gift ? "gift" : ""}`}
          key={item.key}
          style={{ top: `${7 + item.lane * 10.5}%` }}
        >
          {item.text}
        </span>
      ))}
    </div>
  );
}

function hasRenderableText(message: ChatMessage) {
  return message.text.trim().length > 0;
}
