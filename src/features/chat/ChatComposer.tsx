import { Gift as GiftIcon, Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import type { Gift } from "../../lib/api/contracts";
import { sendMessage } from "../../lib/api/messages";
import { useCreditStore } from "../../store/credits";
import { GiftPicker } from "../gifts/GiftPicker";

const MAX_COMMENT_LENGTH = 200;

export function ChatComposer() {
  const [text, setText] = useState("");
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const balance = useCreditStore((state) => state.balance);
  const spend = useCreditStore((state) => state.spend);

  // ギフトピッカー側でも買えないカードは選べないが、選択後に残高が変わる可能性もあるのでここでも見る。
  const unaffordable = selectedGift ? selectedGift.cost > balance : false;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanText = text.trim();
    if (sending || (!cleanText && !selectedGift) || cleanText.length > MAX_COMMENT_LENGTH) return;
    if (unaffordable) return;

    setSending(true);
    setError(null);
    try {
      await sendMessage({
        ...(cleanText ? { text: cleanText } : {}),
        ...(selectedGift ? { itemId: selectedGift.id } : {}),
      });
      // ponytail: 減算はPOSTが2xxを返した時点。/eventsは全視聴者共通の1本でuserIdが無く、
      // POSTのレスポンスも読めないため「SSEに流れてきたどれが自分のギフトか」は判定できない。
      // サーバーが受理したことをクライアントから観測できる唯一の瞬間がここ。
      // (チャットへの表示は従来どおりSSE任せで、ローカル追加はしない。)
      if (selectedGift) spend(selectedGift.cost);
      setText("");
      setSelectedGift(null);
      setGiftOpen(false);
    } catch {
      setError("送信に失敗しました。入力内容は残しています。");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="composer-wrap">
      <GiftPicker open={giftOpen} selectedId={selectedGift?.id ?? null} onSelect={setSelectedGift} />
      {selectedGift ? (
        <div className="selected-gift">
          <img src={selectedGift.iconUrl} alt="" />
          <span>{selectedGift.name}</span>
          <small>
            {unaffordable
              ? `クレジットが足りません(${selectedGift.cost.toLocaleString()})`
              : `${selectedGift.cost.toLocaleString()} クレジット・メッセージと一緒に送信できます`}
          </small>
        </div>
      ) : null}
      <form className="chat-composer" onSubmit={submit}>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="メッセージを入力..."
          maxLength={MAX_COMMENT_LENGTH}
          rows={1}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button
          className={`gift-trigger ${giftOpen ? "active" : ""}`}
          type="button"
          aria-label="ギフトを選ぶ"
          aria-expanded={giftOpen}
          onClick={() => setGiftOpen((open) => !open)}
        >
          <GiftIcon size={19} />
        </button>
        <button
          className="send-button"
          type="submit"
          disabled={sending || unaffordable || (!text.trim() && !selectedGift)}
          aria-label="送信"
        >
          <Send size={18} />
        </button>
      </form>
      <div className="composer-footer">
        <span>
          {text.length}/{MAX_COMMENT_LENGTH}
        </span>
        {error ? <span className="inline-error">{error}</span> : null}
      </div>
    </div>
  );
}
