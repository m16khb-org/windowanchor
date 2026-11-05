import { chromium } from "playwright-core";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
await page.goto("http://localhost:1420", { waitUntil: "networkidle" });
await page.waitForTimeout(600);

const menuButtons = page.locator('button[aria-label="레이아웃 작업"]');
console.log("menu buttons", await menuButtons.count());
await menuButtons.first().click();
await page.waitForTimeout(300);
console.log("menu items", await page.getByRole("menuitem").allInnerTexts());
await page.screenshot({
  path: "C:/Users/hb/AppData/Local/Temp/opencode/delete-menu.png",
});
console.log("delete item count", await page.getByRole("menuitem", { name: "레이아웃 삭제" }).count());

await page.getByRole("menuitem", { name: "레이아웃 삭제" }).click();
await page.waitForTimeout(300);
console.log("dialog headings", await page.getByRole("heading").allInnerTexts());
await page.screenshot({
  path: "C:/Users/hb/AppData/Local/Temp/opencode/delete-confirm.png",
});

await page.getByRole("button", { name: "레이아웃 삭제" }).last().click();
await page.waitForTimeout(500);
console.log("after delete menus", await page.locator('button[aria-label="레이아웃 작업"]').count());
await page.screenshot({
  path: "C:/Users/hb/AppData/Local/Temp/opencode/delete-after.png",
});

await browser.close();
