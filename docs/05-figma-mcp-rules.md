# Figma MCP Rules

## Trigger

Use these rules whenever a job includes Figma URLs, Figma node IDs, or a request to implement a design from Figma.

## URL Parsing

For a Figma design URL:

```text
https://figma.com/design/<fileKey>/<fileName>?node-id=1-2
```

Extract:
- `fileKey`: path segment after `/design/`.
- `nodeId`: query `node-id`, converted from `1-2` to `1:2` when required by the tool.

If a design URL lacks a node ID, block the job and ask for a node-specific URL.

## Required Fetch Sequence

For each Figma node:

1. Call `get_design_context` with `fileKey` and `nodeId`.
2. Call `get_screenshot` for the same `fileKey` and `nodeId`.
3. If context is too large or incomplete, call `get_metadata` and then fetch needed child nodes with `get_design_context`.
4. Fetch variable definitions or design-system mappings when useful for component/token matching.
5. Download or reference assets returned by Figma MCP; never invent placeholders when assets are provided.

## Implementation Guidance

- Treat Figma MCP code as reference output, not final code style.
- Convert React/Tailwind-like output into the target repo framework and conventions.
- Reuse existing components and tokens first.
- Prefer target repo tokens over raw hex values when the mapping is clear.
- Use the Figma screenshot as the visual source of truth during validation.

## Multi-Figma Jobs

- Preserve the input order unless dependencies imply a better implementation order.
- Group related frames into one feature branch and one PR.
- Capture which Figma URL maps to which route/component in the PR body.

## Failure Handling

Block implementation when:
- Figma MCP authentication fails.
- A URL cannot be parsed.
- A design URL does not include a node ID.
- The user lacks access to the file.
- Required assets cannot be resolved and no acceptable fallback is specified.
