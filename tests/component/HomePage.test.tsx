import { RouterProvider } from "@tanstack/react-router";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { router } from "../../src/app/router";
import type { Channel } from "../../src/lib/api/contracts";
import { getStreamlyUserName } from "../../src/lib/streamlyUsers";
import { useChannelStore } from "../../src/store/channels";
import { useFollowStore } from "../../src/store/follows";

// ponytail: /channels.jsonへの実ネットワークアクセスをテストで発生させないため、
// storeへ直接シードしてload()を早期returnさせる(Docs/DEVELOPMENT.mdの方針通り)。
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

beforeEach(() => {
  useChannelStore.setState({ channels: MOCK_CHANNELS, status: "loaded" });
  useFollowStore.setState({ ids: [] });
});

describe("HomePage", () => {
  it("renders the hero heading and a real link to /watch", async () => {
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("heading", { name: /好きな配信を見つけて/ })).toBeInTheDocument();

    const links = await screen.findAllByRole("link");
    expect(links.some((link) => link.getAttribute("href")?.startsWith("/watch"))).toBe(true);
  });

  it("renders one live card per real channel from /channels.json", async () => {
    render(<RouterProvider router={router} />);

    const grid = (await screen.findByText("おすすめのライブ")).closest("section");
    if (!grid) throw new Error("live grid section not found");

    for (const channel of MOCK_CHANNELS) {
      expect(within(grid).getByText(channel.title)).toBeInTheDocument();
    }
  });

  it("shows a coming-soon placeholder only for unsupported top gifters", async () => {
    render(<RouterProvider router={router} />);

    const comingSoonLabels = await screen.findAllByText("近日公開");
    expect(comingSoonLabels).toHaveLength(1);

    // 実データが無い箇所に、それっぽい偽の数値・チャンネル名を出していないことの回帰チェック
    const main = screen.getByRole("main");
    expect(within(main).queryByText(/[0-9],[0-9]{3}\s*P/)).not.toBeInTheDocument();
    expect(within(main).queryByText(/TechWorld|GameSpace|ChillWave/)).not.toBeInTheDocument();
  });

  it("derives category counts from channels, disables zero-count categories, and filters the grid", async () => {
    render(<RouterProvider router={router} />);

    const categorySection = (await screen.findByRole("heading", { name: "人気のカテゴリー" })).closest(
      "section",
    );
    if (!categorySection) throw new Error("category section not found");

    const comedy = within(categorySection).getByRole("button", { name: "コメディ 1件" });
    expect(comedy).toBeEnabled();
    expect(within(categorySection).getByRole("button", { name: "ゲーム 0件" })).toBeDisabled();

    fireEvent.click(comedy);
    const liveSection = screen.getByRole("heading", { name: "おすすめのライブ" }).closest("section");
    if (!liveSection) throw new Error("live section not found");
    expect(within(liveSection).getByText("Caminandes 3: Llamigos")).toBeInTheDocument();
    expect(within(liveSection).queryByText("Caminandes 1: Llama Drama")).not.toBeInTheDocument();
  });

  it("keeps categories on one row until the viewer expands the list", async () => {
    render(<RouterProvider router={router} />);

    const categorySection = (await screen.findByRole("heading", { name: "人気のカテゴリー" })).closest(
      "section",
    );
    if (!categorySection) throw new Error("category section not found");

    const toggle = within(categorySection).getByRole("button", { name: "すべて見る" });
    const categoryRow = within(categorySection).getByRole("group");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(categoryRow).not.toHaveClass("expanded");

    fireEvent.click(toggle);

    expect(within(categorySection).getByRole("button", { name: "折りたたむ" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(categoryRow).toHaveClass("expanded");
  });

  it("does not leak developer-facing wording to end users", async () => {
    render(<RouterProvider router={router} />);
    await screen.findByRole("heading", { name: /好きな配信を見つけて/ });

    const body = document.body.textContent ?? "";
    for (const term of ["API", "スターター", "SSE", "HLS", "バックエンド", "EventSource"]) {
      expect(body).not.toContain(term);
    }
  });

  it("tells the viewer how to fill the followed-lives panel while nothing is followed", async () => {
    render(<RouterProvider router={router} />);

    expect(await screen.findByText("フォロー中のライブ")).toBeInTheDocument();
    expect(screen.getByText("配信画面でフォローすると、ここに表示されます")).toBeInTheDocument();
  });

  it("lists followed channels that are currently live", async () => {
    useFollowStore.setState({ ids: ["llama-drama"] });
    render(<RouterProvider router={router} />);

    const panel = (await screen.findByText("フォロー中のライブ")).closest(".rail-panel");
    if (!panel) throw new Error("followed-lives panel not found");

    const row = within(panel).getByRole("link", { name: /Streamly User/ });
    expect(row.getAttribute("href")).toContain("channel=llama-drama");
    const channelIds = MOCK_CHANNELS.map((channel) => channel.id);
    expect(within(panel).getByText(getStreamlyUserName("llama-drama", channelIds))).toBeInTheDocument();
    expect(within(panel).getByText("すべて見る")).toHaveAttribute("href", "/follows");
    expect(within(panel).getByText("ドラマ")).toBeInTheDocument();
    // フォローしていないチャンネルはここに出さない
    expect(within(panel).queryByText(getStreamlyUserName("llamigos", channelIds))).not.toBeInTheDocument();
  });
});
