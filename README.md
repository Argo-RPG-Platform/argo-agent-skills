# Argo Agent Skills

Shared agent skills for the [Argo RPG Platform](https://argo.games) — workflows that orchestrate the [Argo MCP server](https://github.com/Argo-RPG-Platform/MCP) into high-frequency Game Master tasks.

This repo keeps one canonical skill source and ships parallel packaging for:

- **Claude** — works in both **Claude Code** (CLI/IDE) and **Claude.ai** (web/desktop chat). Distributed as a Claude Code plugin marketplace + GitHub Release zips for Claude.ai upload.
- **Codex / ChatGPT / OpenAI-compatible** — Codex (desktop or CLI) and ChatGPT, via skill bundles with `agents/openai.yaml`.

## Skills in the `argo-gm-pack` plugin

| Skill | What it does | Ships to |
| --- | --- | --- |
| `install-argo-mcp-claude` | Walks you through connecting the hosted Argo MCP (`https://mcp.argo.games/mcp`) to Claude Code or Claude.ai. | Claude only |
| `install-argo-mcp-codex` | Walks you through connecting the hosted Argo MCP to Codex or ChatGPT (with a Codex stdio fallback). | Codex/ChatGPT only |
| `prep-session` | Pulls campaign state, the last session, active quests, and relevant NPCs/locations, and produces a pre-session prep doc. | Claude + Codex/ChatGPT |
| `recap-session` | Turns your raw session notes into a SessionSummary mnemon, updates affected NPC/quest/location mnemons, and (optionally) posts a player-facing recap to the campaign forum. | Claude + Codex/ChatGPT |
| `generate-npc` | Interviews you about a new NPC, creates the mnemon, and wires up relationships to existing characters/locations. | Claude + Codex/ChatGPT |

## Repo layout

- `plugins/argo-gm-pack/skills/*/SKILL.md` — canonical skill content (used by every target).
- `plugins/argo-gm-pack/.claude-plugin/` — Claude plugin manifest.
- `.claude-plugin/marketplace.json` — Claude Code marketplace entry.
- `plugins/argo-gm-pack/skills/*/agents/openai.yaml` — opt-in OpenAI/Codex metadata. Skills without this file are not packaged for the OpenAI target.
- `plugins/argo-gm-pack/skills/*/.claude-disabled` — opt-out marker. Skills with this file are not packaged for the Claude target.

## Install and use

### Claude Code

```
/plugin marketplace add Argo-RPG-Platform/argo-agent-skills
/plugin install argo-gm-pack@argo
```

Then run the `install-argo-mcp-claude` skill once (just describe what you want — e.g. "connect the Argo MCP to Claude") to hook the MCP server itself up.

### Claude.ai (web/desktop)

1. Open the [latest release](https://github.com/Argo-RPG-Platform/argo-agent-skills/releases/latest).
2. Download `argo-gm-pack-claude-vX.Y.Z.zip`.
3. In Claude.ai: **Settings → Capabilities → Skills → Upload**, and upload each skill folder from the zip.
4. Add the Argo MCP as a connector via **Settings → Connectors → Add custom connector**, URL `https://mcp.argo.games/mcp`.

### Codex / OpenAI-compatible skill loaders

1. Open the [latest release](https://github.com/Argo-RPG-Platform/argo-agent-skills/releases/latest).
2. Download either:
   - an individual `*-openai-vX.Y.Z.zip` skill bundle, or
   - the combined `argo-gm-pack-openai-vX.Y.Z.zip` bundle.
3. Install the extracted skill folder(s) into your OpenAI-compatible skill directory or loader workflow.
4. Configure the Argo MCP endpoint as needed for your client:
   - Codex remote MCP: `codex mcp add argo --url https://mcp.argo.games/mcp`
   - Hosted remote MCP URL: `https://mcp.argo.games/mcp`
   - Local stdio fallback: use the `install-argo-mcp-codex` skill, which also documents the `npx -y argo-mcp auth login` fallback path.

The `agents/openai.yaml` files are checked in and released alongside each skill so the same skill content can be consumed by Codex/OpenAI-style loaders without duplicating prompt logic.

## Contributing

PRs are welcome from the community; merges to `main` are gated on the `ArgoDev` team. See [CONTRIBUTING.md](#) (TBD).

## License

[MIT](./LICENSE)
