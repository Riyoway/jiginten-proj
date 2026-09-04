// ponytail: 先頭 count 個だけ Fisher-Yates で回して取り出す。
// sort(() => Math.random() - 0.5) は実装依存で偏るので使わない。
export function pickRandom<T>(items: readonly T[], count: number): T[] {
  const pool = [...items];
  const take = Math.min(count, pool.length);
  for (let index = 0; index < take; index += 1) {
    const swap = index + Math.floor(Math.random() * (pool.length - index));
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }
  return pool.slice(0, take);
}
