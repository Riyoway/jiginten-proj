import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GiftPicker } from "../../src/features/gifts/GiftPicker";
import type { Gift } from "../../src/lib/api/contracts";
import { useCreditStore } from "../../src/store/credits";

const CLAP_ICON = "https://example.test/icons/clap.webp?v=1";
const CLAP_ANIMATION = "https://example.test/animations/clap.webp?v=1";
const HEART_ICON = "https://example.test/icons/heart.webp?v=1";

// 「4グループ固定」を前提にしないことを確かめたいので、実APIとは違う2グループの並びにする。
const MOCK_GIFTS: Gift[] = [
  { id: "heart", name: "ハート", iconUrl: HEART_ICON, cost: 10, group: "気持ち", animationUrl: null },
  {
    id: "clap",
    name: "拍手",
    iconUrl: CLAP_ICON,
    cost: 1000,
    group: "気持ち",
    animationUrl: CLAP_ANIMATION,
  },
  {
    id: "flower",
    name: "お花",
    iconUrl: "https://example.test/icons/flower.webp?v=1",
    cost: 50,
    group: "自然",
    animationUrl: null,
  },
];

vi.mock("../../src/lib/api/gifts", () => ({
  getGifts: vi.fn(async () => MOCK_GIFTS),
}));

const onSelect = vi.fn();

beforeEach(() => {
  onSelect.mockClear();
  useCreditStore.setState({ balance: 3000 });
});

async function renderPicker() {
  render(<GiftPicker open selectedId={null} onSelect={onSelect} />);
  // カタログはlazy fetchなので、最初のカードが出るまで待つ
  await screen.findByRole("button", { name: /拍手/ });
}

function imageOf(card: HTMLElement) {
  // alt="" は role="presentation" になるので getByRole("img") では取れない
  return card.querySelector("img");
}

describe("GiftPicker", () => {
  it("shows each gift's cost from the API", async () => {
    await renderPicker();

    expect(within(screen.getByRole("button", { name: /拍手/ })).getByText("1,000")).toBeInTheDocument();
    expect(within(screen.getByRole("button", { name: /ハート/ })).getByText("10")).toBeInTheDocument();
  });

  it("shows the credit balance without an extra storage note", async () => {
    useCreditStore.setState({ balance: 1850 });
    await renderPicker();

    const balance = screen.getByText("残高 1,850");
    expect(balance).toBeInTheDocument();
    expect(balance).not.toHaveAttribute("title");
  });

  it("builds the group tabs from the API data instead of a hardcoded list", async () => {
    await renderPicker();

    // 「すべて」+ モックに存在する2グループ。実APIの4グループを決め打ちしていたらここで落ちる。
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["すべて", "気持ち", "自然"]);
  });

  it("disables gifts that cost more than the balance", async () => {
    useCreditStore.setState({ balance: 100 });
    await renderPicker();

    expect(screen.getByRole("button", { name: /拍手/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /ハート/ })).toBeEnabled();
  });

  it("animates a gift only while the pointer is over it", async () => {
    await renderPicker();
    const card = screen.getByRole("button", { name: /拍手/ });

    // 既定は静止アイコン
    expect(imageOf(card)).toHaveAttribute("src", CLAP_ICON);

    // React は pointerover/pointerout から enter/leave を合成するので pointerOver を使う
    fireEvent.pointerOver(card);
    expect(imageOf(card)).toHaveAttribute("src", CLAP_ANIMATION);

    fireEvent.pointerOut(card);
    expect(imageOf(card)).toHaveAttribute("src", CLAP_ICON);
  });

  it("animates on keyboard focus too", async () => {
    await renderPicker();
    const card = screen.getByRole("button", { name: /拍手/ });

    act(() => card.focus());
    expect(imageOf(card)).toHaveAttribute("src", CLAP_ANIMATION);

    act(() => card.blur());
    expect(imageOf(card)).toHaveAttribute("src", CLAP_ICON);
  });

  it("never animates a gift that has no animationUrl", async () => {
    await renderPicker();
    const card = screen.getByRole("button", { name: /ハート/ });

    fireEvent.pointerOver(card);
    expect(imageOf(card)).toHaveAttribute("src", HEART_ICON);
  });

  it("falls back to the static icon and stops retrying when the animation fails", async () => {
    await renderPicker();
    const card = screen.getByRole("button", { name: /拍手/ });

    fireEvent.pointerOver(card);
    const image = imageOf(card);
    if (!image) throw new Error("gift image not found");
    fireEvent.error(image);
    expect(imageOf(card)).toHaveAttribute("src", CLAP_ICON);

    // 2回目のホバーで再試行しない
    fireEvent.pointerOut(card);
    fireEvent.pointerOver(card);
    expect(imageOf(card)).toHaveAttribute("src", CLAP_ICON);
  });

  it("keeps selection working while hovering", async () => {
    await renderPicker();
    const card = screen.getByRole("button", { name: /拍手/ });

    expect(card).toHaveAttribute("aria-pressed", "false");
    fireEvent.pointerOver(card);
    expect(card).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "clap" }));
  });
});
