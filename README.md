# Argo Agent Skills

Agent skills and plugin marketplace for the [Argo RPG Platform](https://argo.games) — workflows that orchestrate the [Argo MCP server](https://github.com/Argo-RPG-Platform/MCP) into high-frequency Game Master tasks.

Skills are an Anthropic concept (current name: Agent Skills) and work in both **Claude Code** (CLI/IDE) and **Claude.ai** (web/desktop chat).

## Skills in the `argo-gm-pack` plugin

| Skill | What it does |
| --- | --- |
| `install-argo-mcp` | Walks you through connecting the hosted Argo MCP (`https://mcp.argo.games/mcp`) to Claude Code or Claude.ai. |
| `prep-session` | Pulls campaign state, the last session, active quests, and relevant NPCs/locations, and produces a pre-session prep doc. |
| `recap-session` | Turns your raw session notes into a SessionSummary mnemon, updates affected NPC/quest/location mnemons, and (optionally) posts a player-facing recap to the campaign forum. |
| `generate-npc` | Interviews you about a new NPC, creates the mnemon, and wires up relationships to existing characters/locations. |

## Install

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

## Contributing

PRs are welcome from the community; merges to `main` are gated on the `ArgoDev` team. See [CONTRIBUTING.md](#) (TBD).

## License

[MIT](./LICENSE)
