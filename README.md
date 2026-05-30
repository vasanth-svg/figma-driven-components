# Figma-To-APK Release Dashboard

Feature One is a runnable dashboard scaffold for the core workflow:

1. Connect Figma MCP and GitHub/Git MCP first.
2. Select a GitHub repository and run repo/agent setup, including the required `development` branch check.
3. Open the selected app in Expo Snack from the repo source.
4. Let AI create the Figma URL, prompt, branch name, and PR target plan.
5. Track readable job progress without exposing terminal or IDE access.
6. Review the changed UI screenshot inside the Snack/evidence step.
7. Approve a stage/prod Android APK build only after checks pass.
8. Review APK, build screen, and build recording artifacts after generation.

This first version uses local mock adapters so the product can be reviewed immediately. The next pass should replace the mock adapters with OpenAI API orchestration, GitHub MCP, Figma MCP, Maestro, and EAS worker integrations.

The real implementation should ask for Figma/Git connections first. The OpenAI API key belongs in the repo setup step and should never appear in browser logs or worker events. Send it to the backend over TLS, store it server-side in an encrypted vault or environment secret, and pass only scoped runtime access to the worker.

UI controls should use Bootstrap component styles for standard elements such as buttons, selects, textareas, badges, segmented controls, and radio choices. Avoid hand-building common controls unless the component library cannot cover the interaction.

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

This is the foundation product flow. It does not perform real repository mutation, PR creation, Maestro execution, or APK builds yet. It models the step-by-step UI, connection gates, evidence states, and approval gates so the real integrations can be added behind stable contracts.
