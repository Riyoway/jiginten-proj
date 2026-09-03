import { expect, test } from "@playwright/test";

test("home layout has no horizontal overflow and links to the real stream", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /見る、話す、贈る/ })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);

  await page.getByRole("link", { name: /雪景色の線路を眺める配信/ }).click();
  await expect(page).toHaveURL(/\/watch$/);
});
