import { useEffect, useRef } from "react";
import { create } from "zustand";
import type { ChatMessage, IncomingComment } from "../lib/api/contracts";

const MAX_COMMENTS = 300;

interface CommentState {
  messages: ChatMessage[];
  seenIds: Set<string>;
  push: (payload: IncomingComment) => void;
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
            cost: payload.item.cost,
            // アニメーション再生に必要。SSEがそのまま持ってくるので/itemsとの突き合わせは不要。
            animationUrl: payload.item.animationUrl ?? null,
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
}));

/**
 * マウント後に新しく届いたメッセージだけを callback に渡す。
 * マウント時点で store にあった分は「新着」にしない(/watch を出入りしても過去分が再生されない)。
 */
// ponytail: 判定は最後に見た key 基準。件数の差分だと上限300件に張り付いた時点で新着を検出できなくなる。
export function useFreshMessages(onFresh: (messages: ChatMessage[]) => void) {
  const messages = useCommentStore((state) => state.messages);
  const lastKey = useRef(messages.at(-1)?.key);
  const callback = useRef(onFresh);

  // messages の effect より先に宣言して、常に最新のcallbackが呼ばれるようにする。
  useEffect(() => {
    callback.current = onFresh;
  });

  useEffect(() => {
    const index = messages.findIndex((message) => message.key === lastKey.current);
    // 直前に見たメッセージが上限で押し出されていた場合(index === -1)は、全件を新着扱いせず何も出さない。
    const fresh = lastKey.current && index === -1 ? [] : messages.slice(index + 1);
    lastKey.current = messages.at(-1)?.key;
    if (fresh.length > 0) callback.current(fresh);
  }, [messages]);
}
