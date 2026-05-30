# Product Spec

## Product

An internal Figma-to-APK release dashboard for mobile teams. The dashboard coordinates design ingestion, repository changes, PR review, automated mobile UI evidence, and approval-gated Android APK generation.

## Primary User Journey

1. User opens the dashboard and signs in.
2. User selects a GitHub repository and base branch context.
3. Dashboard verifies the repository supports the workflow and that `development` exists.
4. User pastes one or more Figma URLs, each pointing to a specific frame/node.
5. User adds implementation instructions in chat-style text.
6. Dashboard creates a release job and shows live progress.
7. Worker creates a valid branch from `development` and runs the agent.
8. Dashboard shows live implementation progress and UI previews without exposing terminal or IDE access.
9. Agent implements changes, validates them, and creates a draft PR to `development`.
10. Agent runs Maestro, captures screenshots and video, and posts evidence.
11. User reviews the PR, Expo Snack live preview, and Maestro evidence in the dashboard.
12. User chooses `stage` or `prod` and explicitly approves APK generation.
13. Worker builds an APK and publishes the artifact link in the dashboard and PR.

## Personas

- Product/design owner: submits Figma URLs and approves visual output.
- Mobile engineer: reviews PRs, test evidence, and build logs.
- Release owner: approves stage/prod APK generation.

## V1 Requirements

- Support multiple Figma URLs per job.
- Support one selected GitHub repo per job.
- Create a branch using a valid deterministic name.
- Open a draft PR against `development` every time.
- Run repo-specific checks before requesting approval.
- Run Maestro using a committed or generated `.maestro/<feature>.yaml` test file.
- Save screenshots and a video recording as job artifacts.
- Build Android APK only after user approval.
- Hide terminal and IDE details from product/developer users; expose readable progress, diffs, preview screenshots, logs, and approvals in the website.
- Show UI previews in the website while changes are being made by auto-running an Expo Snack preview from a repo-generated Snack entry file.

## Out Of Scope For V1

- iOS/TestFlight builds.
- Play Store submission.
- Automatic merge to `development`.
- Non-GitHub repository providers.
- Direct pushes to protected branches.
- Store credential management UI beyond EAS token configuration.
- Full browser-based IDE or terminal for editing code; v1 is dashboard-controlled, worker-executed automation.

## Success Criteria

- A user can submit Figma URLs and a repo without knowing repo internals.
- Every implementation job leaves a reviewable PR against `development`.
- Every completed job has screenshots, video, and a test verdict.
- Users can inspect the changed UI inside the website without opening a local IDE, terminal, emulator, or simulator.
- Expo Snack preview shows the changed UI before APK approval, with fallback to Maestro screenshots when Snack cannot run the repo.
- APK builds cannot start until the user approves a profile.
- Stage/prod APK choices map predictably to EAS profiles.
