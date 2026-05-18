---
name: install-argo-mcp
description: Walk the user through connecting the hosted Argo MCP server (https://mcp.argo.games/mcp) to their AI client so the Argo tools become available. Use when the user says "connect Argo", "install Argo MCP", "set up Argo in Claude", "hook up my campaign", or otherwise asks how to plug the Argo platform into Claude Code or Claude.ai. Do not use for unrelated MCP setup or for installing other plugins.
---

# Install the Argo MCP

You are helping a Game Master connect the hosted Argo MCP server to their Claude client. The MCP exposes the GM's campaign data (mnemons, sessions, forum, guilds, etc.) as tools the assistant can call.

The Argo MCP is hosted at:

```
https://mcp.argo.games/mcp
```

It uses OAuth2 with Dynamic Client Registration. No tokens or secrets need to be pasted by hand — the client handles auth in a browser on first connect.

## Decide the surface

Ask the user which Claude surface they're using:

- **Claude Code** (CLI, VS Code, JetBrains, desktop app) — use the "Claude Code" path below.
- **Claude.ai** (web or desktop chat at claude.ai) — use the "Claude.ai" path below.

If they don't know, ask where they're typing right now.

## Claude Code path

1. From a terminal, run:

   ```
   claude mcp add --transport http argo https://mcp.argo.games/mcp
   ```

2. Open (or restart) Claude Code. The next time it tries to use an Argo tool, it will open a browser tab to `https://app.argo.games/oauth2/...` for consent. The GM signs in, picks which campaigns to grant access to, and approves.

3. Verify by asking Claude to list your campaigns. If the MCP is wired up, Claude will call `list_campaigns` and return them.

If the user is on **VS Code** specifically and prefers a one-click flow, point them at the install button in the [Argo MCP README](https://github.com/Argo-RPG-Platform/MCP#one-click-install).

## Claude.ai path

1. In Claude.ai, open **Settings → Connectors → Add custom connector**.
2. Enter:
   - **Name:** `Argo`
   - **MCP server URL:** `https://mcp.argo.games/mcp`
3. Save. Claude.ai will open an OAuth consent tab the first time you ask it to do something with Argo. Sign in, pick campaigns, approve.
4. Verify by asking Claude to list your campaigns.

## Troubleshooting

- **OAuth tab didn't open.** Some Linux installs (Flatpak/Snap VS Code) don't register the URL handler. Open the consent URL manually: `https://app.argo.games/oauth2/mcp-connect`.
- **"Token expired" or 401 from a tool call.** Re-consent at `https://app.argo.games/oauth2/mcp-connect`. The client will pick up the fresh token automatically.
- **A campaign you expected isn't there.** The GM scoped the grant during consent. Revisit `https://app.argo.games/oauth2/mcp-connect` and add the missing campaigns to the grant.
- **GM revoked access.** From the campaign's **Integrations** page in the Argo WebApp the GM can revoke at any time. Both access and refresh tokens become invalid immediately; re-consent to reconnect.

## When you're done

Confirm Argo is connected by calling `list_campaigns` yourself (if you have access to MCP tools in this conversation) or by asking the GM to run "list my campaigns" and confirm they see results. Then suggest the `prep-session`, `generate-npc`, or `recap-session` skills as next steps.
