---
name: apk-approval-build-workflow
description: Use only after PR validation and Maestro evidence are complete to request explicit user approval and generate an Android APK for stage or prod without store submission.
---

# APK Approval Build Workflow

## Approval Gate

Never generate an APK before explicit user approval. Approval must include:
- job ID
- approver
- timestamp
- branch
- PR number
- commit SHA
- selected profile: `stage` or `prod`

## Profile Mapping

```text
stage -> EAS preview
prod  -> EAS production
```

## APK Only Rules

- Generate Android APK only.
- Do not submit to Google Play.
- Do not run iOS or TestFlight builds.
- Do not run store submission commands.

## Pre-Build Checks

Before running EAS:
- Verify `eas.json` exists.
- Verify the selected EAS profile exists.
- Verify the selected Android profile produces APK output.
- Verify the build uses the approved branch and commit.
- Verify EAS authentication is available.

## Build Result

Report:
- APK URL
- EAS build URL or ID
- selected profile
- branch
- commit SHA
- PR URL
- build status/log link
