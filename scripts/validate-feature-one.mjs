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
for (const phrase of [
  "OpenAI API key",
  "Connect OpenAI agent",
  "Connect Figma MCP",
  "Connect Git repository",
  "Run repo setup",
  "Open the app in Expo Snack",
  "Generate AI change plan",
  "data-step-panel=\"connect\"",
  "data-step-panel=\"setup\"",
  "data-step-panel=\"snack\"",
  "data-step-panel=\"plan\"",
  "data-step-panel=\"evidence\"",
  "Figma frame URLs",
  "Expo Snack live preview",
  "Auto-run from repo",
  "Changed UI screenshot",
  "Flow recording",
  "APK approval",
  "Build recording",
  "vendor/bootstrap/css/bootstrap.min.css",
  "form-select",
  "form-control",
  "btn-check",
]) {
  if (!html.includes(phrase)) failures.push(`UI missing phrase: ${phrase}`);
}

const app = readFileSync(join(root, "apps/web/src/app.js"), "utf8");
if (!app.includes("createIcons")) failures.push("UI must initialize Lucide icons.");
if (!html.includes("vendor/bootstrap")) failures.push("UI must use the Bootstrap component library.");
if (!app.includes("isConnectReady")) failures.push("UI must connect Figma MCP and GitHub/Git MCP before setup.");
if (!app.includes("openAiConnected")) failures.push("UI must connect the OpenAI API key during setup.");
if (!html.includes("stage-viewport")) failures.push("UI must render a one-screen-at-a-time step flow.");
if (!app.includes("generateAiPlan")) failures.push("UI must auto-generate the Figma URL, prompt, and branch plan.");
if (!app.includes("evidenceArtifacts")) failures.push("UI must expose screenshot and video evidence artifacts.");
if (!app.includes("buildArtifacts")) failures.push("UI must expose generated build artifacts.");
if (!app.includes("https://snack.expo.dev/")) failures.push("UI must build Expo Snack preview URLs.");
if (!app.includes("sourceUrl")) failures.push("Snack preview must run from a repo source URL.");

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
if (!docs.includes("OpenAI API key")) failures.push("README must mention the OpenAI API key runtime gate.");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Feature One validation passed.");
