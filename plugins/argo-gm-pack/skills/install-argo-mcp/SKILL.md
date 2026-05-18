---
name: install-argo-mcp
description: Walk the user through connecting the hosted Argo MCP server (https://mcp.argo.games/mcp) to their AI client so the Argo tools become available. Use when the user says "connect Argo", "install Argo MCP", "set up Argo in Claude", "set up Argo in Codex", "hook up my campaign", or otherwise asks how to plug the Argo platform into Claude Code, Claude.ai, Codex, ChatGPT, or another MCP-compatible client. Do not use for unrelated MCP setup or for installing other plugins.
---

# Install the Argo MCP

You are helping a Game Master connect the hosted Argo MCP server to their AI client. The MCP exposes the GM's campaign data (mnemons, sessions, forum, guilds, etc.) as tools the assistant can call.

The Argo MCP is hosted at:

```
https://mcp.argo.games/mcp
```

It uses OAuth2 with Dynamic Client Registration. No tokens or secrets need to be pasted by hand — the client handles auth in a browser on first connect.

## Decide the surface

Ask the user which client surface they're using:

- **Claude Code** (CLI, VS Code, JetBrains, desktop app) — use the "Claude Code" path below.
- **Claude.ai** (web or desktop chat at claude.ai) — use the "Claude.ai" path below.
- **Codex** (desktop or CLI with local MCP config) — use the "Codex" path below.
- **ChatGPT** (hosted remote MCP) — use the "ChatGPT" path below.

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

## Codex path

1. Add the server to Codex MCP config:

   ```json
   {
     "mcpServers": {
       "argo": {
         "command": "npx",
         "args": ["-y", "argo-mcp"]
       }
     }
   }
   ```

2. If they have not already signed in on this machine, run:

   ```
   npx -y argo-mcp auth login
   ```

   This prints the Argo consent URL and saves the returned tokens locally after the GM pastes them back.

3. Restart Codex or reload MCP servers if needed.
4. Verify by asking Codex to list campaigns. If connected, it should call `list_campaigns`.

## ChatGPT path

1. Add the hosted MCP server URL to ChatGPT:

   ```
   https://mcp.argo.games/mcp
   ```

2. Let ChatGPT walk through OAuth on first connect.
3. Verify by asking ChatGPT to list campaigns.

If the GM is trying to use a different MCP-compatible client, fall back to the Argo MCP README and adapt the closest of the Codex or Claude flows.

## Troubleshooting

- **OAuth tab didn't open.** Some Linux installs (Flatpak/Snap VS Code) don't register the URL handler. Open the consent URL manually: `https://app.argo.games/oauth2/mcp-connect`.
- **Codex local auth is asking for tokens.** That is expected for local stdio mode. Run `npx -y argo-mcp auth login` and paste the access token (and refresh token if available) from the Argo consent page.
- **"Token expired" or 401 from a tool call.** Re-consent at `https://app.argo.games/oauth2/mcp-connect`. The client will pick up the fresh token automatically.
- **A campaign you expected isn't there.** The GM scoped the grant during consent. Revisit `https://app.argo.games/oauth2/mcp-connect` and add the missing campaigns to the grant.
- **GM revoked access.** From the campaign's **Integrations** page in the Argo WebApp the GM can revoke at any time. Both access and refresh tokens become invalid immediately; re-consent to reconnect.

## When you're done

Confirm Argo is connected by calling `list_campaigns` yourself (if you have access to MCP tools in this conversation) or by asking the GM to run "list my campaigns" and confirm they see results. Then suggest the `prep-session`, `generate-npc`, or `recap-session` skills as next steps.
