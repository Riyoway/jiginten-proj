import { hashToIndex } from "./hash";

// ponytail: 配信者アカウントAPIが無いため、chatの"Guest"と同じ考え方で
// 実在しない仮の表示名プールを用意する。id単位で決定的に選ぶので、
// 同じチャンネルはリロードしても同じ番号になる(かつ複数行が見分けられる)。
const STREAMLY_USER_POOL = Array.from({ length: 10 }, (_, index) => `Streamly User ${index + 1}`);

export function getStreamlyUserName(id: string): string {
  return STREAMLY_USER_POOL[hashToIndex(id, STREAMLY_USER_POOL.length)];
}
