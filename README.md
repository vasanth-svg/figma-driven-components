# Figma-To-APK Release Dashboard

Feature One is a runnable dashboard scaffold for the core workflow:

1. Select a GitHub repository.
2. Verify the `development` branch requirement.
3. Submit one or more Figma node URLs.
4. Create a valid `figma/<job-id>-<slug>` branch plan.
5. Track readable job progress without exposing terminal or IDE access.
6. Review responsive UI previews and Maestro evidence placeholders.
7. Approve a stage/prod Android APK build only after checks pass.

This first version uses local mock adapters so the product can be reviewed immediately. The next pass should replace the mock adapters with GitHub MCP, Figma MCP, Maestro, and EAS worker integrations.

## Run

```bash
npm run dev
```

Then open the printed local URL.

## Check

```bash
npm run check
```

## Structure

```text
apps/web/          Static dashboard UI for Feature One
apps/worker/       Worker adapter skeleton for future integrations
packages/shared/   Shared contracts and workflow constants
docs/              Product plan, architecture, workflow rules, and draft skills
infra/             Runtime/deployment notes
scripts/           Local dev and validation scripts
```

## Feature One Boundary

This is the foundation product flow. It does not perform real repository mutation, PR creation, Maestro execution, or APK builds yet. It models the rules, UI states, and approval gates so the real integrations can be added behind stable contracts.
