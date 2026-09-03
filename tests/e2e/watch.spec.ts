import { expect, test } from "@playwright/test";

test("watch page plays a stream and can switch channels", async ({ page }) => {
  await page.goto("/watch");

  await expect(page.locator(".player-frame")).toBeVisible();
  await expect(page.locator(".live-badge").first()).toBeVisible();

  // チャンネルが2つ以上ある場合のみ切り替えを検証する(外部APIの現在のチャンネル数に依存しない)。
  const tabs = page.locator(".channel-tab");
  const tabCount = await tabs.count();
  test.skip(tabCount < 2, "channels.json did not return multiple channels to switch between");

  const nextTab = tabs.nth(1);
  const nextChannelTitle = await nextTab.innerText();
  await nextTab.click();

  await expect(page).toHaveURL(/channel=/);
  await expect(page.locator(".channel-tab.active")).toHaveText(nextChannelTitle);
});
