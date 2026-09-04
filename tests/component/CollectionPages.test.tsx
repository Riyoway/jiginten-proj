import { RouterProvider } from "@tanstack/react-router";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { router } from "../../src/app/router";
import type { Channel } from "../../src/lib/api/contracts";
import { useChannelStore } from "../../src/store/channels";
import { useFavoriteStore } from "../../src/store/favorites";
import { useFollowStore } from "../../src/store/follows";
import { useHistoryStore } from "../../src/store/history";

const MOCK_CHANNELS: Channel[] = [
  {
    id: "llamigos",
    title: "Caminandes 3: Llamigos",
    category: "コメディ",
    playlist: "/ch/llamigos/stream.m3u8",
    default: true,
  },
  {
    id: "llama-drama",
    title: "Caminandes 1: Llama Drama",
    category: "ドラマ",
    playlist: "/ch/llama-drama/stream.m3u8",
    default: false,
  },
];

// ponytail: routerはモジュールスコープの単一インスタンスなので、renderの前にhistoryを
// 書き換えても2画面目以降に反映されない。mount後にnavigateして目的の画面を出す。
async function renderPage(path: "/favorites" | "/follows" | "/history", title: string) {
  render(<RouterProvider router={router} />);
  await act(() => router.navigate({ to: path }));

  const page = (await screen.findByRole("heading", { name: title })).closest(".collection-page");
  if (!page) throw new Error(`${title} page not found`);
  return page as HTMLElement;
}

beforeEach(() => {
  useChannelStore.setState({ channels: MOCK_CHANNELS, status: "loaded" });
  useFavoriteStore.setState({ ids: [] });
  useFollowStore.setState({ ids: [] });
  useHistoryStore.setState({ ids: [] });
  router.history.push("/");
});

describe("FavoritesPage", () => {
  it("explains how to add favorites while none are saved", async () => {
    const page = await renderPage("/favorites", "お気に入り");

    expect(
      within(page).getByText("配信画面の「お気に入り」を押すと、ここにまとまります。"),
    ).toBeInTheDocument();
  });

  it("lists favorited channels that are currently live", async () => {
    useFavoriteStore.setState({ ids: ["llama-drama"] });

    const page = await renderPage("/favorites", "お気に入り");
    expect(within(page).getByText("Caminandes 1: Llama Drama")).toBeInTheDocument();
    // お気に入りに入れていないチャンネルは出さない
    expect(within(page).queryByText("Caminandes 3: Llamigos")).not.toBeInTheDocument();
  });

  it("reports offline favorites as a count instead of inventing channel names", async () => {
    useFavoriteStore.setState({ ids: ["llama-drama", "gone-offline"] });

    const page = await renderPage("/favorites", "お気に入り");
    expect(within(page).getByText("他1件のお気に入りは現在配信していません。")).toBeInTheDocument();
    expect(within(page).queryByText("gone-offline")).not.toBeInTheDocument();
  });

  it("says nothing is live when every favorite is offline", async () => {
    useFavoriteStore.setState({ ids: ["gone-offline"] });

    const page = await renderPage("/favorites", "お気に入り");
    expect(within(page).getByText("お気に入りのチャンネルは現在配信していません。")).toBeInTheDocument();
  });
});

describe("FollowsPage", () => {
  it("explains how to follow while nothing is saved", async () => {
    const page = await renderPage("/follows", "フォロー中");

    expect(
      within(page).getByText("配信画面の「フォロー」を押すと、ここにまとまります。"),
    ).toBeInTheDocument();
  });

  it("lists followed channels that are currently live and counts the offline ones", async () => {
    useFollowStore.setState({ ids: ["llama-drama", "gone-offline"] });

    const page = await renderPage("/follows", "フォロー中");
    expect(within(page).getByText("Caminandes 1: Llama Drama")).toBeInTheDocument();
    expect(within(page).queryByText("Caminandes 3: Llamigos")).not.toBeInTheDocument();
    expect(within(page).getByText("他1件のフォロー中チャンネルは現在配信していません。")).toBeInTheDocument();
    expect(within(page).queryByText("gone-offline")).not.toBeInTheDocument();
  });
});

describe("HistoryPage", () => {
  it("shows no clear button while the history is empty", async () => {
    const page = await renderPage("/history", "履歴");

    expect(within(page).getByText("配信を視聴すると、ここに履歴が残ります。")).toBeInTheDocument();
    expect(within(page).queryByRole("button", { name: "履歴を削除" })).not.toBeInTheDocument();
  });

  it("lists watched channels newest first", async () => {
    useHistoryStore.setState({ ids: ["llama-drama", "llamigos"] });

    const page = await renderPage("/history", "履歴");
    const titles = Array.from(page.querySelectorAll(".stream-card-body strong")).map(
      (node) => node.textContent,
    );
    expect(titles).toEqual(["Caminandes 1: Llama Drama", "Caminandes 3: Llamigos"]);
  });

  it("clears the history on request", async () => {
    useHistoryStore.setState({ ids: ["llama-drama"] });

    const page = await renderPage("/history", "履歴");
    // HeroUI(React Aria)のonPressはmousedown/mouseupで発火するため、clickだけでは足りない。
    const clearButton = within(page).getByRole("button", { name: "履歴を削除" });
    fireEvent.mouseDown(clearButton);
    fireEvent.mouseUp(clearButton);
    fireEvent.click(clearButton);

    expect(useHistoryStore.getState().ids).toEqual([]);
    expect(within(page).getByText("配信を視聴すると、ここに履歴が残ります。")).toBeInTheDocument();
  });
});
