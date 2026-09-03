import { create } from "zustand";
import { persist } from "zustand/middleware";

interface IdSetState {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
}

// ponytail: Follow/お気に入りはどちらも「idの集合をこの端末に保存するだけ」で形が同じなので、
// 1つのfactoryにまとめる(preferences.tsと同じZustand+persistパターン)。
// サーバー同期APIが無いことを前提にしており、サーバーと同期しているように見せない。
export function createIdSetStore(storageKey: string) {
  return create<IdSetState>()(
    persist(
      (set, get) => ({
        ids: [],
        has: (id) => get().ids.includes(id),
        toggle: (id) =>
          set((state) => ({
            ids: state.ids.includes(id)
              ? state.ids.filter((existing) => existing !== id)
              : [...state.ids, id],
          })),
      }),
      { name: storageKey },
    ),
  );
}
