# Maestro Evidence Rules

## Trigger

Use these rules after implementation and before build approval for any mobile UI change.

## Test File

- Store the test at `.maestro/<feature-slug>.yaml` in the target repo.
- The test must exercise the changed flow or the closest reachable path.
- Use stable text, IDs, and navigation steps where possible.
- Keep test data safe and non-production.

## Android Execution

- Run on Android for v1.
- Install or launch the relevant app build before the test.
- Ensure Metro/dev server connectivity when testing a development build.
- Capture logs when the test fails.

## Screenshot Evidence

Capture screenshots for:
- Initial state or entry point.
- The main changed screen.
- Important interaction states.
- Success/final state.
- Failure state when applicable.

Use deterministic names:

```text
artifacts/maestro/<job-id>/01-entry.png
artifacts/maestro/<job-id>/02-main-change.png
artifacts/maestro/<job-id>/03-success.png
```

## Video Evidence

Record the full flow and store it with the job artifacts:

```text
artifacts/maestro/<job-id>/flow-recording.mp4
```

## Passing Criteria

A Maestro run passes only when:
- The YAML flow completes.
- The expected changed UI is visible.
- Required screenshots exist.
- The recording exists and is playable.

## Failure Handling

If Maestro fails:
- Do not request APK approval.
- Attach the failure screenshot and logs.
- Report expected result, actual result, failed step, and likely cause.
- Leave the PR as draft until fixed or intentionally accepted by a human.
