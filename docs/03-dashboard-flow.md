# Dashboard Flow

## Screen 1: Repository Select

Purpose: choose the target GitHub repository and validate it can support the workflow.

Required behavior:
- List GitHub repositories available to the connected account/app.
- Show default branch and available branches.
- Verify `development` exists before continuing.
- Block the flow if `development` is missing.
- Show the latest job/PR state for the selected repo when available.

## Screen 2: Figma And Instructions

Purpose: collect implementation input.

Required behavior:
- Accept multiple Figma URLs.
- Validate each URL has a Figma file key and node ID when it is a design URL.
- Let the user add plain-language implementation instructions.
- Require at least one Figma URL and one selected repo.
- Create a job when submitted.

## Screen 3: Job Progress

Purpose: show live implementation status.

States:
- `queued`: job accepted.
- `validating_repo`: checking GitHub repo, branch, and instructions.
- `fetching_figma`: calling Figma MCP for context and screenshots.
- `implementing`: agent is editing the selected repo.
- `validating_code`: lint/typecheck/build checks are running.
- `creating_pr`: branch push and PR creation.
- `testing_flow`: Maestro test and recording.
- `awaiting_review`: PR and evidence are ready.
- `building`: APK generation is running.
- `complete`: APK artifact is available.
- `failed`: job failed with logs and recovery notes.

Required behavior:
- Show readable job events instead of an exposed terminal.
- Show current branch, active step, latest commit/checkpoint, and summarized agent activity.
- Show raw logs only in an advanced/details panel.
- Do not expose an IDE or terminal for manual editing in v1.

## Screen 4: Live UI Preview

Purpose: let users see the changing UI in the website while the worker is implementing and validating.

Required behavior:
- Show the latest preview snapshot for the changed screen or flow.
- Show display-size tabs for compact phone, large phone, tablet, and desktop/web where supported.
- Label each preview with route/screen name, display size, commit SHA, and capture time.
- Refresh previews automatically when the worker reaches meaningful checkpoints.
- If live preview cannot run, show the latest Maestro or worker-captured screenshot with a clear fallback state.
- Keep previews read-only; users approve, reject, or comment from the dashboard rather than editing code directly.

## Screen 5: Evidence Review

Purpose: let the user review output before build.

Required behavior:
- Show PR link and current branch.
- Show implementation summary.
- Show validation command results.
- Show the Expo Snack live preview from the generated repo branch or preview artifact.
- Show Maestro test status.
- Show screenshots and video recording.
- Disable build approval if Maestro failed or required checks failed.

## Screen 6: Build Approval

Purpose: explicitly approve Android APK generation.

Required behavior:
- User chooses `stage` or `prod`.
- Explain mapping: stage -> EAS `preview`, prod -> EAS `production`.
- Confirm APK only and no store submission.
- Record approver, timestamp, selected profile, branch, PR, and commit SHA.
- Start build only after approval.

## Screen 7: Build Result

Purpose: expose the final artifact.

Required behavior:
- Show APK download URL.
- Show build profile and EAS build link/logs.
- Show PR, branch, commit SHA, and job ID.
- Allow copying release summary.
