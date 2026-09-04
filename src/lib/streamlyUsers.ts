// ponytail: 配信者アカウントAPIが無いため、chatの"Guest"と同じ考え方で実在しない仮の表示名を出す。
// 一覧全体を基準に採番するので名前が衝突しない。ソート済みなので同じ一覧なら常に同じ番号。
// 呼び出し側は必ずチャンネル一覧の全idを渡すこと(部分リストだと画面ごとに番号が食い違う)。
export function getStreamlyUserName(id: string, channelIds: readonly string[]): string {
  const index = [...channelIds].sort().indexOf(id);
  // 一覧に無いid(取得前など)は番号を作れないので、番号なしの汎用ラベルに落とす。
  return index >= 0 ? `Streamly User ${index + 1}` : "Streamly User";
}
