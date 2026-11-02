import { chromium } from "playwright";
import path from "node:path";

const out = "C:/Users/AN NGOC/AppData/Local/Temp/opencode/linebalance-ui";
const browser = await chromium.launch();
const page = await browser.newPage();
const widths = [390, 768, 1024, 1440];
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

for (const width of widths) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = Array.from(document.querySelectorAll("body *"))
      .filter((element) => {
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
  console.log(`WIDTH ${width}`, JSON.stringify(metrics));
  if (width === 390) {
    for (const selector of [
      ".scenario-bar",
      ".kpi-grid",
      ".takt-panel",
      ".workload-panel",
      ".baseline-panel",
      ".planning-panel",
      ".actuals-panel",
      ".forms-grid",
      ".station-table-panel",
      ".metadata-panel",
      ".snapshots-panel",
    ]) {
      const locator = page.locator(selector).first();
      if ((await locator.count()) > 0) {
        await locator.screenshot({
          path: path.join(out, `mobile-${selector.replace(/[^a-z0-9]/gi, "")}.png`),
        });
      }
    }
  }
}
console.log("errors", errors.length ? errors : "none");
await browser.close();
