# Implementation Checklist

## Delivery Order

- [ ] Plan 1 first: OpenAI runtime connection, Figma input, repo selection, branch/PR to `development`, Maestro evidence, approval, and APK build.
- [ ] Plan 2 second: terminal-free website control room, one-screen-at-a-time workflow, and Expo Snack live previews.

## Phase 1: Repository And Docs

- [ ] Create dashboard monorepo.
- [ ] Add `apps/web`, `apps/worker`, `packages/shared`, and `infra` folders.
- [ ] Add shared TypeScript types for jobs, artifacts, Maestro, PRs, and builds.
- [ ] Add environment documentation for GitHub, Figma, EAS, queue, and storage credentials.

## Phase 2: Dashboard UI

- [ ] Use Bootstrap component styles for standard controls such as buttons, selects, textareas, badges, segmented controls, and radio choices.
- [ ] Use progressive disclosure: show only the current workflow screen and keep future screens locked until available.
- [ ] Build authentication shell.
- [ ] Build OpenAI API key connection screen; backend stores the key in encrypted server-side secret storage and never logs it.
- [ ] Build repo selector.
- [ ] Verify `development` exists before allowing job creation.
- [ ] Build Figma URL input with multiple URL support.
- [ ] Build job progress timeline.
- [ ] Build a terminal-free job activity view with readable events and advanced raw logs.
- [ ] Build live UI preview panel for changed screens while implementation is running.
- [ ] Build Expo Snack platform tabs for Android, iOS, web, and device QR when supported.
- [ ] Build evidence review screen with the changed UI screenshot and MP4 video recording visible before approval.
- [ ] Build approval UI for `stage` and `prod`.
- [ ] Build final APK result screen with APK artifact, build result screen, and build recording visible after generation.

## Phase 3: Worker

- [ ] Implement job queue consumer.
- [ ] Add isolated workspace creation per job.
- [ ] Add GitHub MCP repo validation.
- [ ] Add branch name generation and validation.
- [ ] Add Figma URL parsing.
- [ ] Add Figma MCP fetch sequence.
- [ ] Add agent execution wrapper.
- [ ] Add validation command runner.
- [ ] Add preview capture checkpoints during implementation.
- [ ] Add Expo Snack preview entry generation from the selected repo branch.
- [ ] Add fallback capture from Maestro screenshots when Snack cannot run the repo.
- [ ] Add PR creation/update logic.

## Phase 4: Expo Snack Live Preview

- [ ] Define supported Snack platforms: Android, iOS, web, and device QR.
- [ ] Store preview metadata with repo, branch, source URL, commit SHA, and refresh time.
- [ ] Refresh website previews after meaningful worker checkpoints.
- [ ] Add fallback from live preview to latest Maestro screenshot when preview startup fails.
- [ ] Ensure users can review UI without opening a terminal, IDE, emulator, or simulator.

## Phase 5: Maestro Evidence

- [ ] Add Maestro installation/runtime checks.
- [ ] Generate or update `.maestro/<feature>.yaml`.
- [ ] Run Android app flow.
- [ ] Capture screenshots.
- [ ] Record MP4 video.
- [ ] Upload artifacts.
- [ ] Comment evidence links on PR.

## Phase 6: APK Build

- [ ] Add approval endpoint.
- [ ] Enforce approval gate.
- [ ] Map stage to EAS `preview`.
- [ ] Map prod to EAS `production`.
- [ ] Validate selected profile produces APK.
- [ ] Run EAS build from approved commit.
- [ ] Capture APK URL and logs.
- [ ] Comment build result on PR.

## Phase 7: Validation

- [ ] Unit test branch name normalization.
- [ ] Unit test Figma URL parsing.
- [ ] Unit test job state transitions.
- [ ] Integration test PR creation to `development`.
- [ ] Integration test approval rejection before Maestro pass.
- [ ] Integration test Snack preview URL generation from selected repo and generated branch.
- [ ] End-to-end test sample Figma-to-PR-to-APK job.

## Done Criteria

- [ ] User can create a job from Figma URLs and a selected GitHub repo.
- [ ] The PR always targets `development`.
- [ ] Users can inspect implementation progress and changed UI in the website without terminal or IDE access.
- [ ] Display-size previews are available before approval, or a clear fallback is shown.
- [ ] Evidence includes screenshots and video.
- [ ] APK generation is blocked until approval.
- [ ] Stage/prod builds produce APKs only.
