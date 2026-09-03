import { RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { router } from "../../src/app/router";

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
});
