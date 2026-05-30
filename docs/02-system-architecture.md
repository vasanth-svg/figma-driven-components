# System Architecture

## Overview

Build the dashboard as a separate monorepo so long-running automation, secrets, GitHub integration, emulator control, Maestro, and EAS builds are isolated from the mobile app codebase.

The live-preview requirement is feasible when implemented as controlled worker-owned previews. The website should show structured events, preview snapshots, recordings, logs, diffs, and approvals, but it should not expose an interactive terminal or IDE in v1.

```text
apps/web        Next.js dashboard, auth, API routes, job review UI
apps/worker     Node worker for repo clone, agent runs, Maestro, and EAS
packages/shared Shared TypeScript types, Zod schemas, status constants
infra/          Deployment, queue, storage, and environment setup
```

## Main Components

### Web App

- Provides repo selection, Figma URL input, job status, evidence review, and build approval.
- Calls backend APIs for job creation and approval.
- Displays PR URL, logs, screenshots, video, and APK artifact links.
- Displays live UI preview snapshots and responsive display-size previews so users do not need to open an IDE, terminal, emulator, or simulator.
- Presents technical logs as summarized, readable job events by default, with raw logs available behind an advanced/details view.
- Never exposes GitHub, Figma, EAS, or storage credentials to the browser.

### Worker

- Pulls jobs from the queue.
- Resolves selected repo and validates `development`.
- Clones the repo into an isolated workspace.
- Reads repo instructions such as `AGENTS.md`, `.agents/skills/*/SKILL.md`, and `README.md`.
- Runs the implementation agent.
- Runs validation commands, Maestro, and EAS builds.
- Captures preview images while implementation is in progress by running the target app in controlled preview environments.
- Produces display-size snapshots for configured viewport/device sizes before requesting user approval.
- Uploads artifacts and writes job status updates.

### Live Preview Service

- Provides website-visible UI previews without exposing the worker shell or editor.
- For web-capable repos, starts the app in a sandbox and captures browser viewports such as 375, 430, 768, and 1440 widths.
- For native mobile repos, installs/runs the app on controlled Android emulator profiles and streams or periodically captures screenshots.
- Stores preview snapshots as artifacts and associates them with the job state, route, commit SHA, and display size.
- Degrades gracefully to Maestro screenshots only when a live preview cannot be started.

Feasibility constraints:
- True real-time native streaming is more complex than periodic screenshot refresh; start with checkpoint-based snapshots and Maestro video evidence.
- Web viewport previews are easiest when the target repo can run a web/dev server.
- Native mobile previews require managed emulator capacity and stable app install/launch automation.
- Preview output must be read-only in the website; code changes remain worker-controlled through branches and PRs.

### Queue

- Stores asynchronous work items.
- Ensures one active implementation/build job per repo branch.
- Supports retries only for infrastructure-safe steps, not arbitrary code mutations.

### Storage

- Stores Figma reference screenshots, Maestro screenshots, video recordings, logs, and APK files.
- Artifacts are linked from the job and PR comment.

### Integrations

- Figma MCP: design context, screenshots, metadata fallback, variable and asset discovery.
- GitHub MCP: repo metadata, file fetches, branch search, branch creation, PR creation, PR comments, PR updates.
- Local `git`: checkout, branch switching, diff, commit, push from a cloned workspace.
- Maestro: Android UI flow validation, screenshot capture, video recording.
- EAS: Android APK generation using selected profile.
- Browser/emulator preview capture: website-visible UI previews across configured display sizes.

## Data Flow

1. Web app creates a `ReleaseJob` with repo, Figma URLs, and prompt.
2. Worker validates repo and base branch.
3. Worker creates branch and runs implementation.
4. Worker pushes branch and creates draft PR to `development`.
5. Worker publishes preview snapshots for the changed UI and supported display sizes.
6. Worker runs Maestro and uploads evidence.
7. Web app marks job `awaiting_review`.
8. User approves stage/prod APK.
9. Worker runs EAS APK build and uploads result.
10. Web app marks job `complete` or `failed`.

## Security

- Store OAuth tokens and EAS tokens encrypted.
- Scope GitHub access to selected repositories.
- Redact secrets from logs before storing or posting PR comments.
- Run worker jobs in isolated, disposable workspaces.
- Do not let user-provided prompts choose arbitrary shell commands for release steps.
- Do not expose interactive terminal or IDE sessions in the website; show controlled job events, previews, artifacts, and approval controls instead.
