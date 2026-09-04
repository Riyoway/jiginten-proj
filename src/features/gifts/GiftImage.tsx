import { Gift as GiftIcon } from "lucide-react";
import { useState } from "react";
import { prefersReducedMotion } from "../../lib/reducedMotion";

interface GiftImageProps {
  iconUrl: string;
  animationUrl?: string | null;
  /** true の間だけアニメーションWebPを描画する。false に戻すと静止アイコンに戻る。 */
  animate?: boolean;
  className?: string;
}

export const GIFT_ANIMATION_DURATION_MS = 5000;

// ponytail: animated WebP には play/pause が無く loop count 0 で回り続けるので、
// 再生/停止の唯一の手段が iconUrl ↔ animationUrl の src 差し替え。
// 読み込み失敗時は animation -> icon -> lucideアイコン の順に落とす(Docs/ITEMS-API.md の要求)。
// 4箇所(ピッカー/チャット/選択中チップ/プレイヤー)で同じ処理が要るのでここに集約する。
export function GiftImage({ iconUrl, animationUrl, animate = false, className }: GiftImageProps) {
  const [broken, setBroken] = useState<readonly string[]>([]);

  const wanted = animate && animationUrl && !prefersReducedMotion() ? animationUrl : iconUrl;
  const src = broken.includes(wanted) ? iconUrl : wanted;

  if (!src || broken.includes(src)) return <GiftIcon className={className} aria-hidden="true" />;

  return (
    <img
      className={className}
      src={src}
      alt=""
      decoding="async"
      onError={() => setBroken((current) => [...current, src])}
    />
  );
}
