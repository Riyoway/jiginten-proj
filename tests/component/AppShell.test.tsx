import { RouterProvider } from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { router } from "../../src/app/router";
import type { Channel } from "../../src/lib/api/contracts";
import { useChannelStore } from "../../src/store/channels";

// ponytail: /channels.jsonへの実ネットワークアクセスをテストで発生させないため、
// storeへ直接シードしてload()を早期returnさせる(Docs/DEVELOPMENT.mdの方針通り)。
const MOCK_CHANNELS: Channel[] = [
  { id: "llamigos", title: "Caminandes 3: Llamigos", playlist: "/ch/llamigos/stream.m3u8", default: true },
  {
    id: "llama-drama",
    title: "Caminandes 1: Llama Drama",
    playlist: "/ch/llama-drama/stream.m3u8",
    default: false,
  },
];

beforeEach(() => {
  useChannelStore.setState({ channels: MOCK_CHANNELS, status: "loaded" });
});

describe("AppShell", () => {
  it("renders real navigation and disables nav items with no backing API", async () => {
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("link", { name: /^ホーム$/ })).toHaveAttribute("href", "/");
    expect(await screen.findByRole("link", { name: /^ライブ$/ })).toHaveAttribute("href", "/watch");

    for (const label of ["フォロー中", "人気", "お気に入り", "履歴"]) {
      expect(screen.getByRole("button", { name: label })).toBeDisabled();
    }
  });

  it("keeps search disabled and shows no fabricated notification count", async () => {
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("textbox", { name: "配信を検索" })).toBeDisabled();

    // 通知ベルに偽の件数バッジを出さない(実装していないため)
    expect(screen.queryByText(/^[0-9]+$/)).not.toBeInTheDocument();
  });

  it("links to every real channel without displaying content titles as a streamer identity", async () => {
    render(<RouterProvider router={router} />);

    const sidebar = (await screen.findByRole("link", { name: /^ホーム$/ })).closest("aside");
    if (!sidebar) throw new Error("sidebar not found");

    // channel.titleはコンテンツ名(配信者名ではない)なので、chatのGuestと同じく
    // sidebarの表示名は固定の "Streamly User" にする(実データを人物名っぽく見せない)。
    const links = within(sidebar).getAllByRole("link", { name: "Streamly User" });
    expect(links).toHaveLength(MOCK_CHANNELS.length);

    const hrefs = links.map((link) => link.getAttribute("href"));
    for (const channel of MOCK_CHANNELS) {
      expect(hrefs.some((href) => href?.includes(`channel=${channel.id}`))).toBe(true);
    }

    expect(within(sidebar).queryByText(MOCK_CHANNELS[0].title)).not.toBeInTheDocument();
  });
});
