import { expect, test } from "@playwright/test";

test("watch page plays the default stream", async ({ page }) => {
  await page.goto("/watch");

  await expect(page.locator(".player-frame")).toBeVisible();
  await expect(page.locator(".live-badge").first()).toBeVisible();
});

test("watch page resolves a channel requested via the URL", async ({ page }) => {
  await page.goto("/watch?channel=llama-drama");

  await expect(page.locator(".player-frame")).toBeVisible();
  // /channels.json は実サーバーへの外部リクエストなので、他ワーカーとの同時アクセスで
  // 遅延することがある(Docs/DEVELOPMENT.md: 外部APIをCI成功条件にしすぎない)。既定の
  // 5秒より長めに待つ。
  await expect(page.getByRole("heading", { name: "Caminandes 1: Llama Drama" })).toBeVisible({
    timeout: 15000,
  });
});
