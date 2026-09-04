// ponytail: 配信者アカウントAPIが無いため、chatの"Guest"と同じ考え方で実在しない仮の表示名を出す。
// 以前は10個の固定プールからidのハッシュで選んでいたが、チャンネル数がプールを超えると
// 別チャンネルに同じ名前が付いてしまう(/channels.jsonが13件になって実際に重複した)。
// チャンネル一覧全体を基準に一意な番号を振ることで、同じ名前が2チャンネルに出ないようにする。
// idでソートしているので、同じ一覧なら何度描画しても同じ番号になる。
export function getStreamlyUserName(id: string, channelIds: readonly string[]): string {
  const index = [...channelIds].sort().indexOf(id);
  // 一覧に無いid(取得前など)は番号を作れないので、番号なしの汎用ラベルに落とす。
  return index >= 0 ? `Streamly User ${index + 1}` : "Streamly User";
}
