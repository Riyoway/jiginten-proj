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
  // ponytail: seed with whatever's already in the (session-persistent)
  // comment store at mount — otherwise re-mounting this layer (e.g.
  // navigating away from /watch and back) treats the whole pre-existing
  // backlog as "fresh" and dumps it all the instant danmaku is on again.
  const previousCount = useRef(messages.length);
  const nextLane = useRef(0);
  // ponytail: every batch needs its own independent timer — a shared
  // per-effect timer gets clearTimeout'd by the next message's cleanup
  // before it can fire, so old items never expire and dump all at once
  // the moment danmaku is turned back on.
  const timers = useRef(new Set<number>());

  useEffect(() => {
    if (messages.length <= previousCount.current) {
      previousCount.current = messages.length;
      return;
    }

    const fresh = messages.slice(previousCount.current).filter(hasRenderableText);
    previousCount.current = messages.length;
    // while off, don't queue anything to replay later — only ever show
    // comments that arrive while danmaku is actually on.
    if (!enabled || !fresh.length) return;

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
      timers.current.delete(timer);
      const expired = new Set(additions.map((item) => item.key));
      setActive((current) => current.filter((item) => !expired.has(item.key)));
    }, 9000);
    timers.current.add(timer);
  }, [messages, enabled]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((id) => {
        window.clearTimeout(id);
      });
      pending.clear();
    };
  }, []);

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
