# Infrastructure Notes

Feature One runs locally with no external services.

The production architecture will need:

- GitHub App or GitHub MCP credentials scoped to selected repositories.
- Figma MCP authentication for design context and screenshots.
- OpenAI API key storage through encrypted backend secrets or a vault-backed runtime credential.
- Queue storage for release jobs.
- Object storage for screenshots, recordings, logs, and APKs.
- Worker hosts with Node, Git, Android SDK, Maestro, and EAS CLI.
- Secret redaction before any logs are sent to the dashboard or PR comments.

The dashboard should never expose a terminal, IDE, or raw API key. It should expose structured job events, previews, evidence, PR links, and approval controls.
