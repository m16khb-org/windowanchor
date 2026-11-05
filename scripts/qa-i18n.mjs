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

for (const language of ["ko", "zh-CN", "ja", "en"]) {
  await page.goto("http://localhost:1420", { waitUntil: "networkidle" });
  await page.evaluate((next) => {
    localStorage.setItem("windowanchor.language", next);
  }, language);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const state = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    text: document.body.innerText.slice(0, 900),
    missingKeys: Array.from(document.querySelectorAll("body *"))
      .map((node) => node.textContent ?? "")
      .filter((text) => /^(topbar|capture|inspector|activity|rules|settings|command)\.[a-zA-Z.]+$/.test(text.trim()))
      .slice(0, 10),
  }));

  console.log(`\n=== ${language} (${state.lang}) ===`);
  console.log(state.text.replace(/\n{3,}/g, "\n").slice(0, 700));
  if (state.missingKeys.length > 0) {
    console.log(`missing keys: ${state.missingKeys.join(", ")}`);
  }

  await page.screenshot({ path: `${outDir}/i18n-${language}.png` });
}

console.log(errors.length > 0 ? `\nerrors:\n${errors.join("\n")}` : "\nno console errors");
await browser.close();
