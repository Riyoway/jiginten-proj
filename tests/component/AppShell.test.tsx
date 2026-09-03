import { RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
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

  it("shows a real channel list in the sidebar once /channels.json loads", async () => {
    render(<RouterProvider router={router} />);

    for (const channel of MOCK_CHANNELS) {
      const link = await screen.findByRole("link", { name: channel.title });
      expect(link.getAttribute("href")).toContain(`channel=${channel.id}`);
    }
  });
});
