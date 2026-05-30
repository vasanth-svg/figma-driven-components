# APK Build Approval Rules

## Trigger

Use these rules only after implementation, PR creation, validation, and Maestro evidence are complete.

## Approval Gate

- Never generate an APK before explicit user approval.
- Approval must include the selected profile: `stage` or `prod`.
- Record approver, timestamp, job ID, branch, PR number, commit SHA, and selected profile.

## Profile Mapping

```text
stage -> EAS preview
prod  -> EAS production
```

## APK Only

- Generate Android APK only in v1.
- Do not submit to Google Play.
- Do not generate iOS/TestFlight builds.
- Do not run store submission commands.

## EAS Requirements

Before build:
- Verify `eas.json` exists.
- Verify selected profile exists.
- Verify the Android profile produces APK output, such as `android.buildType: "apk"`.
- Verify EAS authentication is available to the worker.
- Verify the build runs from the approved branch/commit.

## Build Result

Store and display:
- APK URL.
- EAS build URL or build ID.
- Build profile.
- Branch.
- Commit SHA.
- PR URL.
- Logs/status.

## Failure Handling

If build fails:
- Keep job in `failed` or `build_failed` state.
- Attach logs.
- Do not retry automatically if failure may be caused by code, credentials, quota, or native build configuration.
- Allow user to rerun only after a new approval or explicit retry action.
