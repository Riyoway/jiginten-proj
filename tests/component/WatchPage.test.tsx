import { RouterProvider } from "@tanstack/react-router";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { router } from "../../src/app/router";
import type { Channel } from "../../src/lib/api/contracts";
import { getStreamlyUserName } from "../../src/lib/streamlyUsers";
import { useChannelStore } from "../../src/store/channels";
import { useFavoriteStore } from "../../src/store/favorites";
import { useFollowStore } from "../../src/store/follows";

const MOCK_CHANNELS: Channel[] = [
  { id: "llamigos", title: "Caminandes 3: Llamigos", playlist: "/ch/llamigos/stream.m3u8", default: true },
];

beforeEach(() => {
  useChannelStore.setState({ channels: MOCK_CHANNELS, status: "loaded" });
  useFollowStore.setState({ ids: [] });
  useFavoriteStore.setState({ ids: [] });
  window.history.pushState({}, "", "/watch");
});

describe("WatchPage", () => {
  it("shows the content title and channel identity as separate elements, with no English eyebrow", async () => {
    render(<RouterProvider router={router} />);

    // h1 = コンテンツタイトル(実データ)、チャンネル名は別要素(Streamly User N)
    const heading = await screen.findByRole("heading", { name: "Caminandes 3: Llamigos" });
    expect(heading).toBeInTheDocument();

    // sidebarにも同じ仮名が出るため(同じチャンネルなので)、h1と同じ.stream-copyに絞り込む
    const streamCopy = heading.closest(".stream-copy");
    if (!streamCopy) throw new Error("stream-copy not found");
    const channelIds = MOCK_CHANNELS.map((channel) => channel.id);
    expect(within(streamCopy).getByText(getStreamlyUserName("llamigos", channelIds))).toBeInTheDocument();

    expect(screen.queryByText("LIVE STREAM")).not.toBeInTheDocument();
  });

  it("toggles follow and favorite as local-only state (not a fake server sync)", async () => {
    render(<RouterProvider router={router} />);

    // sidebarの無効化された「フォロー中」nav項目と名前が被るため、aria-pressedで絞り込む
    // (nav項目はaria-pressedを持たない=このフォローボタンだけがpressed:falseに一致する)。
    const followButton = await screen.findByRole("button", { name: /フォロー/, pressed: false });
    fireEvent.click(followButton);
    expect(followButton).toHaveAttribute("aria-pressed", "true");
    expect(useFollowStore.getState().has("llamigos")).toBe(true);

    // sidebarの無効化された「お気に入り」nav項目と名前が被るため、同様にpressedで絞り込む
    const favoriteButton = screen.getByRole("button", { name: /お気に入り/, pressed: false });
    fireEvent.click(favoriteButton);
    expect(favoriteButton).toHaveAttribute("aria-pressed", "true");
    expect(useFavoriteStore.getState().has("llamigos")).toBe(true);
  });
});
