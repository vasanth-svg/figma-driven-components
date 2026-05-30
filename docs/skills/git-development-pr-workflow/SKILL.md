---
name: git-development-pr-workflow
description: Use for every GitHub repo selection, branch creation, commit, push, and PR in the Figma-to-APK workflow. Enforces GitHub MCP first, valid branch names, and PRs targeting development every time.
---

# Git Development PR Workflow

## Required Workflow

1. Use GitHub MCP to resolve repository metadata.
2. Verify the `development` branch exists.
3. Stop if `development` is missing.
4. Create a branch from `development` using `figma/<job-id>-<short-slug>`.
5. Use local `git` only inside a cloned workspace for status, diff, commit, and push.
6. Create or update a draft PR targeting `development`.
7. Attach implementation summary, validation results, Maestro evidence, and build status.

## GitHub MCP Rules

Prefer GitHub MCP for:
- repo metadata
- file fetches before cloning
- branch search
- branch creation
- PR creation
- PR updates
- PR comments

## Local Git Rules

Use local `git` only for:
- `git status`
- `git diff`
- `git switch` / `git checkout`
- `git add`
- `git commit`
- `git push`

Never use local git to bypass the required `development` base branch rule.

## Branch Rules

Branch format:

```text
figma/<job-id>-<short-slug>
```

Allowed characters are lowercase letters, numbers, `/`, and `-`. Normalize names by lowercasing, replacing spaces/symbols with `-`, collapsing repeated dashes, and trimming leading/trailing dashes.

## PR Rules

- Base branch must be `development` every time.
- PR starts as draft until checks and Maestro evidence are attached.
- Title format: `Figma: <short feature name>`.
- Body must include Figma URLs, branch, base branch, summary, validation, Maestro artifacts, and build status.

## Blockers

Stop and report when:
- `development` does not exist.
- GitHub credentials cannot access the repo.
- The workspace has unrelated uncommitted changes.
- The requested branch name would collide with an unrelated existing branch.
