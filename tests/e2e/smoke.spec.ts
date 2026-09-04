import { expect, test } from "@playwright/test";

test("unknown route renders the Streamly 404 page", async ({ page }) => {
  await page.goto("/missing-page");

  await expect(page.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ホームへ戻る" })).toHaveAttribute("href", "/");
});

test("prevents saving images through browser image gestures", async ({ page }) => {
  await page.goto("/");

  const image = page.locator(".user-menu-trigger img");
  await expect(image).toBeVisible();

  const prevented = await image.evaluate((element) =>
    ["contextmenu", "dragstart"].map((eventType) => {
      const event = new Event(eventType, { bubbles: true, cancelable: true });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    }),
  );

  expect(prevented).toEqual([true, true]);
  await expect(image).toHaveCSS("user-select", "none");
});
