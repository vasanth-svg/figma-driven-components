export const repositories = [
  {
    id: "rovia-frontend-mobile",
    fullName: "rovia/frontend-mobile",
    description: "Expo mobile app with project-local agent skills.",
    defaultBranch: "main",
    branches: ["main", "development", "staging"],
    githubAccess: true,
    hasAgentInstructions: true,
    snack: {
      entryFile: ".dashboard/snack/App.tsx",
      sdkVersion: "",
      dependencies: "expo-router,react-native-safe-area-context,react-native-screens",
      note: "Worker exports a Snack-compatible entry from the mobile repo after implementation.",
    },
  },
  {
    id: "rovia-invest-web",
    fullName: "rovia/invest-web",
    description: "Web app candidate for later preview support.",
    defaultBranch: "main",
    branches: ["main", "development"],
    githubAccess: true,
    hasAgentInstructions: false,
    snack: {
      entryFile: "App.tsx",
      sdkVersion: "",
      dependencies: "expo",
      note: "Repo can use a lightweight Snack entry for preview.",
    },
  },
  {
    id: "partner-mobile",
    fullName: "partner/mobile-app",
    description: "Example blocked repo without the required base branch.",
    defaultBranch: "main",
    branches: ["main", "release"],
    githubAccess: true,
    hasAgentInstructions: false,
    snack: {
      entryFile: ".dashboard/snack/App.tsx",
      sdkVersion: "",
      dependencies: "expo",
      note: "Blocked until the required development branch exists.",
    },
  },
];

export const jobSteps = [
  {
    id: "queued",
    label: "Queued",
    description: "Job accepted by the dashboard.",
  },
  {
    id: "validating_repo",
    label: "Validate repo",
    description: "GitHub access, development branch, and repo instructions.",
  },
  {
    id: "fetching_figma",
    label: "Fetch Figma",
    description: "Design context, screenshots, metadata fallback, and assets.",
  },
  {
    id: "implementing",
    label: "Implement",
    description: "Worker-owned code changes on the generated branch.",
  },
  {
    id: "validating_code",
    label: "Validate code",
    description: "Repo checks such as lint, typecheck, and build commands.",
  },
  {
    id: "creating_pr",
    label: "Create PR",
    description: "Draft PR from figma branch into development.",
  },
  {
    id: "testing_flow",
    label: "Maestro evidence",
    description: "Android screenshots and flow recording.",
  },
  {
    id: "awaiting_review",
    label: "Await review",
    description: "User can approve stage or prod APK generation.",
  },
  {
    id: "building",
    label: "Build APK",
    description: "EAS preview or production profile after approval.",
  },
  {
    id: "complete",
    label: "Complete",
    description: "APK artifact is ready.",
  },
];

export const snackPlatforms = [
  { id: "android", label: "Android", icon: "smartphone" },
  { id: "ios", label: "iOS", icon: "smartphone" },
  { id: "web", label: "Web", icon: "monitor" },
  { id: "mydevice", label: "My device", icon: "qr-code" },
];

export function parseFigmaUrls(rawValue) {
  const lines = rawValue
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { ok: false, error: "Add at least one Figma node URL." };
  }

  const urls = [];

  for (const line of lines) {
    let parsed;
    try {
      parsed = new URL(line);
    } catch {
      return { ok: false, error: `Invalid URL: ${line}` };
    }

    if (!parsed.hostname.includes("figma.com")) {
      return { ok: false, error: `Only figma.com URLs are supported: ${line}` };
    }

    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const fileKey = pathParts[1];
    const nodeId = parsed.searchParams.get("node-id");

    if (!fileKey || !nodeId) {
      return { ok: false, error: "Each Figma design URL must include a file key and node-id." };
    }

    urls.push({
      url: line,
      fileKey,
      nodeId: nodeId.replaceAll("-", ":"),
    });
  }

  return { ok: true, urls };
}

export function buildBranchName(jobId, prompt) {
  const slug = normalizeSlug(prompt || "design-update");
  return `figma/${normalizeSlug(jobId)}-${slug}`.slice(0, 66).replace(/-+$/g, "");
}

export function normalizeSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
