import { create } from "zustand";
import { persist } from "zustand/middleware";

// ponytail: 残高APIが無い(Docs/LIMITATIONS.md)ため端末内完結。サーバー残高のようには見せない。
// 補充・リセット手段は依頼により作らない。
const INITIAL_CREDITS = 3000;

interface CreditState {
  balance: number;
  spend: (cost: number) => void;
}

export const useCreditStore = create<CreditState>()(
  persist(
    (set) => ({
      balance: INITIAL_CREDITS,
      // 残高不足はUI側(ギフトカードのdisabledと送信ボタン)で止める。ここは最後の砦として0で止める。
      spend: (cost) => set((state) => ({ balance: Math.max(0, state.balance - cost) })),
    }),
    { name: "streamly-credits" },
  ),
);
