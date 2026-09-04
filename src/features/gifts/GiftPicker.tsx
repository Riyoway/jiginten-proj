import { Tabs } from "@heroui/react";
import { useMemo, useState } from "react";
import type { Gift } from "../../lib/api/contracts";
import { useCreditStore } from "../../store/credits";
import { GiftImage } from "./GiftImage";
import { useGiftCatalog } from "./useGiftCatalog";

interface GiftPickerProps {
  open: boolean;
  selectedId: string | null;
  onSelect: (gift: Gift | null) => void;
}

const ALL_TAB = "all";

// ponytail: 残高は端末内(store/credits.ts)。ヘッダーのギフトボタンはモバイルで非表示になるので、
// 実際に消費するこの画面にも出しておく。「端末内」だけだとサーバーに本物の残高がある前提に
// 読めてしまうので、そうでないことまで書く。
const CREDIT_HINT = "この端末だけに保存されます(サーバーの残高ではありません)";

export function GiftPicker({ open, selectedId, onSelect }: GiftPickerProps) {
  const { gifts, loaded, error } = useGiftCatalog(open);
  const balance = useCreditStore((state) => state.balance);

  // グループはAPIの値から作る。4種類だと決め打ちしない(Docs/ITEMS-API.md)。
  // 並びは/itemsのレスポンス順をそのまま使う。
  const groups = useMemo(() => {
    const ordered: string[] = [];
    for (const gift of gifts) {
      if (gift.group && !ordered.includes(gift.group)) ordered.push(gift.group);
    }
    return ordered;
  }, [gifts]);

  if (!open) return null;

  return (
    <section className="gift-picker" aria-label="ギフトを選ぶ">
      <div className="panel-heading compact">
        <div>
          <strong>ギフトを送る</strong>
        </div>
        <div className="gift-heading-actions">
          <span className="gift-balance" title={CREDIT_HINT}>
            残高 {balance.toLocaleString()}
          </span>
          {selectedId ? (
            <button type="button" className="text-button" onClick={() => onSelect(null)}>
              選択解除
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="inline-error">{error}</p> : null}
      {!loaded && !error ? <div className="gift-skeleton">ギフトを読み込み中…</div> : null}

      {groups.length > 0 ? (
        <Tabs className="gift-tabs" defaultSelectedKey={ALL_TAB}>
          <Tabs.List className="gift-tab-list" aria-label="ギフトのグループ">
            <Tabs.Tab id={ALL_TAB}>すべて</Tabs.Tab>
            {groups.map((group) => (
              <Tabs.Tab key={group} id={group}>
                {group}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          <Tabs.Panel id={ALL_TAB}>
            <GiftGrid gifts={gifts} selectedId={selectedId} balance={balance} onSelect={onSelect} />
          </Tabs.Panel>
          {groups.map((group) => (
            <Tabs.Panel key={group} id={group}>
              <GiftGrid
                gifts={gifts.filter((gift) => gift.group === group)}
                selectedId={selectedId}
                balance={balance}
                onSelect={onSelect}
              />
            </Tabs.Panel>
          ))}
        </Tabs>
      ) : (
        <GiftGrid gifts={gifts} selectedId={selectedId} balance={balance} onSelect={onSelect} />
      )}
    </section>
  );
}

function GiftGrid({
  gifts,
  selectedId,
  balance,
  onSelect,
}: {
  gifts: Gift[];
  selectedId: string | null;
  balance: number;
  onSelect: (gift: Gift | null) => void;
}) {
  return (
    <div className="gift-grid">
      {gifts.map((gift) => (
        <GiftOption
          key={gift.id}
          gift={gift}
          selected={selectedId === gift.id}
          affordable={gift.cost <= balance}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function GiftOption({
  gift,
  selected,
  affordable,
  onSelect,
}: {
  gift: Gift;
  selected: boolean;
  affordable: boolean;
  onSelect: (gift: Gift | null) => void;
}) {
  // ponytail: 既定は静止アイコン。ホバー(とキーボードフォーカス)の間だけアニメーションさせる。
  // affordable も見るのは、ホバー中に残高が変わってdisabledになった場合に
  // pointerleaveが飛ばず回りっぱなしになるのを防ぐため。
  const [active, setActive] = useState(false);

  return (
    <button
      className={`gift-option ${selected ? "selected" : ""}`}
      type="button"
      aria-pressed={selected}
      disabled={!affordable}
      title={affordable ? gift.name : `${gift.name} — クレジットが足りません`}
      onClick={() => onSelect(selected ? null : gift)}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      <GiftImage
        className="gift-option-image"
        iconUrl={gift.iconUrl}
        animationUrl={gift.animationUrl}
        animate={active && affordable}
      />
      <span className="gift-option-name">{gift.name}</span>
      <span className="gift-option-cost">{gift.cost.toLocaleString()}</span>
    </button>
  );
}
