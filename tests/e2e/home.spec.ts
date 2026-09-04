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

test("category cards filter live channels and keep zero-count categories disabled", async ({ page }) => {
  await page.goto("/");

  const zeroCategory = page.getByRole("button", { name: "ゲーム 0件" });
  await expect(zeroCategory).toBeDisabled();

  const allCards = page.locator(".stream-card-live");
  const activeCategory = page.locator(".category-card:not(:disabled)").first();
  const label = await activeCategory.getAttribute("aria-label");
  const expectedCount = Number(label?.match(/(\d+)件$/)?.[1]);
  expect(expectedCount).toBeGreaterThan(0);
  await activeCategory.click();

  await expect(activeCategory).toHaveAttribute("aria-pressed", "true");
  await expect(allCards).toHaveCount(expectedCount);
});
