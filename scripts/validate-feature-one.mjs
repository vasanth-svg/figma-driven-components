import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildBranchName, parseFigmaUrls } from "../packages/shared/src/contracts.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const requiredFiles = [
  "README.md",
  "apps/web/index.html",
  "apps/web/src/app.js",
  "apps/web/src/contracts.js",
  "apps/web/src/styles.css",
  "apps/worker/src/feature-one-runner.js",
  "packages/shared/src/contracts.js",
  "infra/README.md",
];

const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    failures.push(`Missing ${file}`);
  }
}

const html = readFileSync(join(root, "apps/web/index.html"), "utf8");
for (const phrase of ["Repository", "Figma URLs", "UI Preview", "Maestro evidence", "APK approval gate"]) {
  if (!html.includes(phrase)) failures.push(`UI missing phrase: ${phrase}`);
}

const parsed = parseFigmaUrls("https://figma.com/design/FgMA1234/Rovia-Mobile?node-id=104-22");
if (!parsed.ok || parsed.urls[0].nodeId !== "104:22") {
  failures.push("Figma URL parser did not extract expected node ID.");
}

const branchName = buildBranchName("job-1234", "RSU Insight Card Refresh!");
if (!branchName.startsWith("figma/job-1234-rsu-insight-card-refresh")) {
  failures.push(`Unexpected branch name: ${branchName}`);
}

const docs = readFileSync(join(root, "README.md"), "utf8");
if (!docs.includes("development")) failures.push("README must mention development branch rule.");
if (!docs.includes("APK")) failures.push("README must mention APK approval flow.");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Feature One validation passed.");
