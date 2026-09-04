import { useEffect, useRef, useState } from "react";
import { useFreshMessages } from "../../store/comments";
import { usePreferenceStore } from "../../store/preferences";

interface ActiveDanmaku {
  key: string;
  text: string;
  lane: number;
  gift: boolean;
}

const LANE_COUNT = 7;

export function DanmakuLayer() {
  const enabled = usePreferenceStore((state) => state.danmakuEnabled);
  const opacity = usePreferenceStore((state) => state.danmakuOpacity);
  const [active, setActive] = useState<ActiveDanmaku[]>([]);
  const nextLane = useRef(0);
  // ponytail: バッチごとに独立したtimer。共有timerだと次の到着のcleanupに消されて期限切れにならない。
  const timers = useRef(new Set<number>());

  // 新着判定は useFreshMessages に任せる(マウント時点のバックログは再生しない)。
  useFreshMessages((incoming) => {
    const fresh = incoming.filter((message) => message.text.trim().length > 0);
    // ponytail: OFFの間は溜めない。ONの間に届いたものだけを流す。
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
  });

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
