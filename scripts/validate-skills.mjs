#!/usr/bin/env node
// Validates Claude packaging, OpenAI/Codex packaging, and each SKILL.md.
// Fails CI on missing frontmatter, schema violations, or unknown MCP tool references.
//
// Per-skill packaging targets (in plugins/<plugin>/skills/<skill>/):
//   - Claude: enabled by default; opt out by adding an empty `.claude-disabled` marker file.
//   - OpenAI/Codex: opt in by adding `agents/openai.yaml`.
// A skill that opts out of Claude AND has no openai.yaml ships nowhere and fails validation.
//
// Dev dep: js-yaml (real YAML parser; tolerates indentation, quoting, comments,
// reordering, line wraps). Install with `npm ci`.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

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

function readText(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (e) {
    fail(path, `unreadable file: ${e.message}`);
    return null;
  }
}

function parseYaml(path, text) {
  try {
    return yaml.load(text);
  } catch (e) {
    fail(path, `invalid YAML: ${e.message}`);
    return null;
  }
}

// 1. Claude marketplace metadata
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

// 2. Shared plugin/skill discovery
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

  // 3. Claude plugin manifest
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

  // 4. Shared skills
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
    const skillDir = join(skillsDir, skillDirName);
    const skillPath = join(skillDir, "SKILL.md");
    if (!existsSync(skillPath)) {
      fail(skillDir, "missing SKILL.md");
      continue;
    }

    const raw = readText(skillPath);
    if (!raw) continue;

    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) {
      fail(skillPath, "no YAML frontmatter (--- ... ---) at top");
      continue;
    }
    const fm = parseYaml(skillPath, match[1]) ?? {};
    const body = match[2];

    if (typeof fm.name !== "string" || !fm.name) fail(skillPath, "frontmatter missing 'name'");
    else if (fm.name !== skillDirName) {
      fail(skillPath, `frontmatter 'name' (${fm.name}) must match directory (${skillDirName})`);
    }
    if (typeof fm.description !== "string" || !fm.description) {
      fail(skillPath, "frontmatter missing 'description'");
    } else if (fm.description.length > 1024) {
      fail(skillPath, `description too long (${fm.description.length} chars, max 1024)`);
    }

    // 5. Determine per-skill targets
    const openaiPath = join(skillDir, "agents", "openai.yaml");
    const claudeDisabledPath = join(skillDir, ".claude-disabled");
    const claudeEnabled = !existsSync(claudeDisabledPath);
    const openaiEnabled = existsSync(openaiPath);

    if (!claudeEnabled && !openaiEnabled) {
      fail(
        skillDir,
        "ships nowhere: has .claude-disabled but no agents/openai.yaml — add one or the other"
      );
    }

    // 6. OpenAI/Codex metadata (only when opted in)
    if (openaiEnabled) {
      const openaiRaw = readText(openaiPath);
      if (openaiRaw) {
        const doc = parseYaml(openaiPath, openaiRaw);
        if (doc && typeof doc === "object") {
          const iface = doc.interface ?? {};
          const displayName = iface.display_name;
          const shortDescription = iface.short_description;
          const defaultPrompt = iface.default_prompt;

          if (typeof displayName !== "string" || !displayName.trim()) {
            fail(openaiPath, "missing interface.display_name");
          }
          if (typeof shortDescription !== "string" || !shortDescription.trim()) {
            fail(openaiPath, "missing interface.short_description");
          } else if (shortDescription.length < 25 || shortDescription.length > 120) {
            fail(openaiPath, `interface.short_description length must be 25-120 chars (got ${shortDescription.length})`);
          }

          if (typeof defaultPrompt !== "string" || !defaultPrompt.trim()) {
            fail(openaiPath, "missing interface.default_prompt");
          } else if (!defaultPrompt.includes(`$${skillDirName}`)) {
            fail(openaiPath, `interface.default_prompt must explicitly mention $${skillDirName}`);
          }

          const tools = doc.dependencies?.tools;
          const argoDep = Array.isArray(tools)
            ? tools.find((t) => t && t.type === "mcp" && t.value === "argo")
            : null;
          if (!argoDep) {
            fail(openaiPath, "must declare an MCP dependency with type=mcp and value=argo under dependencies.tools[]");
          } else {
            if (argoDep.transport !== "streamable_http") {
              fail(openaiPath, `Argo dependency transport must be "streamable_http" (got ${JSON.stringify(argoDep.transport)})`);
            }
            if (argoDep.url !== "https://mcp.argo.games/mcp") {
              fail(openaiPath, `Argo dependency url must be "https://mcp.argo.games/mcp" (got ${JSON.stringify(argoDep.url)})`);
            }
          }
        }
      }
    }

    // 7. Shared tool reference validation
    const referenced = new Set();
    for (const m of body.matchAll(/`([a-z][a-z0-9_]*)`/g)) {
      const tok = m[1];
      if (/_/.test(tok) && /^[a-z_]+$/.test(tok)) referenced.add(tok);
    }
    for (const m of body.matchAll(/mcp__[a-z0-9_]+__([a-z0-9_]+)/g)) {
      referenced.add(m[1]);
    }

    for (const tok of referenced) {
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
