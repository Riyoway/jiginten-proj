import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatComposer } from "../../src/features/chat/ChatComposer";
import type { Gift } from "../../src/lib/api/contracts";
import { useCreditStore } from "../../src/store/credits";

const CLAP: Gift = {
  id: "clap",
  name: "拍手",
  iconUrl: "https://example.test/icons/clap.webp?v=1",
  cost: 1000,
  group: "気持ち",
  animationUrl: "https://example.test/animations/clap.webp?v=1",
};

const HEART: Gift = {
  id: "heart",
  name: "ハート",
  iconUrl: "https://example.test/icons/heart.webp?v=1",
  cost: 10,
  group: "気持ち",
  animationUrl: null,
};

const { sendMessage } = vi.hoisted(() => ({ sendMessage: vi.fn() }));
vi.mock("../../src/lib/api/messages", () => ({ sendMessage }));
vi.mock("../../src/lib/api/gifts", () => ({ getGifts: vi.fn(async () => [HEART, CLAP]) }));

beforeEach(() => {
  sendMessage.mockReset();
  sendMessage.mockResolvedValue(undefined);
  useCreditStore.setState({ balance: 3000 });
});

async function selectGift(name: RegExp) {
  fireEvent.click(screen.getByRole("button", { name: "ギフトを選ぶ" }));
  fireEvent.click(await screen.findByRole("button", { name }));
}

const balance = () => useCreditStore.getState().balance;

describe("ChatComposer credits", () => {
  it("subtracts the gift cost once the send is accepted", async () => {
    render(<ChatComposer />);
    await selectGift(/拍手/);

    fireEvent.click(screen.getByRole("button", { name: "送信" }));

    await waitFor(() => expect(balance()).toBe(2000));
    expect(sendMessage).toHaveBeenCalledWith({ itemId: "clap" });
  });

  it("does not subtract anything when the send fails, and keeps the selection", async () => {
    sendMessage.mockRejectedValue(new Error("network"));
    render(<ChatComposer />);
    await selectGift(/拍手/);

    fireEvent.click(screen.getByRole("button", { name: "送信" }));

    expect(await screen.findByText(/送信に失敗しました/)).toBeInTheDocument();
    expect(balance()).toBe(3000);
    // 選択したギフトは残る(既存の「入力内容は残す」挙動)
    expect(screen.getByRole("button", { name: /拍手/ })).toBeInTheDocument();
  });

  it("leaves the balance alone for a text-only comment", async () => {
    render(<ChatComposer />);

    fireEvent.change(screen.getByPlaceholderText("メッセージを入力..."), {
      target: { value: "こんにちは" },
    });
    fireEvent.click(screen.getByRole("button", { name: "送信" }));

    await waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ text: "こんにちは" }));
    expect(balance()).toBe(3000);
  });

  it("refuses to send a gift the balance cannot cover", async () => {
    useCreditStore.setState({ balance: 3000 });
    render(<ChatComposer />);
    await selectGift(/拍手/);

    // 選択後に残高が下がっても送れない
    useCreditStore.setState({ balance: 100 });

    const send = await screen.findByRole("button", { name: "送信" });
    expect(send).toBeDisabled();
    fireEvent.click(send);

    expect(sendMessage).not.toHaveBeenCalled();
    expect(balance()).toBe(100);
    expect(screen.getByText(/クレジットが足りません/)).toBeInTheDocument();
  });
});
