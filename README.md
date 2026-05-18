# Argo Agent Skills

Shared agent skills for the [Argo RPG Platform](https://argo.games) — workflows that orchestrate the [Argo MCP server](https://github.com/Argo-RPG-Platform/MCP) into high-frequency Game Master tasks.

This repo keeps one canonical skill source and ships parallel packaging for:

- **Claude** plugin/skill workflows
- **Codex / OpenAI-compatible** skill bundles with `agents/openai.yaml`

## Skills in the `argo-gm-pack` plugin

| Skill | What it does |
| --- | --- |
| `install-argo-mcp` | Walks you through connecting the hosted Argo MCP (`https://mcp.argo.games/mcp`) to Claude, Codex, ChatGPT, or another compatible MCP client. |
| `prep-session` | Pulls campaign state, the last session, active quests, and relevant NPCs/locations, and produces a pre-session prep doc. |
| `recap-session` | Turns your raw session notes into a SessionSummary mnemon, updates affected NPC/quest/location mnemons, and (optionally) posts a player-facing recap to the campaign forum. |
| `generate-npc` | Interviews you about a new NPC, creates the mnemon, and wires up relationships to existing characters/locations. |

## Repo layout

- `plugins/argo-gm-pack/skills/*/SKILL.md` is the shared source of truth.
- `plugins/argo-gm-pack/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` power Claude packaging.
- `plugins/argo-gm-pack/skills/*/agents/openai.yaml` powers Codex/OpenAI packaging.

## Install and use

### Claude Code

```
/plugin marketplace add Argo-RPG-Platform/argo-agent-skills
/plugin install argo-gm-pack@argo
```

Then run the `install-argo-mcp` skill once (just describe what you want — e.g. "connect the Argo MCP") to hook the MCP server itself up.

### Claude.ai (web/desktop)

1. Open the [latest release](https://github.com/Argo-RPG-Platform/argo-agent-skills/releases/latest).
2. Download `argo-gm-pack-vX.Y.Z.zip`.
3. In Claude.ai: **Settings → Capabilities → Skills → Upload**, and upload each skill folder from the zip.
4. Add the Argo MCP as a connector via **Settings → Connectors → Add custom connector**, URL `https://mcp.argo.games/mcp`.

### Codex / OpenAI-compatible skill loaders

1. Open the [latest release](https://github.com/Argo-RPG-Platform/argo-agent-skills/releases/latest).
2. Download either:
   - an individual `*-openai-vX.Y.Z.zip` skill bundle, or
   - the combined `argo-gm-pack-openai-vX.Y.Z.zip` bundle.
3. Install the extracted skill folder(s) into your OpenAI-compatible skill directory or loader workflow.
4. Configure the Argo MCP endpoint as needed for your client:
   - Hosted remote MCP: `https://mcp.argo.games/mcp`
   - Local stdio clients such as Codex: use the `install-argo-mcp` skill, which walks through `npx -y argo-mcp auth login` plus MCP config.

The `agents/openai.yaml` files are checked in and released alongside each skill so the same skill content can be consumed by Codex/OpenAI-style loaders without duplicating prompt logic.

## Contributing

PRs are welcome from the community; merges to `main` are gated on the `ArgoDev` team. See [CONTRIBUTING.md](#) (TBD).

## License

[MIT](./LICENSE)
