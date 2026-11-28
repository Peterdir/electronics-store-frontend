/* Runs all verify-*.cjs tests with V8 coverage and generates coverage/index.html + coverage-summary.json. */
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawnSync } = require("node:child_process");
const { fileURLToPath } = require("node:url");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "src");
const scriptsDir = path.join(root, "scripts");
const preloadPath = path.join(scriptsDir, "coverage-preload.cjs").replace(/\\/g, "/");
const outDir = path.join(root, "coverage");
const minCorePct = Number(process.env.COVERAGE_MIN_CORE ?? 70);

const tmpCovDir = fs.mkdtempSync(path.join(os.tmpdir(), "fe-v8-cov-"));

const testScripts = fs.readdirSync(scriptsDir)
  .filter((name) => name.startsWith("verify-") && name.endsWith(".cjs"))
  .sort()
  .map((name) => path.join("scripts", name));

const existingNodeOptions = process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : "";
const testResult = spawnSync(process.execPath, ["--test", ...testScripts], {
  cwd: root,
  env: {
    ...process.env,
    NODE_V8_COVERAGE: tmpCovDir,
    NODE_OPTIONS: `${existingNodeOptions}--require=${preloadPath}`,
  },
  stdio: "inherit",
});

function transpile(raw) {
  return ts.transpileModule(raw, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2023,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
}

const fileCoverage = new Map();
for (const fileName of fs.readdirSync(tmpCovDir)) {
  if (!fileName.endsWith(".json")) continue;
  const payload = JSON.parse(fs.readFileSync(path.join(tmpCovDir, fileName), "utf8"));
  for (const script of payload.result || []) {
    if (!script.url || !script.url.startsWith("file:///")) continue;
    let abs;
    try {
      abs = path.resolve(fileURLToPath(script.url));
    } catch {
      continue;
    }
    if (!abs.startsWith(srcDir) || !/\.tsx?$/.test(abs)) continue;

    let maxEnd = 0;
    for (const fn of script.functions || []) {
      for (const range of fn.ranges || []) {
        if (range.endOffset > maxEnd) maxEnd = range.endOffset;
      }
    }
    if (maxEnd <= 0) continue;

    const jsText = transpile(fs.readFileSync(abs, "utf8"));
    const suffixLen = `\n//# sourceURL=${script.url}\n\n}`.length;
    const prefixLen = Math.max(0, maxEnd - jsText.length - suffixLen);

    const hits = new Uint8Array(jsText.length);
    for (const fn of script.functions || []) {
      for (const range of fn.ranges || []) {
        const s = Math.max(0, range.startOffset - prefixLen);
        const e = Math.min(jsText.length, range.endOffset - prefixLen);
        const val = range.count > 0 ? 1 : 0;
        for (let i = s; i < e; i++) hits[i] = val;
      }
    }

    if (!fileCoverage.has(abs)) {
      fileCoverage.set(abs, { jsText, mergedHits: new Uint8Array(jsText.length) });
    }
    const entry = fileCoverage.get(abs);
    const len = Math.min(entry.mergedHits.length, hits.length);
    for (let i = 0; i < len; i++) {
      if (hits[i]) entry.mergedHits[i] = 1;
    }
  }
}

fs.rmSync(tmpCovDir, { recursive: true, force: true });

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith(".d.ts")) acc.push(full);
  }
  return acc;
}

function measureFile(abs) {
  const entry = fileCoverage.get(abs);
  const jsText = entry ? entry.jsText : transpile(fs.readFileSync(abs, "utf8"));
  const hits = entry ? entry.mergedHits : null;
  const lines = jsText.split("\n");
  let total = 0;
  let covered = 0;
  let offset = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    const isCode = trimmed.length > 0 &&
      !trimmed.startsWith("//") &&
      !trimmed.startsWith("/*") &&
      !trimmed.startsWith("*") &&
      trimmed !== "{" &&
      trimmed !== "}" &&
      trimmed !== "};" &&
      trimmed !== "});" &&
      trimmed !== ");" &&
      trimmed !== '"use strict";' &&
      !trimmed.startsWith("Object.defineProperty(exports");

    if (isCode) {
      total++;
      if (hits) {
        let lineHit = false;
        const end = Math.min(hits.length, offset + line.length);
        for (let i = offset; i < end; i++) {
          if (hits[i]) {
            lineHit = true;
            break;
          }
        }
        if (lineHit) covered++;
      }
    }
    offset += line.length + 1;
  }

  return {
    totalLines: total,
    coveredLines: covered,
    pct: total > 0 ? Number(((100 * covered) / total).toFixed(2)) : 100,
    executed: Boolean(entry),
  };
}

const uiComponentsPrefix = `${path.sep}components${path.sep}ui${path.sep}`;
const allFiles = walk(srcDir).filter((f) => !f.includes(uiComponentsPrefix));

const fileStats = allFiles.map((abs) => {
  const rel = path.relative(srcDir, abs).replace(/\\/g, "/");
  const metrics = measureFile(abs);
  const isCoreLogic = abs.endsWith(".ts") &&
    !rel.endsWith("/types.ts") &&
    !rel.endsWith(".types.ts") &&
    rel !== "vite-env.d.ts" &&
    !rel.endsWith("/index.ts") &&
    !rel.startsWith("shared/types/");

  const moduleName = rel.startsWith("features/admin/")
    ? `admin/${rel.split("/")[2]}`
    : rel.startsWith("features/")
      ? rel.split("/")[1]
      : rel.split("/")[0];

  return { file: rel, module: moduleName, isCoreLogic, ...metrics };
});

function aggregate(list) {
  const totalLines = list.reduce((sum, item) => sum + item.totalLines, 0);
  const coveredLines = list.reduce((sum, item) => sum + item.coveredLines, 0);
  const filesHit = list.filter((item) => item.executed).length;
  const pct = totalLines > 0 ? Number(((100 * coveredLines) / totalLines).toFixed(2)) : 0;
  return { totalLines, coveredLines, pct, filesHit, totalFiles: list.length };
}

const coreFiles = fileStats.filter((f) => f.isCoreLogic);
const uiFiles = fileStats.filter((f) => !f.isCoreLogic);
const coreModules = [...new Set(coreFiles.map((f) => f.module))].sort().map((mod) => ({
  module: mod,
  ...aggregate(coreFiles.filter((f) => f.module === mod)),
}));

const summary = {
  generatedAt: new Date().toISOString(),
  scriptsCount: testScripts.length,
  thresholdCorePct: minCorePct,
  all: aggregate(fileStats),
  core: aggregate(coreFiles),
  ui: aggregate(uiFiles),
  coreModules,
  files: fileStats,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "coverage-summary.json"), JSON.stringify(summary, null, 2), "utf8");

function badgeColor(pct) {
  if (pct >= 80) return "#16a34a";
  if (pct >= 70) return "#ca8a04";
  return "#dc2626";
}

function escapeHtml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Frontend Code Coverage Report</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 24px; color: #111827; background: #f9fafb; }
    h1 { margin: 0 0 6px; font-size: 22px; }
    .meta { color: #4b5563; margin-bottom: 20px; font-size: 14px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 24px; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; }
    .card-title { font-size: 13px; color: #6b7280; margin-bottom: 6px; }
    .card-val { font-size: 24px; font-weight: 700; }
    .card-sub { font-size: 12px; color: #6b7280; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e7eb; margin-bottom: 24px; font-size: 13px; }
    th, td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
    th { background: #f3f4f6; font-weight: 600; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .bar-wrap { width: 120px; height: 10px; background: #e5e7eb; border-radius: 999px; overflow: hidden; display: inline-block; vertical-align: middle; margin-right: 8px; }
    .bar { height: 100%; }
  </style>
</head>
<body>
  <h1>Frontend V8 Code Coverage Report</h1>
  <div class="meta">Generated: ${escapeHtml(summary.generatedAt)} | Test suites: ${summary.scriptsCount} | Threshold (Core): &ge; ${minCorePct}%</div>
  <div class="cards">
    <div class="card">
      <div class="card-title">Core Logic Modules (.ts)</div>
      <div class="card-val" style="color:${badgeColor(summary.core.pct)}">${summary.core.pct}%</div>
      <div class="card-sub">${summary.core.coveredLines} / ${summary.core.totalLines} lines | ${summary.core.filesHit}/${summary.core.totalFiles} files</div>
    </div>
    <div class="card">
      <div class="card-title">All Source (excl. shadcn ui)</div>
      <div class="card-val">${summary.all.pct}%</div>
      <div class="card-sub">${summary.all.coveredLines} / ${summary.all.totalLines} lines | ${summary.all.filesHit}/${summary.all.totalFiles} files</div>
    </div>
    <div class="card">
      <div class="card-title">UI Components &amp; Pages (.tsx)</div>
      <div class="card-val">${summary.ui.pct}%</div>
      <div class="card-sub">${summary.ui.coveredLines} / ${summary.ui.totalLines} lines | ${summary.ui.filesHit}/${summary.ui.totalFiles} files</div>
    </div>
  </div>
  <h2>Core Logic Coverage by Module</h2>
  <table>
    <thead><tr><th>Module</th><th class="num">Files Hit</th><th class="num">Covered / Total Lines</th><th>Coverage</th></tr></thead>
    <tbody>
      ${coreModules.map((m) => `<tr>
        <td>${escapeHtml(m.module)}</td>
        <td class="num">${m.filesHit} / ${m.totalFiles}</td>
        <td class="num">${m.coveredLines} / ${m.totalLines}</td>
        <td><span class="bar-wrap"><span class="bar" style="width:${Math.min(100, m.pct)}%;background:${badgeColor(m.pct)}"></span></span><strong>${m.pct}%</strong></td>
      </tr>`).join("\n      ")}
    </tbody>
  </table>
  <h2>Core Logic Files Detail</h2>
  <table>
    <thead><tr><th>File</th><th class="num">Covered / Total Lines</th><th>Coverage</th></tr></thead>
    <tbody>
      ${coreFiles.map((f) => `<tr>
        <td>${escapeHtml(f.file)}</td>
        <td class="num">${f.coveredLines} / ${f.totalLines}</td>
        <td><span class="bar-wrap"><span class="bar" style="width:${Math.min(100, f.pct)}%;background:${badgeColor(f.pct)}"></span></span>${f.pct}%</td>
      </tr>`).join("\n      ")}
    </tbody>
  </table>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");

console.log("\n=== FRONTEND COVERAGE SUMMARY ===");
console.log(`Core Logic (.ts): ${summary.core.pct}% (${summary.core.coveredLines}/${summary.core.totalLines} lines, ${summary.core.filesHit}/${summary.core.totalFiles} files)`);
console.log(`All src (excl ui): ${summary.all.pct}% (${summary.all.coveredLines}/${summary.all.totalLines} lines)`);
console.log(`UI (.tsx):         ${summary.ui.pct}% (${summary.ui.coveredLines}/${summary.ui.totalLines} lines)`);
console.log("Report written to coverage/index.html and coverage/coverage-summary.json");

if (testResult.status !== 0) {
  process.exit(testResult.status || 1);
}
if (summary.core.pct < minCorePct) {
  console.error(`ERROR: Core logic coverage ${summary.core.pct}% is below threshold ${minCorePct}%`);
  process.exit(1);
}
