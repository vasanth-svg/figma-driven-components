# API Contracts

## Shared Enums

```ts
export type JobStatus =
  | "queued"
  | "validating_repo"
  | "fetching_figma"
  | "implementing"
  | "validating_code"
  | "creating_pr"
  | "testing_flow"
  | "awaiting_review"
  | "building"
  | "complete"
  | "failed";

export type BuildChoice = "stage" | "prod";
export type EasProfile = "preview" | "production";
export type ArtifactKind = "figma_screenshot" | "maestro_screenshot" | "maestro_video" | "log" | "apk";
```

## Create Job

`POST /api/jobs`

```ts
export type CreateJobRequest = {
  repoId: string;
  repositoryFullName: string;
  figmaUrls: string[];
  prompt: string;
  targetPlatform: "android";
};

export type CreateJobResponse = {
  jobId: string;
  status: JobStatus;
};
```

## Get Job

`GET /api/jobs/:jobId`

```ts
export type ReleaseJob = {
  id: string;
  status: JobStatus;
  repositoryFullName: string;
  baseBranch: "development";
  branchName?: string;
  pr?: PullRequestRef;
  figmaInputs: FigmaInput[];
  artifacts: Artifact[];
  validation?: ValidationResult;
  maestro?: MaestroResult;
  build?: BuildResult;
  createdAt: string;
  updatedAt: string;
};
```

## Approve Build

`POST /api/jobs/:jobId/approve-build`

```ts
export type ApproveBuildRequest = {
  choice: BuildChoice;
  approvedBy: string;
};

export type ApproveBuildResponse = {
  jobId: string;
  status: "building";
  easProfile: EasProfile;
};
```

## Core Types

```ts
export type FigmaInput = {
  url: string;
  fileKey: string;
  nodeId: string;
  screenshotArtifactId?: string;
};

export type PullRequestRef = {
  repositoryFullName: string;
  number: number;
  url: string;
  title: string;
  baseBranch: "development";
  headBranch: string;
  draft: boolean;
};

export type Artifact = {
  id: string;
  kind: ArtifactKind;
  name: string;
  url: string;
  contentType?: string;
  sizeBytes?: number;
  createdAt: string;
};

export type ValidationResult = {
  commands: Array<{
    command: string;
    exitCode: number;
    summary: string;
    logArtifactId?: string;
  }>;
  passed: boolean;
};

export type MaestroResult = {
  testFilePath: string;
  passed: boolean;
  screenshots: string[];
  videoArtifactId?: string;
  failedStep?: string;
  expected?: string;
  actual?: string;
};

export type BuildResult = {
  choice: BuildChoice;
  easProfile: EasProfile;
  apkArtifactId?: string;
  easBuildUrl?: string;
  commitSha: string;
  status: "queued" | "running" | "complete" | "failed";
  logArtifactId?: string;
};
```

## Webhooks

### GitHub

`POST /api/webhooks/github`

Use for PR status updates, branch deletion notices, and check status correlation.

### EAS

`POST /api/webhooks/eas`

Use for build status changes and final APK artifact discovery.

## Invariants

- `baseBranch` is always `development`.
- `ApproveBuildRequest` is rejected unless job status is `awaiting_review`.
- `ApproveBuildRequest` is rejected if Maestro did not pass.
- `prod` maps to `production`; `stage` maps to `preview`.
