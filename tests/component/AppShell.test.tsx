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
    // お気に入りは端末内保存で実装済みなので、無効なボタンではなく実ページへのリンク
    expect(await screen.findByRole("link", { name: /^お気に入り$/ })).toHaveAttribute("href", "/favorites");
    expect(await screen.findByRole("link", { name: /^フォロー中$/ })).toHaveAttribute("href", "/follows");
    expect(await screen.findByRole("link", { name: /^履歴$/ })).toHaveAttribute("href", "/history");

    // 人気はランキングAPIが無いため一覧を出せない
    expect(screen.getByRole("button", { name: "人気" })).toBeDisabled();
  });

  it("shows the gift credits on a header control that no longer navigates", async () => {
    render(<RouterProvider router={router} />);

    const credits = await screen.findByRole("button", { name: /ギフトクレジット 3,000/ });
    // 以前は /watch へのリンクだったが、残高表示に変わったので遷移させない
    expect(credits.closest("a")).toBeNull();

    // Homeの「ギフトを見る」CTAと混ざらないよう、topbarに絞って確認する
    const topbar = credits.closest(".topbar");
    if (!topbar) throw new Error("topbar not found");
    expect(within(topbar as HTMLElement).queryByRole("link", { name: /ギフト/ })).not.toBeInTheDocument();
  });

  it("shows the local profile summary and credit icon in the sidebar", async () => {
    render(<RouterProvider router={router} />);

    const sidebar = (await screen.findByRole("link", { name: /^ホーム$/ })).closest("aside");
    if (!sidebar) throw new Error("sidebar not found");

    const profile = sidebar.querySelector(".profile-card");
    if (!profile) throw new Error("profile card not found");

    expect(within(profile as HTMLElement).getByText("Guest")).toBeInTheDocument();
    expect(within(profile as HTMLElement).getByText("Premium")).toBeInTheDocument();
    expect(within(profile as HTMLElement).getByText("3,000 P")).toBeInTheDocument();
    expect(profile.querySelector(".profile-credit-icon")).toHaveAttribute("src", "/credits.svg");
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
    const channelIds = MOCK_CHANNELS.map((channel) => channel.id);
    for (const channel of MOCK_CHANNELS) {
      const link = within(sidebar).getByRole("link", {
        name: getStreamlyUserName(channel.id, channelIds),
      });
      expect(link.getAttribute("href")).toContain(`channel=${channel.id}`);
    }

    expect(within(sidebar).queryByText(MOCK_CHANNELS[0].title)).not.toBeInTheDocument();
  });

  // /channels.json は13件まで増えた。全部並べるとsidebarが縦に溢れるので、おすすめは5件に絞る。
  it("shows at most 5 channels in the sidebar and never repeats a display name", async () => {
    const many: Channel[] = Array.from({ length: 13 }, (_, index) => ({
      id: `channel-${index}`,
      title: `Title ${index}`,
      playlist: `/ch/channel-${index}/stream.m3u8`,
      default: index === 0,
    }));
    useChannelStore.setState({ channels: many, status: "loaded" });

    render(<RouterProvider router={router} />);
    const sidebar = (await screen.findByRole("link", { name: /^ホーム$/ })).closest("aside");
    if (!sidebar) throw new Error("sidebar not found");

    const rows = sidebar.querySelectorAll(".sidebar-channel-link");
    expect(rows).toHaveLength(5);

    // 以前は10個の固定プールから選んでいたため、13件だと同じ仮名が2行に出ていた
    const names = [...rows].map((row) => row.querySelector("span")?.textContent);
    expect(new Set(names).size).toBe(names.length);
  });

  it("labels the channel list 'おすすめチャンネル' with no purple English eyebrow", async () => {
    render(<RouterProvider router={router} />);

    const heading = await screen.findByText("おすすめチャンネル");
    expect(heading).toBeInTheDocument();

    const sidebar = heading.closest(".sidebar-channels");
    if (!sidebar) throw new Error("sidebar-channels not found");
    // reference画像のsidebarに紫色の英語eyebrowは存在しない(CATEGORIES/LIVE等)。
    expect(sidebar.querySelector(".eyebrow")).toBeNull();
  });
});
