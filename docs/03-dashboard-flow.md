# Dashboard Flow

## Screen 1: Connect Figma And Git

Purpose: connect the external tools before the dashboard shows repo setup.

Required behavior:
- Connect Figma MCP.
- Connect GitHub/Git MCP.
- Keep repo setup locked until both tools are connected.
- Do not ask for repo selection, Figma URL, prompt, branch, or APK options on this screen.

## Screen 2: Repository Select And Setup

Purpose: choose the target GitHub repository and validate it can support the workflow.

Required behavior:
- List GitHub repositories available to the connected account/app.
- Show default branch and available branches.
- Verify `development` exists before continuing.
- Block the flow if `development` is missing.
- Show the latest job/PR state for the selected repo when available.
- Collect an OpenAI API key for the agent runtime during setup.
- Do not show the full API key after entry.
- Do not write the API key into browser logs, worker logs, PR comments, screenshots, or recordings.
- Store the key only through a backend secret/vault flow in the real implementation.
- Prepare the Snack-compatible entry before continuing.

## Screen 3: Expo Snack

Purpose: open the selected app from the repo in Expo Snack before AI creates the implementation plan.

Required behavior:
- Auto-run from the selected repo source URL after setup completes.
- Show platform tabs for Android, iOS, web, and user device where supported.
- Show repository, branch, and source file metadata.
- Provide an external "Open in Expo Snack" action.
- Keep the preview read-only.

## Screen 4: AI-Created Change Plan

Purpose: show the implementation inputs AI generated automatically.

Required behavior:
- Show one or more Figma URLs.
- Show the generated implementation prompt.
- Show the branch name that will be created.
- Show PR target `development`.
- Validate each Figma URL has a file key and node ID.
- Let the user start code changes only after the generated plan is visible.

## Screen 5: Job Progress

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

## Screen 6: Changed UI Evidence

Purpose: let users review the completed UI change in Snack before build approval.

Required behavior:
- Show the refreshed Snack preview after implementation.
- Show the changed UI screenshot beside Snack.
- Label each preview with route/screen name, commit SHA, and capture time.
- Show MP4 recording evidence.
- If Snack cannot run, show the latest Maestro or worker-captured screenshot with a clear fallback state.

## Screen 7: Build Approval

Purpose: explicitly approve Android APK generation.

Required behavior:
- User chooses `stage` or `prod`.
- Explain mapping: stage -> EAS `preview`, prod -> EAS `production`.
- Confirm APK only and no store submission.
- Record approver, timestamp, selected profile, branch, PR, and commit SHA.
- Start build only after approval.

## Screen 8: Build Result

Purpose: expose the final artifact.

Required behavior:
- Show APK download URL.
- Show the build result screen artifact.
- Show the build recording artifact.
- Show build profile and EAS build link/logs.
- Show PR, branch, commit SHA, and job ID.
- Allow copying release summary.
