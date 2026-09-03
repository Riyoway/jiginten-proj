import { RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { router } from "../../src/app/router";

describe("HomePage", () => {
  it("renders the hero heading and a real link to /watch", async () => {
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("heading", { name: /好きな配信を見つけて/ })).toBeInTheDocument();

    const links = await screen.findAllByRole("link");
    expect(links.some((link) => link.getAttribute("href") === "/watch")).toBe(true);
  });

  it("shows coming-soon placeholders instead of fabricated data", async () => {
    render(<RouterProvider router={router} />);

    // カテゴリー / フォロー中のライブ / トップギフター の3箇所
    const comingSoonLabels = await screen.findAllByText("近日公開");
    expect(comingSoonLabels.length).toBeGreaterThanOrEqual(3);

    // 実データが無い箇所に、それっぽい偽の数値・チャンネル名を出していないことの回帰チェック
    expect(screen.queryByText(/[0-9],[0-9]{3}\s*P/)).not.toBeInTheDocument();
    expect(screen.queryByText(/TechWorld|GameSpace|ChillWave/)).not.toBeInTheDocument();
  });

  it("does not leak developer-facing wording to end users", async () => {
    render(<RouterProvider router={router} />);
    await screen.findByRole("heading", { name: /好きな配信を見つけて/ });

    const body = document.body.textContent ?? "";
    for (const term of ["API", "スターター", "SSE", "HLS", "バックエンド", "EventSource"]) {
      expect(body).not.toContain(term);
    }
  });
});
