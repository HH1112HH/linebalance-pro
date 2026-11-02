import { chromium } from "playwright";
import path from "node:path";

const out = process.env.SHOT_DIR || "C:/Users/AN NGOC/AppData/Local/Temp/opencode/linebalance-ui";
const base = "http://127.0.0.1:5173";
const errors = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

await page.goto(base, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(out, "01-scenario-a.png"), fullPage: true });
console.log("A title:", await page.locator(".summary-copy h1").innerText());
console.log("A kpi cards:", await page.locator(".kpi-card").count());
console.log("A api badge:", await page.locator(".api-badge").innerText());

await page.getByRole("button", { name: /Feasible/ }).click();
await page.waitForTimeout(300);
console.log("B title:", await page.locator(".summary-copy h1").innerText());
console.log("B target card:", await page.locator(".kpi-card").nth(4).innerText());
await page.screenshot({ path: path.join(out, "02-scenario-b.png"), fullPage: true });

await page.getByRole("button", { name: "Baseline", exact: true }).click();
await page.waitForTimeout(250);
console.log("baseline rows:", await page.locator(".wl-row").count());
console.log("baseline first row:", await page.locator(".wl-row").first().innerText());
await page.screenshot({ path: path.join(out, "03-baseline.png"), fullPage: true });

await page.getByRole("button", { name: /Stretch/ }).click();
await page.waitForTimeout(300);

await page.getByRole("button", { name: "Re-run optimizer" }).click();
await page.waitForFunction(
  () => document.querySelector(".notice")?.textContent?.includes("Re-ran"),
  { timeout: 90000 },
);
console.log("rerun notice:", await page.locator(".notice").innerText());
console.log("rerun status:", await page.locator(".status-large").innerText());

const actualForm = page.locator(".form-card").nth(0);
await actualForm.locator("input").nth(1).fill("390");
await actualForm.getByRole("button", { name: "Apply actuals" }).click();
await page.waitForSelector(".actuals-mini");
await page.waitForTimeout(300);
console.log("actuals mini:", await actualForm.locator(".actuals-mini").innerText());
console.log(
  "dashboard actuals contains 390:",
  (await page.locator(".actuals-panel").innerText()).includes("390"),
);
await page.screenshot({ path: path.join(out, "04-actuals-applied.png"), fullPage: true });

const downtimeForm = page.locator(".form-card").nth(1);
await downtimeForm.locator('input[type="time"]').nth(0).fill("09:00");
await downtimeForm.locator('input[type="time"]').nth(1).fill("09:45");
await downtimeForm.getByRole("button", { name: "Add downtime" }).click();
await page.waitForTimeout(1200);
console.log("event rows:", await downtimeForm.locator(".event-row").count());
console.log(
  "downtime panel contains 105 min:",
  (await page.locator(".actuals-panel").innerText()).includes("105"),
);
await page.screenshot({ path: path.join(out, "05-downtime-applied.png"), fullPage: true });

const timeStudyForm = page.locator(".form-card").nth(2);
await timeStudyForm.locator('input[type="number"]').nth(0).fill("30");
await timeStudyForm.getByRole("button", { name: "Calculate time study" }).click();
await page.waitForSelector(".time-study-result");
console.log("time study:", await timeStudyForm.locator(".time-study-result").innerText());
await page.screenshot({ path: path.join(out, "06-time-study.png"), fullPage: true });

const snapshots = page.locator(".snapshots-panel");
await snapshots.locator("input").fill("UI smoke snapshot");
await snapshots.getByRole("button", { name: "Save snapshot" }).click();
await page.waitForTimeout(300);
console.log("snapshot count:", await snapshots.locator(".snapshot-list li").count());
await page.screenshot({ path: path.join(out, "07-snapshot-saved.png"), fullPage: true });

await page.reload({ waitUntil: "networkidle" });
await page.locator(".snapshots-panel").getByRole("button", { name: "Load" }).first().click();
await page.waitForTimeout(300);
console.log("loaded snapshot:", await page.locator(".scenario-custom").innerText());
console.log("loaded actuals:", await page.locator(".actuals-panel").innerText());
await page.screenshot({ path: path.join(out, "08-snapshot-loaded.png"), fullPage: true });

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
