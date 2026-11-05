import { chromium } from "playwright-core";

const outDir = process.env.SHOT_DIR ?? ".";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
const errors = [];

page.on("console", (message) => {
  if (message.type() === "error") {
    errors.push(`console: ${message.text()}`);
  }
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

await page.goto("http://localhost:1420", { waitUntil: "networkidle" });
await page.waitForTimeout(900);

await page.locator("[data-window-card]").first().click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/qa-selected.png` });

await page.getByRole("button", { name: "Capture" }).first().click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/qa-capture.png` });
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

await page.keyboard.press("Control+k");
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/qa-command.png` });
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

await page.getByRole("button", { name: /^Rules/ }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/qa-rules.png` });

await page.getByRole("button", { name: /^Activity/ }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/qa-activity.png` });

console.log(errors.length > 0 ? errors.join("\n") : "no console errors");
await browser.close();
