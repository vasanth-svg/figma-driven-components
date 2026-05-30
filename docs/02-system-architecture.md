# System Architecture

## Overview

Build the dashboard as a separate monorepo so long-running automation, secrets, GitHub integration, emulator control, Maestro, and EAS builds are isolated from the mobile app codebase.

The live-preview requirement is feasible when implemented as controlled worker-owned previews. The website should show one focused workflow screen at a time, structured events, an Expo Snack live preview, recordings, logs, diffs, and approvals, but it should not expose an interactive terminal or IDE in v1.

```text
apps/web        Next.js dashboard, auth, API routes, job review UI
apps/worker     Node worker for repo clone, agent runs, Maestro, and EAS
packages/shared Shared TypeScript types, Zod schemas, status constants
infra/          Deployment, queue, storage, and environment setup
```

## Main Components

### Web App

- Provides repo selection, Figma URL input, job status, evidence review, and build approval.
- Collects an OpenAI API key through a backend secret flow before enabling the agent runtime.
- Calls backend APIs for job creation and approval.
- Displays PR URL, logs, screenshots, video, and APK artifact links.
- Displays an Expo Snack live preview from the selected repo branch so users do not need to open an IDE, terminal, emulator, or simulator.
- Presents technical logs as summarized, readable job events by default, with raw logs available behind an advanced/details view.
- Never exposes OpenAI, GitHub, Figma, EAS, or storage credentials to the browser.

### Worker

- Pulls jobs from the queue.
- Receives scoped agent runtime access after the backend validates the OpenAI key.
- Resolves selected repo and validates `development`.
- Clones the repo into an isolated workspace.
- Reads repo instructions such as `AGENTS.md`, `.agents/skills/*/SKILL.md`, and `README.md`.
- Runs the implementation agent.
- Runs validation commands, Maestro, and EAS builds.
- Publishes a Snack-compatible preview entry while implementation is in progress.
- Refreshes the Snack preview for the generated branch before requesting user approval.
- Uploads artifacts and writes job status updates.
- Uploads the APK artifact, build result screen, and build recording after approval-gated generation.

### Expo Snack Preview Service

- Provides website-visible UI previews without exposing the worker shell or editor.
- For Expo repos, writes a Snack-compatible entry file or artifact from the generated branch.
- Feeds Expo Snack with a repo-derived `sourceUrl` so the preview can run inside the website.
- Stores preview metadata with the job state, source URL, branch, and commit SHA.
- Degrades gracefully to Maestro screenshots when Snack cannot run a private repo or unsupported native dependency.

Feasibility constraints:
- Snack works best with Expo-compatible JavaScript and public or worker-published source URLs.
- Private repos need the worker to publish a temporary Snack entry artifact instead of exposing credentials in the browser.
- Native modules unsupported by Expo Snack still require Maestro/emulator evidence.
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
- OpenAI API: agent reasoning and code-change orchestration through server-side runtime access.
- GitHub MCP: repo metadata, file fetches, branch search, branch creation, PR creation, PR comments, PR updates.
- Local `git`: checkout, branch switching, diff, commit, push from a cloned workspace.
- Maestro: Android UI flow validation, screenshot capture, video recording.
- EAS: Android APK generation using selected profile.
- Expo Snack preview: website-visible live preview from a public or worker-published Snack-compatible repo entry file.

## Data Flow

1. Web app connects the OpenAI runtime through backend secret storage.
2. Web app creates a `ReleaseJob` with repo, Figma URLs, and prompt.
3. Worker validates repo and base branch.
4. Worker creates branch and runs implementation.
5. Worker pushes branch and creates draft PR to `development`.
6. Worker publishes a Snack-compatible preview entry and refreshes the Expo Snack embed URL for the changed UI.
7. Worker runs Maestro and uploads screenshot/video evidence.
8. Web app marks job `awaiting_review`.
9. User approves stage/prod APK.
10. Worker runs EAS APK build and uploads APK, build screen, and build recording.
11. Web app marks job `complete` or `failed`.

## Security

- Store OpenAI keys, OAuth tokens, and EAS tokens encrypted.
- Scope GitHub access to selected repositories.
- Redact secrets from logs before storing or posting PR comments.
- Run worker jobs in isolated, disposable workspaces.
- Do not let user-provided prompts choose arbitrary shell commands for release steps.
- Do not expose interactive terminal or IDE sessions in the website; show controlled job events, previews, artifacts, and approval controls instead.
