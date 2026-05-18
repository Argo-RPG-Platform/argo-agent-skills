---
name: install-argo-mcp-codex
description: Walk the user through connecting the hosted Argo MCP server (https://mcp.argo.games/mcp) to Codex or ChatGPT so the Argo tools become available. Use when the user says "connect Argo to Codex", "install Argo MCP in Codex", "set up Argo in ChatGPT", "hook up my campaign in Codex", or otherwise asks how to plug the Argo platform into Codex, ChatGPT, or another OpenAI-compatible MCP client. For Claude setup, use `install-argo-mcp-claude` instead. Do not use for unrelated MCP setup or for installing other plugins.
---

# Install the Argo MCP (Codex / ChatGPT)

You are helping a Game Master connect the hosted Argo MCP server to an **OpenAI-compatible** client — Codex or ChatGPT. The MCP exposes the GM's campaign data (mnemons, sessions, forum, guilds, etc.) as tools the assistant can call.

The Argo MCP is hosted at:

```
https://mcp.argo.games/mcp
```

It uses OAuth2 with Dynamic Client Registration. The client handles auth in a browser on first connect.

> **Not on Codex or ChatGPT?** If the GM is using Claude, switch to the `install-argo-mcp-claude` skill instead.

## Decide the surface

Ask the GM which OpenAI-compatible surface they're using:

- **Codex** (desktop or CLI) — use the "Codex" path below.
- **ChatGPT** (web or desktop chat at chatgpt.com) — use the "ChatGPT" path below.

If they don't know, ask where they're typing right now.

## Codex path

1. Add the hosted Argo MCP server to Codex:

   ```
   codex mcp add argo --url https://mcp.argo.games/mcp
   ```

   Or add it directly to Codex's MCP config:

   ```json
   {
     "mcp_servers": {
       "argo": { "url": "https://mcp.argo.games/mcp" }
     }
   }
   ```

2. Let Codex walk through OAuth on first connect.
3. Verify by asking Codex to list campaigns. If connected, it should call `list_campaigns`.

### Codex stdio fallback

If Codex in the GM's environment can't complete the hosted OAuth handshake, fall back to local stdio mode:

1. Update the Codex MCP config to launch the npm-distributed server locally:

   ```json
   {
     "mcp_servers": {
       "argo": {
         "command": "npx",
         "args": ["-y", "argo-mcp"]
       }
     }
   }
   ```

2. From a terminal, run:

   ```
   npx -y argo-mcp auth login
   ```

   This prints the Argo consent URL and saves the returned tokens locally after the GM pastes them back.

3. Restart Codex (or reload MCP servers).
4. Verify by asking Codex to list campaigns.

## ChatGPT path

1. In ChatGPT, add the hosted Argo MCP server URL:

   ```
   https://mcp.argo.games/mcp
   ```

2. Let ChatGPT walk through OAuth on first connect (Dynamic Client Registration).
3. Verify by asking ChatGPT to list campaigns.

> **Don't** install the `argo-mcp` npm package for ChatGPT — ChatGPT only supports the hosted remote endpoint.

## Troubleshooting

- **Codex remote connect didn't complete.** Try the hosted `codex mcp add argo --url https://mcp.argo.games/mcp` path again. If it still fails, use the Codex stdio fallback above.
- **Codex local stdio asks for tokens.** That's expected in stdio mode. Run `npx -y argo-mcp auth login` and paste the access token (and refresh token if available) from the Argo consent page.
- **"Token expired" or 401 from a tool call.** Re-consent at `https://app.argo.games/oauth2/mcp-connect`. The client will pick up the fresh token automatically.
- **A campaign you expected isn't there.** The GM scoped the grant during consent. Revisit `https://app.argo.games/oauth2/mcp-connect` and add the missing campaigns to the grant.
- **GM revoked access.** From the campaign's **Integrations** page in the Argo WebApp the GM can revoke at any time. Both access and refresh tokens become invalid immediately; re-consent to reconnect.

## When you're done

Confirm Argo is connected by calling `list_campaigns` (or asking the GM to run "list my campaigns" and confirm they see results). Then suggest the `prep-session`, `generate-npc`, or `recap-session` skills as next steps.
