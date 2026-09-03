// ponytail: 文字列を決定的に 0..mod-1 へ振り分ける小さなハッシュ。暗号強度は不要
// (同じidなら常に同じ値になればよい: サムネイル配色・仮の表示名の選択に使う)。
export function hashToIndex(value: string, mod: number): number {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) % mod;
  return hash;
}
