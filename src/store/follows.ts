import { createIdSetStore } from "./createIdSetStore";

// ponytail: フォローAPIが無いため端末内(localStorage)完結。サーバー同期のように見せない。
export const useFollowStore = createIdSetStore("streamly-follows");
