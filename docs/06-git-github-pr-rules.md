# Git And GitHub PR Rules

## Trigger

Use these rules for every repository selection, branch creation, commit, push, PR creation, and PR update in the Figma-to-APK workflow.

## GitHub MCP First

Prefer GitHub MCP/GitHub connector for:
- Repository metadata.
- File reads from GitHub before cloning.
- Branch search and validation.
- Branch creation when using connector flow.
- PR creation and updates.
- PR comments with evidence links.

Useful connector operations include:
- `get_repo`
- `fetch_file`
- `search_branches`
- `create_branch`
- `create_pull_request`
- `update_pull_request`
- `add_comment_to_issue`

## Local Git Scope

Use local `git` only inside a cloned workspace for:
- `git status`
- `git diff`
- `git checkout` / `git switch`
- `git add`
- `git commit`
- `git push`

Do not use local `git` to bypass GitHub MCP branch or PR rules.

## Base Branch Rule

- The base branch is always `development`.
- Verify `development` exists before creating any feature branch.
- If `development` does not exist, stop the workflow and report the blocker.
- Never target `main`, `master`, or the repository default branch unless the human explicitly changes this workflow.

## Branch Naming Rule

Format:

```text
figma/<job-id>-<short-slug>
```

Allowed characters:
- lowercase letters
- numbers
- `/`
- `-`

Normalization:
- Convert uppercase to lowercase.
- Replace spaces and symbols with `-`.
- Collapse repeated dashes.
- Trim leading/trailing dashes.
- Keep the part after `figma/` to 60 characters or less.

Examples:

```text
figma/job-482-rsu-insights-card
figma/1248-onboarding-kyc-refresh
figma/demo-watchlist-empty-state
```

## PR Rule

Every implementation job creates or updates a PR with:
- Base branch: `development`.
- Head branch: the generated `figma/...` branch.
- Draft status until validation and Maestro evidence are attached.
- Title format: `Figma: <short feature name>`.
- Maintainer edits enabled when supported.

## PR Body Requirements

Include:
- Figma URLs.
- User prompt summary.
- Branch and base branch.
- Changed areas.
- Validation commands and results.
- Maestro test file path.
- Screenshot links.
- Video recording link.
- Build approval status.
- Known deviations or follow-ups.

## Safety Rules

- Do not force-push unless the job owns the branch and the action is explicitly recorded.
- Do not rewrite unrelated history.
- Do not commit secrets, local env files, or build artifacts.
- If uncommitted user changes exist in a reused workspace, stop and use a fresh clone.
