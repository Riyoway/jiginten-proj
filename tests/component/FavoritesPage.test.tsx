import { RouterProvider } from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { router } from "../../src/app/router";
import type { Channel } from "../../src/lib/api/contracts";
import { useChannelStore } from "../../src/store/channels";
import { useFavoriteStore } from "../../src/store/favorites";

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
  useFavoriteStore.setState({ ids: [] });
  window.history.pushState({}, "", "/favorites");
});

describe("FavoritesPage", () => {
  it("explains how to add favorites while none are saved", async () => {
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("heading", { name: "お気に入り" })).toBeInTheDocument();
    expect(
      screen.getByText("配信画面の「お気に入り」を押すと、ここにまとまります(この端末のみ)。"),
    ).toBeInTheDocument();
  });

  it("lists favorited channels that are currently live", async () => {
    useFavoriteStore.setState({ ids: ["llama-drama"] });
    render(<RouterProvider router={router} />);

    const page = (await screen.findByRole("heading", { name: "お気に入り" })).closest(".favorites-page");
    if (!page) throw new Error("favorites page not found");

    expect(within(page).getByText("Caminandes 1: Llama Drama")).toBeInTheDocument();
    // お気に入りに入れていないチャンネルは出さない
    expect(within(page).queryByText("Caminandes 3: Llamigos")).not.toBeInTheDocument();
  });

  it("reports offline favorites as a count instead of inventing channel names", async () => {
    useFavoriteStore.setState({ ids: ["llama-drama", "gone-offline"] });
    render(<RouterProvider router={router} />);

    expect(await screen.findByText("他1件のお気に入りは現在配信していません。")).toBeInTheDocument();
    expect(screen.queryByText("gone-offline")).not.toBeInTheDocument();
  });

  it("says nothing is live when every favorite is offline", async () => {
    useFavoriteStore.setState({ ids: ["gone-offline"] });
    render(<RouterProvider router={router} />);

    expect(await screen.findByText("お気に入りのチャンネルは現在配信していません。")).toBeInTheDocument();
  });
});
