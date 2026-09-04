import { useEffect } from "react";
import { create } from "zustand";
import { fetchChannels } from "../lib/api/channels";
import type { Channel } from "../lib/api/contracts";

type ChannelStatus = "idle" | "loading" | "loaded" | "error";

interface ChannelState {
  channels: Channel[];
  status: ChannelStatus;
  load: () => void;
}

// ponytail: 初回だけ取得して以降はキャッシュ。同時マウントでも/channels.jsonへのリクエストは1回。
export const useChannelStore = create<ChannelState>((set, get) => ({
  channels: [],
  status: "idle",
  load: () => {
    if (get().status === "loading" || get().status === "loaded") return;
    set({ status: "loading" });
    fetchChannels()
      .then((channels) => set({ channels, status: "loaded" }))
      .catch(() => set({ status: "error" }));
  },
}));

export function useChannels() {
  const channels = useChannelStore((state) => state.channels);
  const status = useChannelStore((state) => state.status);
  const load = useChannelStore((state) => state.load);

  useEffect(() => {
    load();
  }, [load]);

  return { channels, status };
}
