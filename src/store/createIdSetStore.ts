import { create } from "zustand";
import { persist } from "zustand/middleware";

interface IdSetState {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
}

// ponytail: Follow/お気に入りはどちらも「idの集合を端末に保存するだけ」で形が同じなのでまとめる。
// 同期APIは無い前提。サーバーと同期しているように見せない。
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
