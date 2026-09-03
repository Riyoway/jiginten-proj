import { expect, test } from "@playwright/test";

test("home layout has no horizontal overflow and links to a real channel", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /好きな配信を見つけて/ })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);

  // /channels.jsonが解決した最初のライブカードから /watch?channel=... へ遷移できること
  await page.locator(".stream-card-live").first().click();
  await expect(page).toHaveURL(/\/watch(\?channel=.+)?$/);
});
