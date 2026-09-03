import { create } from "zustand";
import type { ChatMessage, IncomingComment } from "../lib/api/contracts";

const MAX_COMMENTS = 300;

interface CommentState {
  messages: ChatMessage[];
  seenIds: Set<string>;
  push: (payload: IncomingComment) => void;
  clear: () => void;
}

export const useCommentStore = create<CommentState>((set, get) => ({
  messages: [],
  seenIds: new Set<string>(),
  push: (payload) => {
    const seen = get().seenIds;
    if (payload.id && seen.has(payload.id)) return;

    const nextSeen = new Set(seen);
    if (payload.id) nextSeen.add(payload.id);

    const message: ChatMessage = {
      key: payload.id ?? crypto.randomUUID(),
      id: payload.id,
      text: payload.text ?? "",
      receivedAt: Date.now(),
      gift: payload.item?.name
        ? {
            id: payload.item.id,
            name: payload.item.name,
            iconUrl: payload.item.iconUrl ?? "",
          }
        : undefined,
    };

    const nextMessages = [...get().messages, message];
    while (nextMessages.length > MAX_COMMENTS) {
      const removed = nextMessages.shift();
      if (removed?.id) nextSeen.delete(removed.id);
    }

    set({ messages: nextMessages, seenIds: nextSeen });
  },
  clear: () => set({ messages: [], seenIds: new Set<string>() }),
}));
