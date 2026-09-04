import { useEffect, useRef, useState } from "react";
import { useFreshMessages } from "../../store/comments";
import { GIFT_ANIMATION_DURATION_MS, GiftImage } from "../gifts/GiftImage";

// ponytail: /eventsは全チャンネル共通の1本で詰まることがある。同時表示は3件までにして
// あふれたら古い方から捨てる(最新のギフトは必ず見せる)。
const MAX_CONCURRENT = 3;

interface PlayingGift {
  key: string;
  iconUrl: string;
  animationUrl: string;
}

// ponytail: animationUrl を持つギフトだけ5秒再生する。animated WebPは無限ループなので、
// 止める手段はDOMから外すことだけ。SSEにuserIdが無いので自分の送信だけに絞ることはできない。
export function GiftOverlay() {
  const [playing, setPlaying] = useState<PlayingGift[]>([]);
  // ponytail: DanmakuLayerと同じ理由でバッチごとに独立したtimerを持つ。
  const timers = useRef(new Set<number>());

  useFreshMessages((fresh) => {
    const additions = fresh.flatMap((message) =>
      message.gift?.animationUrl
        ? [
            {
              key: `${message.key}-gift-overlay`,
              iconUrl: message.gift.iconUrl,
              animationUrl: message.gift.animationUrl,
            },
          ]
        : [],
    );
    if (additions.length === 0) return;

    setPlaying((current) => [...current, ...additions].slice(-MAX_CONCURRENT));

    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      const expired = new Set(additions.map((item) => item.key));
      setPlaying((current) => current.filter((item) => !expired.has(item.key)));
    }, GIFT_ANIMATION_DURATION_MS);
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

  if (playing.length === 0) return null;

  // 同じギフトはチャット側が aria-live で読み上げるので、ここは支援技術から隠す。
  return (
    <div className="gift-overlay" aria-hidden="true">
      {playing.map((item) => (
        <GiftImage
          key={item.key}
          className="gift-overlay-item"
          iconUrl={item.iconUrl}
          animationUrl={item.animationUrl}
          animate
        />
      ))}
    </div>
  );
}
