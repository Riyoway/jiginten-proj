import { createIdSetStore } from "./createIdSetStore";

// ponytail: お気に入りAPIが無いため端末内(localStorage)完結。サーバー同期のように見せない。
export const useFavoriteStore = createIdSetStore("streamly-favorites");
