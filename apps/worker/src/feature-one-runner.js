import { buildBranchName, parseFigmaUrls } from "../../../packages/shared/src/contracts.js";

export function planFeatureOneJob({ repositoryFullName, figmaUrls, prompt, jobId }) {
  const parsed = parseFigmaUrls(figmaUrls.join("\n"));
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  return {
    ok: true,
    job: {
      id: jobId,
      repositoryFullName,
      baseBranch: "development",
      branchName: buildBranchName(jobId, prompt),
      figmaInputs: parsed.urls,
      requiredAdapters: ["github-mcp", "figma-mcp", "maestro", "eas"],
      approvalGate: "apk-build",
    },
  };
}
