const BANNER_POOL = ["/banners/banner1.png", "/banners/banner2.png"];

export function getRandomBanner(): string {
  return BANNER_POOL[Math.floor(Math.random() * BANNER_POOL.length)];
}
