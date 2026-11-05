import { chromium } from "playwright-core";

const outDir = process.env.SHOT_DIR ?? ".";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
const languages = [
  { code: "ko", rules: /^규칙/, activity: /^활동/, settings: /^설정/ },
  { code: "zh-CN", rules: /^规则/, activity: /^活动/, settings: /^设置/ },
  { code: "ja", rules: /^ルール/, activity: /^アクティビティ/, settings: /^設定/ },
];

for (const language of languages) {
  await page.goto("http://localhost:1420", { waitUntil: "networkidle" });
  await page.evaluate((code) => localStorage.setItem("windowanchor.language", code), language.code);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const results = {};
  await page.getByRole("button", { name: language.rules }).first().click();
  await page.waitForTimeout(250);
  results.rules = await page.locator("h1").first().innerText();

  await page.getByRole("button", { name: language.activity }).first().click();
  await page.waitForTimeout(250);
  results.activity = await page.locator("h1").first().innerText();

  await page.getByRole("button", { name: language.settings }).first().click();
  await page.waitForTimeout(250);
  results.settings = await page.locator("h1").first().innerText();
  await page.screenshot({ path: `${outDir}/pages-${language.code}.png` });

  await page.keyboard.press("Control+k");
  await page.waitForTimeout(250);
  results.command = await page.locator("[role='dialog'] input").getAttribute("placeholder");
  await page.keyboard.press("Escape");

  const missing = await page.evaluate(() =>
    Array.from(document.querySelectorAll("body *"))
      .map((node) => (node.textContent ?? "").trim())
      .filter((text) =>
        /^(topbar|capture|inspector|activity|rules|settings|command|profiles)\.[a-zA-Z.]+$/.test(text),
      )
      .slice(0, 10),
  );

  console.log(`\n=== ${language.code} ===`);
  console.log(JSON.stringify(results, null, 2));
  console.log(missing.length > 0 ? `missing: ${missing.join(", ")}` : "no missing keys");
}

await browser.close();
