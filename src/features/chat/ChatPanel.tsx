import { Heart } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCommentStore } from "../../store/comments";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageView } from "./ChatMessageView";
import { useCommentStream } from "./useCommentStream";

type ChatFilter = "all" | "message" | "gift";

interface ChatPanelProps {
  followNotice?: string | null;
}

const FILTERS: { id: ChatFilter; label: string }[] = [
  { id: "all", label: "すべて" },
  { id: "message", label: "メッセージ" },
  { id: "gift", label: "ギフト" },
];

export function ChatPanel({ followNotice = null }: ChatPanelProps) {
  const messages = useCommentStore((state) => state.messages);
  const { connected } = useCommentStream();
  const listRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<ChatFilter>("all");
  const filteredMessages = useMemo(
    () =>
      messages.filter((message) =>
        filter === "all" ? true : filter === "gift" ? Boolean(message.gift) : !message.gift,
      ),
    [filter, messages],
  );
  const showFollowNotice = Boolean(followNotice) && filter !== "gift";

  useEffect(() => {
    const list = listRef.current;
    // 新着(件数の増加)が下までスクロールするトリガー。空のときは動かす必要がない。
    if (!list || (filteredMessages.length === 0 && !showFollowNotice)) return;
    list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [filteredMessages, showFollowNotice]);

  return (
    <aside className="chat-panel" aria-label="ライブチャット">
      <div className="chat-header">
        <div className="chat-tabs" role="tablist" aria-label="チャット表示">
          <button className="chat-tab active" type="button" role="tab" aria-selected="true">
            チャット
          </button>
          <button className="chat-tab" type="button" role="tab" disabled aria-selected="false">
            ギフトランキング
          </button>
          <button className="chat-tab" type="button" role="tab" disabled aria-selected="false">
            ユーザー
          </button>
        </div>
        <span className={`connection-pill ${connected ? "online" : "reconnecting"}`}>
          {connected ? "接続中" : "再接続中"}
        </span>
      </div>

      <fieldset className="chat-filters">
        <legend>メッセージの種類</legend>
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            className={`chat-filter ${filter === id ? "active" : ""}`}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </fieldset>

      <div className="chat-list" ref={listRef} aria-live="polite">
        {filteredMessages.length === 0 && !showFollowNotice ? (
          <div className="chat-empty">
            <img src="/avatars/avatar1.png" alt="" />
            <strong>{filter === "all" ? "コメントを待っています" : "該当するメッセージはありません"}</strong>
            <span>
              {filter === "all" ? "コメントが届くとここに表示されます。" : "別のフィルターを選べます。"}
            </span>
          </div>
        ) : (
          <>
            {filteredMessages.map((message) => (
              <ChatMessageView key={message.key} message={message} />
            ))}
            {showFollowNotice ? (
              <div className="chat-follow-notice" role="status">
                <Heart size={14} fill="currentColor" aria-hidden="true" />
                <span>{followNotice}</span>
              </div>
            ) : null}
          </>
        )}
      </div>

      <ChatComposer />
    </aside>
  );
}
