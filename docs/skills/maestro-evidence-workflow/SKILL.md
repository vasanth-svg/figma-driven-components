---
name: maestro-evidence-workflow
description: Use after mobile UI implementation to create or run Maestro tests, capture screenshots, record video evidence, and block APK approval when the tested flow fails.
---

# Maestro Evidence Workflow

## Required Workflow

1. Add or update `.maestro/<feature-slug>.yaml`.
2. Run the changed flow on Android.
3. Capture screenshots for entry, changed screen, important interaction states, and final state.
4. Record a video of the full flow.
5. Upload screenshots, video, and logs as job artifacts.
6. Add artifact links to the PR or job summary.

## Passing Criteria

The flow passes only when:
- Maestro YAML completes successfully.
- The changed UI is visible in evidence.
- Required screenshots exist.
- Video recording exists and is playable.

## Failure Rules

If Maestro fails:
- Do not request build approval.
- Keep the PR as draft.
- Attach failure screenshot and logs.
- Report failed step, expected result, actual result, and likely cause.
