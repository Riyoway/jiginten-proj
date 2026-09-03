import { create } from "zustand";
import { persist } from "zustand/middleware";

// ponytail: 30件あれば「最近見たもの」としては足りる。上限を上げるならページングを一緒に考える。
const LIMIT = 30;

interface HistoryState {
  ids: string[];
  record: (id: string) => void;
  clear: () => void;
}

// ponytail: 視聴履歴APIが無いため端末内(localStorage)完結。follows/favoritesと違って順序が
// 意味を持つ(新しい順)ので、createIdSetStoreのtoggleではなく先頭へ寄せるrecordを持たせる。
export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      ids: [],
      record: (id) =>
        set((state) => ({
          ids: [id, ...state.ids.filter((existing) => existing !== id)].slice(0, LIMIT),
        })),
      clear: () => set({ ids: [] }),
    }),
    { name: "streamly-history" },
  ),
);
