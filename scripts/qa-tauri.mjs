import { chromium } from "playwright-core";

const browser = await chromium.connectOverCDP("http://localhost:9222");
const contexts = browser.contexts();
const pages = contexts.flatMap((context) => context.pages());
console.log(`contexts: ${contexts.length}, pages: ${pages.length}`);

const page = pages.find((candidate) => candidate.url().includes("localhost:1420")) ?? pages[0];
if (!page) {
  throw new Error("No Tauri WebView page found");
}

const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") {
    errors.push(`console: ${message.text()}`);
  }
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

await page.waitForTimeout(1200);
console.log(`url: ${page.url()}`);
console.log(`title: ${await page.title()}`);

const summary = await page.evaluate(() => ({
  displays: document.querySelectorAll("[class*='border-line-strong']").length,
  windowCards: document.querySelectorAll("[data-window-card]").length,
  text: document.body.innerText.slice(0, 500),
}));
console.log(JSON.stringify(summary, null, 2));

await page.getByRole("button", { name: /^Restore/ }).first().click();
await page.waitForTimeout(1600);
const toast = await page.locator("[role='status']").innerText().catch(() => "no toast");
console.log(`restore toast: ${toast.replace(/\n/g, " | ")}`);
await page.screenshot({ path: process.env.SHOT_PATH ?? "tauri-restore.png" });

await page.getByRole("button", { name: "Capture" }).first().click();
await page.waitForTimeout(500);
const dialogTitle = await page.getByRole("heading", { name: "Capture layout" }).innerText();
const windowCount = await page.locator("[role='dialog'] [aria-pressed]").count();
console.log(`capture dialog: ${dialogTitle}, selectable windows: ${windowCount}`);
await page.screenshot({ path: process.env.SHOT_CAPTURE ?? "tauri-capture.png" });

await page.locator("[role='dialog'] input").fill("QA Layout");
await page.getByRole("button", { name: "Save layout" }).click();
await page.waitForTimeout(900);
const saveToast = await page.locator("[role='status']").innerText().catch(() => "no toast");
const profileNames = await page.locator("aside button[aria-current], aside button").evaluateAll((nodes) =>
  nodes.map((node) => node.textContent?.trim().slice(0, 40)).filter(Boolean),
);
console.log(`save toast: ${saveToast.replace(/\n/g, " | ")}`);
console.log(`profile-ish buttons: ${profileNames.length}`);
await page.screenshot({ path: process.env.SHOT_SAVED ?? "tauri-saved.png" });

await page.evaluate(() => localStorage.removeItem("windowanchor.profiles"));

console.log(errors.length > 0 ? errors.join("\n") : "no console errors");
await browser.close();
