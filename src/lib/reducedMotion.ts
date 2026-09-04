// ponytail: base.css の @media (prefers-reduced-motion) はCSSアニメーションしか止められない。
// ギフトは animated WebP =「画像の中身」なので、再生の可否はJS側で判断する。
export function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
