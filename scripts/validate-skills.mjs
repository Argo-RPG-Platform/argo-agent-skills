#!/usr/bin/env node
// Validates marketplace.json, plugin.json, and each SKILL.md.
// Fails CI on missing frontmatter, schema violations, or unknown MCP tool references.
//
// No dependencies — runs on plain Node >=20.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const errors = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    fail(path, `invalid JSON: ${e.message}`);
    return null;
  }
}

// 1. marketplace.json
const marketplacePath = join(root, ".claude-plugin", "marketplace.json");
const marketplace = readJson(marketplacePath);
if (marketplace) {
  if (typeof marketplace.name !== "string" || !marketplace.name.trim()) {
    fail(marketplacePath, "missing 'name'");
  }
  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    fail(marketplacePath, "must declare at least one plugin in 'plugins'");
  } else {
    for (const p of marketplace.plugins) {
      for (const k of ["name", "source", "description", "version"]) {
        if (typeof p[k] !== "string" || !p[k].trim()) {
          fail(marketplacePath, `plugin '${p.name ?? "?"}': missing '${k}'`);
        }
      }
    }
  }
}

// 2. plugin.json (one per plugin)
const pluginsDir = join(root, "plugins");
const pluginDirs = existsSync(pluginsDir)
  ? readdirSync(pluginsDir).filter((d) => statSync(join(pluginsDir, d)).isDirectory())
  : [];

if (pluginDirs.length === 0) {
  fail(pluginsDir, "no plugins found under plugins/");
}

const allowlist = new Set(readJson(join(root, "scripts", "mcp-tools-allowlist.json"))?.tools ?? []);
if (allowlist.size === 0) {
  fail("scripts/mcp-tools-allowlist.json", "empty or unreadable allowlist");
}

for (const pluginDirName of pluginDirs) {
  const pluginDir = join(pluginsDir, pluginDirName);
  const manifestPath = join(pluginDir, ".claude-plugin", "plugin.json");
  if (!existsSync(manifestPath)) {
    fail(pluginDir, "missing .claude-plugin/plugin.json");
    continue;
  }
  const manifest = readJson(manifestPath);
  if (manifest) {
    for (const k of ["name", "version", "description"]) {
      if (typeof manifest[k] !== "string" || !manifest[k].trim()) {
        fail(manifestPath, `missing '${k}'`);
      }
    }
    if (manifest.name !== pluginDirName) {
      fail(manifestPath, `'name' (${manifest.name}) must match directory name (${pluginDirName})`);
    }
  }

  // 3. Validate each skill
  const skillsDir = join(pluginDir, "skills");
  if (!existsSync(skillsDir)) {
    fail(pluginDir, "missing skills/ directory");
    continue;
  }
  const skillDirs = readdirSync(skillsDir).filter((d) => statSync(join(skillsDir, d)).isDirectory());
  if (skillDirs.length === 0) {
    fail(skillsDir, "no skills found");
  }

  for (const skillDirName of skillDirs) {
    const skillPath = join(skillsDir, skillDirName, "SKILL.md");
    if (!existsSync(skillPath)) {
      fail(join(skillsDir, skillDirName), "missing SKILL.md");
      continue;
    }
    const raw = readFileSync(skillPath, "utf8");
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) {
      fail(skillPath, "no YAML frontmatter (--- ... ---) at top");
      continue;
    }
    const fm = parseFrontmatter(match[1]);
    const body = match[2];

    if (!fm.name) fail(skillPath, "frontmatter missing 'name'");
    else if (fm.name !== skillDirName) {
      fail(skillPath, `frontmatter 'name' (${fm.name}) must match directory (${skillDirName})`);
    }
    if (!fm.description) fail(skillPath, "frontmatter missing 'description'");
    else if (fm.description.length > 1024) {
      fail(skillPath, `description too long (${fm.description.length} chars, max 1024)`);
    }

    // Check tool references in body against allowlist.
    const referenced = new Set();
    // backticked snake_case tool-name-shaped tokens
    for (const m of body.matchAll(/`([a-z][a-z0-9_]*)`/g)) {
      const tok = m[1];
      if (/_/.test(tok) && /^[a-z_]+$/.test(tok)) referenced.add(tok);
    }
    // mcp__server__tool style
    for (const m of body.matchAll(/mcp__[a-z0-9_]+__([a-z0-9_]+)/g)) {
      referenced.add(m[1]);
    }

    for (const tok of referenced) {
      // Skip obviously non-tool tokens (e.g. config keys). Heuristic: only flag tokens we recognise as
      // MCP-tool-shaped (verb_noun, plural for create_/update_/list_/get_, or forum_*).
      const looksLikeMcpTool =
        /^(list|get|create|update|delete|describe|add|remove|set|invite|accept|reject|cancel|send|forum)_/.test(
          tok
        );
      if (looksLikeMcpTool && !allowlist.has(tok)) {
        fail(skillPath, `references unknown MCP tool '${tok}' (not in allowlist)`);
      }
    }
  }
}

if (errors.length) {
  console.error("Validation failed:");
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log("All skills validated.");

// --- minimal YAML frontmatter parser ---
// Supports `key: value` lines. Values may be quoted; line continuations not supported.
function parseFrontmatter(text) {
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}
