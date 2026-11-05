import { chromium } from "playwright-core";

const outDir = process.env.SHOT_DIR ?? ".";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
await page.goto("http://localhost:1420", { waitUntil: "networkidle" });
await page.waitForTimeout(600);

await page.getByRole("button", { name: /^(Language|언어|言語|语言)$/ }).click();
await page.getByRole("menuitem", { name: /한국어/ }).click();
await page.waitForTimeout(500);
console.log(`lang after menu: ${await page.evaluate(() => document.documentElement.lang)}`);
console.log((await page.locator("body").innerText()).slice(0, 260).replace(/\n/g, " | "));

await page.getByRole("button", { name: "캡처" }).first().click();
await page.waitForTimeout(400);
const dialogText = await page.locator("[role='dialog']").innerText();
console.log(dialogText.slice(0, 360).replace(/\n/g, " | "));
await page.screenshot({ path: `${outDir}/i18n-switch-ko.png` });
await page.keyboard.press("Escape");

await page.getByRole("button", { name: /^(Language|언어|言語|语言)$/ }).click();
await page.getByRole("menuitem", { name: /日本語/ }).click();
await page.waitForTimeout(500);
console.log(`lang after ja: ${await page.evaluate(() => document.documentElement.lang)}`);
await page.screenshot({ path: `${outDir}/i18n-switch-ja.png` });

await browser.close();
