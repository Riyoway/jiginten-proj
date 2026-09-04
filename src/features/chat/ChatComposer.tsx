import { Gift as GiftIcon, Send } from "lucide-react";
import { type FormEvent, useLayoutEffect, useRef, useState } from "react";
import type { Gift } from "../../lib/api/contracts";
import { sendMessage } from "../../lib/api/messages";
import { useCreditStore } from "../../store/credits";
import { GiftImage } from "../gifts/GiftImage";
import { GiftPicker } from "../gifts/GiftPicker";

const MAX_COMMENT_LENGTH = 200;
const MAX_TEXTAREA_HEIGHT = 112;

export function ChatComposer() {
  const [text, setText] = useState("");
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const balance = useCreditStore((state) => state.balance);
  const spend = useCreditStore((state) => state.spend);

  // ギフトピッカー側でも買えないカードは選べないが、選択後に残高が変わる可能性もあるのでここでも見る。
  const unaffordable = selectedGift ? selectedGift.cost > balance : false;

  // biome-ignore lint/correctness/useExhaustiveDependencies: テキスト変更のたびに高さを測り直す必要がある。
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [text]);

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
      // ponytail: 減算はPOSTが2xxを返した時点。SSEのechoを待つと取りこぼし時に引き忘れる。
      if (selectedGift) spend(selectedGift.cost);
      setText("");
      setSelectedGift(null);
      setGiftOpen(false);
    } catch {
      setError("送信に失敗しました。");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="composer-wrap">
      {selectedGift ? (
        <div className="selected-gift">
          <GiftImage
            className="selected-gift-image"
            iconUrl={selectedGift.iconUrl}
            animationUrl={selectedGift.animationUrl}
          />
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
          ref={textareaRef}
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
      <GiftPicker open={giftOpen} selectedId={selectedGift?.id ?? null} onSelect={setSelectedGift} />
      <div className="composer-footer">
        <span>
          {text.length}/{MAX_COMMENT_LENGTH}
        </span>
        {error ? <span className="inline-error">{error}</span> : null}
      </div>
    </div>
  );
}
