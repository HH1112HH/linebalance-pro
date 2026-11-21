import { chromium } from "playwright";
import path from "node:path";

// Focused UI smoke test for the current workspace: overview, the two
// case-study tabs, and XLSX export. Requires Playwright:
//   npm i -D playwright && npx playwright install chromium
const out =
  process.env.SHOT_DIR || "C:/Users/AN NGOC/AppData/Local/Temp/opencode/linebalance-ui";
const base = "http://localhost:5173";
const username = process.env.UI_CHECK_USERNAME || "admin";
const password = process.env.UI_CHECK_PASSWORD || "";
const errors = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

async function signInIfNeeded() {
  if (!page.url().includes("/login")) return;
  if (!password) {
    throw new Error(
      "Login is enabled. Set UI_CHECK_PASSWORD (and optionally UI_CHECK_USERNAME) before running ui-check.mjs.",
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

await page.goto(base, { waitUntil: "networkidle" });
await signInIfNeeded();
await page.waitForSelector(".page-header h1", { timeout: 90000 });
console.log("overview title:", await page.locator(".page-header h1").innerText());
console.log("overview metric cards:", await page.locator(".metric-card").count());
console.log("api chip:", await page.locator(".api-chip").innerText());
await page.screenshot({ path: path.join(out, "01-overview.png"), fullPage: true });

const feasible = page.getByRole("button", { name: /Feasible/ });
await feasible.click();
await page.waitForTimeout(400);
console.log("scenario B pressed:", await feasible.getAttribute("aria-pressed"));

await page.getByRole("button", { name: /Quality/i }).click();
await page.waitForSelector(".quality-pareto .pareto-svg", { timeout: 30000 });
console.log(
  "quality kpi cards:",
  await page.locator(".quality-overview .case-kpi-card").count(),
);
console.log("quality pareto charts:", await page.locator(".pareto-svg").count());
console.log(
  "quality defect rows:",
  await page.locator(".quality-defect-table tbody tr").count(),
);
console.log(
  "quality audit rows:",
  await page.locator(".quality-audit-table tbody tr").count(),
);
console.log(
  "quality overflow px:",
  await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  ),
);
await page.screenshot({ path: path.join(out, "02-quality-rca.png"), fullPage: true });

await page.getByRole("button", { name: /Layout/i }).click();
await page.waitForSelector(".layout-trials-table", { timeout: 30000 });
console.log(
  "layout kpi cards:",
  await page.locator(".layout-overview .case-kpi-card").count(),
);
console.log(
  "layout trial rows:",
  await page.locator(".layout-trials-table tbody tr").count(),
);
console.log("layout diagrams:", await page.locator(".diagram-svg").count());
console.log(
  "layout overflow px:",
  await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  ),
);
await page.screenshot({
  path: path.join(out, "03-layout-ergonomics.png"),
  fullPage: true,
});

const downloadPromise = page
  .waitForEvent("download", { timeout: 30000 })
  .catch(() => null);
await page.getByRole("button", { name: "Export XLSX" }).click();
const download = await downloadPromise;
console.log("download:", download ? download.suggestedFilename() : "none");
if (download) {
  await download.saveAs(path.join(out, "linebalance-export.xlsx"));
}

console.log("console errors:", errors.length ? errors : "none");
await browser.close();
