import { expect, test } from "@playwright/test";

test("home shell renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /好きな配信を見つけて/ })).toBeVisible();
});

test("unknown route renders the Streamly 404 page", async ({ page }) => {
  await page.goto("/missing-page");

  await expect(page.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ホームへ戻る" })).toHaveAttribute("href", "/");
});
