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

test("keeps categories on one row until the list is expanded", async ({ page }) => {
  await page.goto("/");

  const categoryRow = page.locator("#home-category-list");
  const toggle = page.getByRole("button", { name: "すべて見る" });
  await expect(categoryRow).not.toHaveClass(/expanded/);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  await toggle.click();

  await expect(categoryRow).toHaveClass(/expanded/);
  await expect(page.getByRole("button", { name: "折りたたむ" })).toHaveAttribute("aria-expanded", "true");
});

test("keeps category labels on one line", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".category-card").first()).toBeVisible();

  const wrappedLabels = await page.locator(".category-copy strong").evaluateAll(
    (elements) =>
      elements.filter((element) => {
        const style = getComputedStyle(element);
        return style.whiteSpace !== "nowrap" || element.scrollWidth > element.clientWidth;
      }).length,
  );
  expect(wrappedLabels).toBe(0);
});

test("uses a captured stream frame for live thumbnails", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(".stream-card-live .stream-thumbnail-image").first()).toHaveAttribute(
    "src",
    /^data:image\/jpeg;base64,/,
    { timeout: 15000 },
  );
});

test("shows followed live streams with available channel details", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "streamly-follows",
      JSON.stringify({ state: { ids: ["big-buck-bunny"] }, version: 0 }),
    );
  });
  await page.goto("/");

  const panel = page.locator(".rail-panel").filter({ hasText: "フォロー中のライブ" });
  await expect(panel.getByRole("link", { name: "すべて見る" })).toHaveAttribute("href", "/follows");
  await expect(panel.locator(".rail-channel-row")).toHaveCount(1);
  await expect(panel.locator(".rail-channel-thumbnail")).toHaveAttribute("src", "/avatars/avatar1.png");
  await expect(panel.getByText("Big Buck Bunny")).toBeVisible();
  await expect(panel.getByText("コメディ")).toBeVisible();
});
