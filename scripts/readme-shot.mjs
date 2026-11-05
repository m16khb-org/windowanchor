import { chromium } from "playwright-core";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
await page.goto("http://localhost:1420", { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.setItem("windowanchor.language", "en"));
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.locator("[data-window-card]").first().click();
await page.waitForTimeout(300);
await page.screenshot({ path: "docs/screenshots/overview.png" });
console.log("saved docs/screenshots/overview.png");
await browser.close();
