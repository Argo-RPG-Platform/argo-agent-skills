# Contributing to argo-agent-skills

Thanks for considering a contribution. This repo packages the canonical Agent Skills for the [Argo MCP server](https://github.com/Argo-RPG-Platform/MCP) and ships them to both Claude (Code + Claude.ai) and OpenAI-compatible clients (Codex, ChatGPT) from one source.

## What kinds of changes are welcome

- **New skills** that orchestrate Argo MCP tools into useful Game Master or player workflows.
- **Improvements to existing skills** — clearer triggers, better step-by-step guidance, fixed bugs.
- **Packaging fixes** — validator, release workflow, marketplace metadata.
- **Documentation** — README, individual skill docs, install troubleshooting.

If you're not sure something fits, open a draft PR or an issue first.

## Repo layout cheat sheet

- `plugins/argo-gm-pack/skills/<skill-name>/SKILL.md` — canonical skill content. Used by every packaging target.
- `plugins/argo-gm-pack/skills/<skill-name>/agents/openai.yaml` — opt-in OpenAI/Codex metadata. Presence = skill is shipped in OpenAI release artifacts.
- `plugins/argo-gm-pack/skills/<skill-name>/.claude-disabled` — opt-out marker. Skills with this file are not shipped to the Claude target. Useful for surface-specific skills (e.g. `install-argo-mcp-codex`).
- `plugins/argo-gm-pack/.claude-plugin/plugin.json` — Claude plugin manifest (version, description).
- `.claude-plugin/marketplace.json` — Claude Code marketplace entry.
- `scripts/validate-skills.mjs` — local + CI validator.
- `scripts/mcp-tools-allowlist.json` — known MCP tool names, sourced from `Argo-RPG-Platform/MCP`. Refreshed periodically by `.github/workflows/sync-mcp-tools.yml`.

A skill that opts out of Claude **and** has no `openai.yaml` ships nowhere and will fail validation.

## Local development

```
npm ci
npm run validate
```

The validator checks SKILL.md frontmatter, the OpenAI metadata shape, and that any backticked tool references in skill bodies (e.g. `` `list_campaigns` ``) match the MCP tool allowlist.

## Authoring a new skill

1. Pick a short kebab-case name (e.g. `summarize-quest`).
2. Create `plugins/argo-gm-pack/skills/<name>/SKILL.md` with the standard YAML frontmatter:
   ```
   ---
   name: <name>
   description: <one paragraph — strong trigger phrases + boundary conditions>
   ---
   ```
   The `description` is what makes the skill triggerable. Include the natural phrases a user would type, and a "do not use for" boundary if relevant.
3. If the skill should also ship to Codex/ChatGPT, add `plugins/argo-gm-pack/skills/<name>/agents/openai.yaml`. Copy one of the existing files as a template and update the three `interface.*` fields. The `default_prompt` **must** include `$<name>` (e.g. `$summarize-quest`).
4. If the skill is surface-specific (Codex-only or Claude-only), add `.claude-disabled` and/or omit `openai.yaml` as appropriate.
5. Run `npm run validate`.
6. Open a PR. CI will re-run validation.

## Pull requests

- Merges to `main` require approval from a member of the `ArgoDev` team. External PRs are very welcome — we'll review and shepherd them through.
- Keep PRs scoped. A new skill is one PR; a packaging refactor is another.
- Write a clear PR description: the *why*, the user-visible effect, and how to test.
- One commit per logical change is preferred but not required.

## Releases

Releases are cut by pushing a `v*` tag on `main`. The release workflow validates, packages Claude and OpenAI artifacts, and creates a GitHub Release with the zips attached. Only `ArgoDev` members can push tags.

## Reporting issues

Open a GitHub Issue on this repo. For bugs in the underlying MCP server, file at [`Argo-RPG-Platform/MCP`](https://github.com/Argo-RPG-Platform/MCP/issues) instead.

## License

By contributing, you agree your contribution will be licensed under the [MIT License](./LICENSE).
