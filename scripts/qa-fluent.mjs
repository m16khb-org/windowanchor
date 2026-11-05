import { chromium } from "playwright-core";

const outDir = process.env.SHOT_DIR ?? ".";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

await page.goto("http://localhost:1420", { waitUntil: "networkidle" });
await page.evaluate(() => {
  localStorage.setItem("windowanchor.language", "en");
  localStorage.setItem("windowanchor.theme", "light");
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(700);
await page.screenshot({ path: `${outDir}/fluent-main.png` });

await page.getByRole("button", { name: "Capture" }).first().click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/fluent-capture.png` });
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

await page.keyboard.press("Control+k");
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/fluent-command.png` });
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

await page.getByRole("button", { name: /^Settings/ }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/fluent-settings.png` });

await page.getByLabel("Theme").selectOption("dark");
await page.waitForTimeout(700);
await page.screenshot({ path: `${outDir}/fluent-dark.png` });

console.log(errors.length > 0 ? errors.join("\n") : "no console errors");
await browser.close();
