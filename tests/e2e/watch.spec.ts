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

test("switching channels keeps the comment stream connected", async ({ page }) => {
  const streamErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /cors|events|workbox|no-response/i.test(message.text())) {
      streamErrors.push(message.text());
    }
  });

  await page.goto("/watch?channel=big-buck-bunny");
  await expect(page.getByRole("heading", { name: "Big Buck Bunny" })).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".connection-pill")).toHaveText("接続中", { timeout: 15000 });

  await page.goto("/watch?channel=coffee-run");
  await expect(page.getByRole("heading", { name: "Coffee Run" })).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".connection-pill")).toHaveText("接続中", { timeout: 10000 });
  expect(streamErrors).toEqual([]);
});

test("service worker does not register runtime API caching", async ({ request }) => {
  const response = await request.get("/sw.js");

  expect(response.ok()).toBe(true);
  expect(await response.text()).not.toContain("NetworkOnly");
});
