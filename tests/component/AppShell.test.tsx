import { RouterProvider } from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { router } from "../../src/app/router";
import type { Channel } from "../../src/lib/api/contracts";
import { getStreamlyUserName } from "../../src/lib/streamlyUsers";
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
    // sidebarの表示名はid単位で決定的な "Streamly User N" にする(実データを人物名っぽく見せない)。
    for (const channel of MOCK_CHANNELS) {
      const link = within(sidebar).getByRole("link", { name: getStreamlyUserName(channel.id) });
      expect(link.getAttribute("href")).toContain(`channel=${channel.id}`);
    }

    expect(within(sidebar).queryByText(MOCK_CHANNELS[0].title)).not.toBeInTheDocument();
  });
});
