# Figma-To-APK Release Dashboard Docs

## Goal

Create an internal dashboard that connects an OpenAI-powered agent runtime, accepts one or more Figma design URLs and a selected GitHub repository, ships the requested mobile changes through a disciplined agent workflow, verifies the flow with Maestro evidence, waits for user approval, and then generates an Android APK for stage or prod.

## V1 Scope

- Separate dashboard, not an Expo route inside the mobile app.
- OpenAI API key is collected through the website and stored only in backend encrypted secret storage.
- GitHub repositories only.
- Figma MCP for design context, screenshots, metadata fallback, and asset discovery.
- GitHub MCP for repository and PR metadata, branch creation where appropriate, PR creation, comments, and PR updates.
- Local `git` only inside cloned workspaces for status, diff, checkout, commit, and push.
- Maestro Android flow validation with screenshots and video recording.
- Approval-gated APK generation only; no Play Store submission in v1.
- PRs always target `development`.

## How To Use These Docs

Read the docs in order for the full product and engineering plan. The `skills/` folder contains draft project-local agent skills that can be copied into a repository `.agents/skills/` directory when the dashboard workflow is implemented.

## Core Flow

1. User adds the OpenAI API key for the agent runtime.
2. User connects Figma MCP and GitHub/Git MCP.
3. User selects a GitHub repo.
4. User submits one or more Figma URLs and implementation instructions.
5. Worker verifies the repo, reads repo instructions, validates `development`, and creates a valid feature branch.
6. Agent fetches Figma context and implements changes in the selected repo.
7. Agent runs lint/typecheck and creates or updates a draft PR to `development`.
8. Agent creates/runs Maestro tests, captures the changed UI screenshot and MP4 video, and attaches evidence.
9. User reviews evidence and approves stage or prod APK generation.
10. Worker generates the APK and attaches the APK, build screen, and build recording artifacts.

## Delivery Sequence

Plan 1 is the foundation: OpenAI runtime connection, Figma URLs, repo selection, GitHub PR to `development`, Maestro evidence, approval, and APK build.

Plan 2 adds the website control-room layer: no terminal or IDE exposure for users, one focused screen at a time, live/read-only UI previews during work, and evidence previews before approval.

## Feasibility Note

This is possible. The safest v1 approach is not to expose an interactive terminal or web IDE. Instead, the worker runs code, app servers, emulators, and capture tools in isolated environments, then streams structured job events and preview artifacts back to the website. Web-capable repos can use browser viewport captures; native mobile repos can use Android emulator screenshots and Maestro recordings. If live preview fails, the dashboard should fall back to latest captured screenshots and clearly show the preview limitation.

## Non-Negotiable Rules

- Never create a PR to `main` or `master` in this workflow.
- Never create a branch before verifying `development` exists.
- Never expose raw OpenAI API keys in the browser after connection, worker logs, PR comments, screenshots, or recordings.
- Never implement from a Figma screenshot alone when Figma MCP design context is available.
- Never generate an APK before explicit user approval.
- Never submit to app stores in v1.
