import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferenceState {
  muted: boolean;
  volume: number;
  danmakuEnabled: boolean;
  danmakuOpacity: number;
  chatVisible: boolean;
  setMuted: (value: boolean) => void;
  setVolume: (value: number) => void;
  setDanmakuEnabled: (value: boolean) => void;
  setDanmakuOpacity: (value: number) => void;
  setChatVisible: (value: boolean) => void;
}

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      muted: true,
      volume: 0.8,
      danmakuEnabled: true,
      danmakuOpacity: 0.92,
      chatVisible: true,
      setMuted: (muted) => set({ muted }),
      setVolume: (volume) => set({ volume }),
      setDanmakuEnabled: (danmakuEnabled) => set({ danmakuEnabled }),
      setDanmakuOpacity: (danmakuOpacity) => set({ danmakuOpacity }),
      setChatVisible: (chatVisible) => set({ chatVisible }),
    }),
    // ponytail: partializeは不要。JSON.stringifyがsetterを落とすので保存されるのは値だけ。
    { name: "streamly-preferences" },
  ),
);
