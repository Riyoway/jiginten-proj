import { expect, test } from "@playwright/test";

test("home shell renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /好きな配信を見つけて/ })).toBeVisible();
});
