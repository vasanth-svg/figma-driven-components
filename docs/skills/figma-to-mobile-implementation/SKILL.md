---
name: figma-to-mobile-implementation
description: Use when implementing mobile UI changes from one or more Figma URLs. Requires Figma MCP design context, screenshots, metadata fallback, and translation into the selected repo's existing folder structure and design system.
---

# Figma To Mobile Implementation

## Required Workflow

1. Parse each Figma URL into `fileKey` and `nodeId`.
2. Call Figma MCP `get_design_context` for each node.
3. Call Figma MCP `get_screenshot` for each node.
4. If the response is too large or incomplete, call `get_metadata`, identify child nodes, and fetch only the needed nodes.
5. Inspect the selected repo before editing: `AGENTS.md`, `.agents/skills/*/SKILL.md`, `README.md`, routing, components, theme, and services.
6. Implement using the selected repo's conventions and folder structure.
7. Validate visual parity against the Figma screenshot.
8. Document any unavoidable deviation in the PR body.

## Rules

- Do not implement from screenshots alone when Figma MCP design context is available.
- Do not create placeholder assets when Figma MCP provides assets.
- Treat Figma MCP code as reference, not final project code.
- Reuse existing components, tokens, typography, hooks, and services before creating new ones.
- Keep changes scoped to the submitted Figma designs.

## Expo Repo Defaults

For Expo Router apps:
- Route files belong in `app/`.
- Reusable UI belongs in `components/`.
- API calls belong in `services/` or `services/api/`.
- Shared interfaces belong in `interface/` or the repo's existing types folder.
- Theme/tokens belong in the existing theme system.
