// ponytail: styles/base.css の @media (prefers-reduced-motion) は CSS アニメーションしか止められない。
// ギフトのアニメーションは animated WebP =「画像の中身」なので、再生するかどうかはJS側で判断する。
// matchMedia が無い環境のガードは lib/pwaInstall.ts と同じ扱い(判断できない = 通常表示)。
export function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
