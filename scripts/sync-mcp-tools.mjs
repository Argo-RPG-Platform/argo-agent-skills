#!/usr/bin/env node
// Regenerates scripts/mcp-tools-allowlist.json from the live Argo-RPG-Platform/MCP source.
//
// Usage:
//   node scripts/sync-mcp-tools.mjs <path-to-mcp-checkout>
//
// Parses <mcp-checkout>/src/server.ts for tool names registered via:
//   - server.registerTool("name", ...)
//   - registerCreateMnemonsTool("name", ...)
//   - registerUpdateMnemonsTool("name", ...)
//
// Writes the sorted, de-duplicated tool list to scripts/mcp-tools-allowlist.json.
// Exits 0 always; the caller decides what to do with any diff.

import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outPath = join(root, "scripts", "mcp-tools-allowlist.json");

const mcpRoot = process.argv[2];
if (!mcpRoot) {
  console.error("Usage: sync-mcp-tools.mjs <path-to-mcp-checkout>");
  process.exit(1);
}

const serverPath = resolve(mcpRoot, "src", "server.ts");
const source = readFileSync(serverPath, "utf8");

const tools = new Set();
const registerCallRe = /(?:server\.registerTool|registerCreateMnemonsTool|registerUpdateMnemonsTool)\s*\(\s*["']([a-z_][a-z0-9_]*)["']/g;
for (const m of source.matchAll(registerCallRe)) {
  tools.add(m[1]);
}

if (tools.size === 0) {
  console.error(`No tools extracted from ${serverPath}. Refusing to write an empty allowlist.`);
  process.exit(1);
}

const sorted = [...tools].sort();
const output = {
  source: "Generated from Argo-RPG-Platform/MCP src/server.ts registerTool() calls.",
  tools: sorted,
};

writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n", "utf8");
console.log(`Wrote ${sorted.length} tools to ${outPath}.`);
