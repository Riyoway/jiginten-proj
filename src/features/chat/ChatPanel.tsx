import { useEffect, useRef } from "react";
import { useCommentStore } from "../../store/comments";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageView } from "./ChatMessageView";
import { useCommentStream } from "./useCommentStream";

export function ChatPanel() {
  const messages = useCommentStore((state) => state.messages);
  const { connected } = useCommentStream();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  return (
    <aside className="chat-panel" aria-label="ライブチャット">
      <div className="chat-header">
        <div>
          <h2>チャット</h2>
        </div>
        <span className={`connection-pill ${connected ? "online" : "reconnecting"}`}>
          {connected ? "接続中" : "再接続中"}
        </span>
      </div>

      <div className="chat-list" ref={listRef} aria-live="polite">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <img src="/avatars/avatar1.png" alt="" />
            <strong>コメントを待っています</strong>
            <span>コメントが届くとここに表示されます。</span>
          </div>
        ) : (
          messages.map((message) => <ChatMessageView key={message.key} message={message} />)
        )}
      </div>

      <ChatComposer />
    </aside>
  );
}
