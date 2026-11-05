import { chromium } from "playwright-core";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 920 },
  deviceScaleFactor: 1,
});

page.on("console", (message) => {
  if (message.type() === "error" || message.type() === "warning") {
    console.log(`console:${message.type()}: ${message.text()}`);
  }
});
page.on("pageerror", (error) => console.log(`pageerror: ${error.message}`));

await page.goto("http://localhost:1420", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

if (process.env.FOCUS_DISPLAY) {
  await page
    .getByRole("button", {
      name: `Focus Display ${process.env.FOCUS_DISPLAY}`,
    })
    .click();
  await page.waitForTimeout(400);
}

await page.screenshot({
  path: process.env.SHOT_PATH ?? "ui.png",
  fullPage: true,
});
console.log(`title: ${await page.title()}`);
await browser.close();
