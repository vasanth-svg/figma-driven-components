# Agent Workflow

## Required Order

1. Resolve job input: repo, Figma URLs, user prompt, requested platform.
2. Use GitHub MCP to fetch repository metadata.
3. Verify `development` branch exists.
4. Create a branch from `development` with a valid name.
5. Clone or update local workspace for the selected repo.
6. Read target repo guidance before editing:
   - `AGENTS.md`
   - `.agents/skills/*/SKILL.md`
   - `README.md`
   - package/build config
7. Parse all Figma URLs and call Figma MCP.
8. Implement changes using repo conventions and folder structure.
9. Run validation commands appropriate to the repo.
10. Add/update Maestro test file.
11. Run Maestro on Android, collect screenshots and recording.
12. Commit, push, and create/update draft PR to `development`.
13. Attach summary, validation results, and artifacts to job and PR.
14. Wait for user approval before APK build.

## Repo Instruction Rules

- Project-local `AGENTS.md` and `.agents/skills/` instructions override generic workflow assumptions.
- If repo-specific instructions conflict with this workflow on PR target, branch source, approval, or APK gating, stop and ask for human decision. Do not silently bypass the `development` rule.

## Implementation Rules

- Keep edits scoped to the Figma request.
- Preserve existing component and folder conventions.
- Reuse existing UI components, theme tokens, services, hooks, and types.
- Avoid unrelated refactors.
- Add tests or Maestro steps proportional to changed behavior.
- Document meaningful deviations from Figma in the PR body.

## Validation Rules

- Run `npm run lint` when available.
- Run `npm run typecheck` when available.
- Run the relevant package build/test command if the repo defines one and it is practical for the job.
- If validation cannot run, capture the exact reason in job logs and PR body.

## PR Evidence Rules

Every PR body or PR comment must include:
- Figma URLs implemented.
- Branch name and base branch.
- Summary of changes.
- Validation commands and results.
- Maestro test file path and result.
- Screenshot links.
- Video recording link.
- Build approval/build status.
