import { chromium } from "playwright";
import path from "node:path";

// Responsive smoke test for the current workspace. Requires Playwright:
//   npm i -D playwright && npx playwright install chromium
const out = "C:/Users/AN NGOC/AppData/Local/Temp/opencode/linebalance-ui";
const base = "http://localhost:5173";
const username = process.env.UI_CHECK_USERNAME || "admin";
const password = process.env.UI_CHECK_PASSWORD || "";
const browser = await chromium.launch();
const page = await browser.newPage();
const widths = [390, 768, 1024, 1440];
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

async function signInIfNeeded() {
  if (!page.url().includes("/login")) return;
  if (!password) {
    throw new Error(
      "Login is enabled. Set UI_CHECK_PASSWORD (and optionally UI_CHECK_USERNAME) before running responsive-check.mjs.",
    );
  }
  await page.locator(".auth-account").filter({ hasText: username }).first().click();
  await page
    .locator('.auth-form input[autocomplete="current-password"]')
    .fill(password);
  await page.locator(".auth-submit").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 20000,
  });
}

async function measure(label) {
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = Array.from(document.querySelectorAll("body *"))
      .filter((element) => {
        if (element.closest(".table-wrap")) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.right > doc.clientWidth + 1;
      })
      .slice(0, 12)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          cls: element.className?.toString().slice(0, 80),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      });
    return {
      clientWidth: doc.clientWidth,
      scrollWidth: doc.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      overflow,
    };
  });
  console.log(label, JSON.stringify(metrics));
  return metrics;
}

async function openSection(name, selector) {
  await page.getByRole("button", { name }).click();
  await page.waitForSelector(selector, { timeout: 30000 });
  await page.waitForTimeout(200);
}

async function capture(width, section, selectors) {
  if (width === 390 || width === 1440) {
    await page.screenshot({
      path: path.join(out, `${section}-${width}.png`),
      fullPage: true,
    });
  }
  if (width !== 390) return;
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) > 0) {
      await locator.screenshot({
        path: path.join(out, `mobile-${selector.replace(/[^a-z0-9]/gi, "")}.png`),
      });
    }
  }
}

for (const width of widths) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(base, { waitUntil: "networkidle" });
  await signInIfNeeded();
  await page.waitForSelector(".page-header h1", { timeout: 90000 });
  await page.waitForTimeout(300);
  await measure(`OVERVIEW WIDTH ${width}`);

  await openSection(/Quality/i, ".quality-pareto .pareto-svg");
  await measure(`QUALITY WIDTH ${width}`);
  await capture(width, "quality", [
    ".quality-overview",
    ".quality-pareto",
    ".quality-fishbone",
    ".quality-verification",
    ".quality-sigma",
  ]);

  await openSection(/Layout/i, ".layout-trials-table");
  await measure(`LAYOUT WIDTH ${width}`);
  await capture(width, "layout", [
    ".layout-overview",
    ".layout-trials",
    ".layout-diagram",
    ".layout-ergo",
    ".layout-control",
  ]);
}

console.log("errors", errors.length ? errors : "none");
await browser.close();
