import type { Gift } from "../../lib/api/contracts";
import { useGiftCatalog } from "./useGiftCatalog";

interface GiftPickerProps {
  open: boolean;
  selectedId: string | null;
  onSelect: (gift: Gift | null) => void;
}

export function GiftPicker({ open, selectedId, onSelect }: GiftPickerProps) {
  const { gifts, loaded, error } = useGiftCatalog(open);
  if (!open) return null;

  return (
    <div className="gift-picker" aria-label="ギフトを選ぶ">
      <div className="panel-heading compact">
        <div>
          <strong>ギフトを送る</strong>
        </div>
        {selectedId ? (
          <button type="button" className="text-button" onClick={() => onSelect(null)}>
            選択解除
          </button>
        ) : null}
      </div>
      {error ? <p className="inline-error">{error}</p> : null}
      {!loaded && !error ? <div className="gift-skeleton">ギフトを読み込み中…</div> : null}
      <div className="gift-grid">
        {gifts.map((gift) => (
          <button
            key={gift.id}
            className={`gift-option ${selectedId === gift.id ? "selected" : ""}`}
            type="button"
            aria-pressed={selectedId === gift.id}
            onClick={() => onSelect(selectedId === gift.id ? null : gift)}
          >
            <img src={gift.iconUrl} alt="" />
            <span>{gift.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
