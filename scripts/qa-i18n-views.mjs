import { chromium } from "playwright-core";

const outDir = process.env.SHOT_DIR ?? ".";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
await page.goto("http://localhost:1420", { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.setItem("windowanchor.language", "ko"));
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(700);

await page.getByRole("button", { name: /^설정/ }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/i18n-settings-ko.png` });
console.log((await page.locator("main").innerText()).slice(0, 700));

await page.getByRole("button", { name: /^집중/ }).first().click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: "캡처" }).first().click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/i18n-capture-ko.png` });
console.log((await page.locator("[role='dialog']").innerText()).slice(0, 600));

await browser.close();
