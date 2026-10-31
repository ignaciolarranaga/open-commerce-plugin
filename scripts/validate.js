#!/usr/bin/env node
// Repository validator. Node 22, no dependencies.
//
// Checks:
//   1. The three plugin manifests share name, version and description.
//   2. Every skills/<name>/SKILL.md has frontmatter with name and description,
//      and the frontmatter name matches the folder.
//   3. No merchant data is bundled under plugins/ (no store manifests, no "stores" arrays).
//   4. The three marketplace catalogs reference existing plugin paths and the plugin name.
//   5. The ChatGPT packaging constraints hold: non-empty description, no hooks, no userConfig.
//   6. The OpenAI listing block (codex manifest `interface`) is complete, within the portal's
//      limits, and every referenced image exists.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN_DIR = path.join(ROOT, 'plugins', 'open-commerce');
const PLUGIN_NAME = 'open-commerce';

const problems = [];
const fail = (msg) => problems.push(msg);
const rel = (p) => path.relative(ROOT, p);

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    fail(`${rel(file)}: cannot parse JSON (${err.message})`);
    return null;
  }
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// 1. Manifests in sync -------------------------------------------------------
const manifestFiles = {
  claude: path.join(PLUGIN_DIR, '.claude-plugin', 'plugin.json'),
  codex: path.join(PLUGIN_DIR, '.codex-plugin', 'plugin.json'),
  cursor: path.join(PLUGIN_DIR, '.cursor-plugin', 'plugin.json'),
};
const manifests = {};
for (const [runtime, file] of Object.entries(manifestFiles)) {
  if (!existsSync(file)) {
    fail(`${rel(file)}: missing ${runtime} manifest`);
    continue;
  }
  const json = readJson(file);
  if (json) manifests[runtime] = json;
}
const loaded = Object.entries(manifests);
if (loaded.length === 3) {
  for (const field of ['name', 'version', 'description']) {
    const values = new Set(loaded.map(([, m]) => m[field]));
    if (values.size !== 1) {
      fail(`manifests disagree on "${field}": ${loaded.map(([r, m]) => `${r}=${JSON.stringify(m[field])}`).join(', ')}`);
    }
  }
  const [, first] = loaded[0];
  if (first.name !== PLUGIN_NAME) fail(`plugin name must be "${PLUGIN_NAME}", got "${first.name}"`);
  if (!/^\d+\.\d+\.\d+$/.test(String(first.version))) fail(`version "${first.version}" is not semver x.y.z`);
  if (!first.description || !String(first.description).trim()) fail('plugin description must be non-empty');
  for (const [runtime, m] of loaded) {
    if ('hooks' in m) fail(`${runtime} manifest declares hooks; this plugin must be skills-only`);
    if ('userConfig' in m) fail(`${runtime} manifest declares userConfig; this plugin must be skills-only`);
  }
  if (manifests.codex && manifests.codex.skills !== './skills/') {
    fail(`codex manifest "skills" must be "./skills/", got ${JSON.stringify(manifests.codex.skills)}`);
  }
  if (manifests.claude && manifests.claude.extensions) {
    fail('claude manifest must not carry "extensions"; the OpenAI block lives in the codex manifest (strict Claude validation rejects unknown keys)');
  }
}

// 1b. OpenAI listing block ---------------------------------------------------------
// Limits from https://developers.openai.com/plugins/deploy/submission
if (manifests.codex) {
  const iface = manifests.codex.interface;
  if (!iface || typeof iface !== 'object') {
    fail('codex manifest has no "interface" block; the OpenAI portal fills the listing from it');
  } else {
    const limits = { displayName: 30, shortDescription: 30, longDescription: 4000, developerName: 80 };
    for (const [key, max] of Object.entries(limits)) {
      const v = iface[key];
      if (typeof v !== 'string' || !v.trim()) fail(`codex manifest interface.${key} is required`);
      else if (v.length > max) fail(`codex manifest interface.${key} is ${v.length} characters; the limit is ${max}`);
      else if (max === 30 && /\r|\n/.test(v)) fail(`codex manifest interface.${key} must be a single line`);
    }
    if (typeof iface.category !== 'string' || !iface.category.trim()) fail('codex manifest interface.category is required');
    for (const key of ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']) {
      const v = iface[key];
      if (typeof v !== 'string' || !/^https:\/\//.test(v)) fail(`codex manifest interface.${key} must be an https URL`);
      else if (v.length > 1024) fail(`codex manifest interface.${key} exceeds 1024 characters`);
    }
    if (manifests.claude && iface.displayName !== manifests.claude.displayName) {
      fail(`interface.displayName "${iface.displayName}" differs from the claude manifest displayName "${manifests.claude.displayName}"`);
    }
    const images = [['logo', iface.logo], ['composerIcon', iface.composerIcon], ...((iface.screenshots || []).map((s, i) => [`screenshots[${i}]`, s]))];
    if (manifests.claude && manifests.claude.icon) images.push(['claude icon', manifests.claude.icon]);
    for (const [label, ref] of images) {
      if (typeof ref !== 'string' || !ref.startsWith('./')) fail(`${label} must be a relative path starting with ./ (got ${JSON.stringify(ref)})`);
      else if (!existsSync(path.join(PLUGIN_DIR, ref))) fail(`${label} points at a missing file: ${ref}`);
      else if (!/\.(png|jpe?g|webp|svg)$/i.test(ref)) fail(`${label} must be PNG, JPEG, WebP or SVG: ${ref}`);
      else if (statSync(path.join(PLUGIN_DIR, ref)).size > 5 * 1024 * 1024) fail(`${label} is larger than 5 MiB: ${ref}`);
    }
    if (Array.isArray(iface.capabilities) && (iface.capabilities.length > 20 || iface.capabilities.some((c) => String(c).length > 120))) {
      fail('interface.capabilities allows at most 20 items of 120 characters');
    }
    if (iface.brandColor && !/^#[0-9A-Fa-f]{6}$/.test(iface.brandColor)) fail(`interface.brandColor must be a hex colour, got ${iface.brandColor}`);
  }
}

// 2. Skills ------------------------------------------------------------------
const skillsDir = path.join(PLUGIN_DIR, 'skills');
if (!existsSync(skillsDir)) {
  fail(`${rel(skillsDir)}: missing skills directory`);
} else {
  const skillFolders = readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  if (skillFolders.length === 0) fail('no skills found under plugins/open-commerce/skills/');
  for (const folder of skillFolders) {
    const skillFile = path.join(skillsDir, folder.name, 'SKILL.md');
    if (!existsSync(skillFile)) {
      fail(`${rel(skillFile)}: missing SKILL.md`);
      continue;
    }
    const text = readFileSync(skillFile, 'utf8');
    const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    if (!fm) {
      fail(`${rel(skillFile)}: missing YAML frontmatter`);
      continue;
    }
    const block = fm[1];
    const nameMatch = block.match(/^name:\s*(.+)$/m);
    const descMatch = block.match(/^description:\s*(.*)$/m);
    if (!nameMatch) fail(`${rel(skillFile)}: frontmatter has no "name"`);
    else if (nameMatch[1].trim() !== folder.name) {
      fail(`${rel(skillFile)}: frontmatter name "${nameMatch[1].trim()}" does not match folder "${folder.name}"`);
    }
    if (!descMatch) fail(`${rel(skillFile)}: frontmatter has no "description"`);
    else {
      // A folded scalar (">-") carries its text on the following indented lines.
      const inline = descMatch[1].trim();
      const folded = block.slice(block.indexOf(descMatch[0]) + descMatch[0].length).match(/^(?:[ \t]+.+\r?\n?)+/m);
      const content = /^[>|][-+]?$/.test(inline) ? (folded ? folded[0] : '') : inline;
      if (!content.trim()) fail(`${rel(skillFile)}: frontmatter description is empty`);
    }
    if (!/^#\s+/m.test(text.slice(fm[0].length))) fail(`${rel(skillFile)}: body has no heading`);
  }
}

// 3. No merchant data bundled --------------------------------------------------
if (existsSync(PLUGIN_DIR)) {
  for (const file of walk(PLUGIN_DIR)) {
    if (statSync(file).size > 2_000_000) fail(`${rel(file)}: unexpectedly large file (${statSync(file).size} bytes)`);
    const text = readFileSync(file, 'utf8');
    if (/"schema_version"\s*:\s*1\b/.test(text)) fail(`${rel(file)}: contains a store manifest ("schema_version": 1); merchant data must not be bundled`);
    if (/"stores"\s*:\s*\[\s*\{/.test(text)) fail(`${rel(file)}: contains a "stores" array of objects; merchant data must not be bundled`);
    if (file.endsWith('.json') && /"website"\s*:\s*"https:\/\//.test(text) && /"access"\s*:/.test(text)) {
      fail(`${rel(file)}: looks like a store manifest (website + access); merchant data must not be bundled`);
    }
  }
}

// 4. Marketplaces -----------------------------------------------------------------
const marketplaces = [
  { file: path.join(ROOT, '.claude-plugin', 'marketplace.json'), sourceOf: (p) => p.source },
  { file: path.join(ROOT, '.agents', 'plugins', 'marketplace.json'), sourceOf: (p) => p.source && p.source.path },
  { file: path.join(ROOT, '.cursor-plugin', 'marketplace.json'), sourceOf: (p) => p.source },
];
for (const { file, sourceOf } of marketplaces) {
  if (!existsSync(file)) {
    fail(`${rel(file)}: missing marketplace catalog`);
    continue;
  }
  const json = readJson(file);
  if (!json) continue;
  if (json.name !== 'opencommerceindex') fail(`${rel(file)}: marketplace name must be "opencommerceindex", got "${json.name}"`);
  if (!Array.isArray(json.plugins) || json.plugins.length === 0) {
    fail(`${rel(file)}: no plugins listed`);
    continue;
  }
  const entry = json.plugins.find((p) => p.name === PLUGIN_NAME);
  if (!entry) {
    fail(`${rel(file)}: no plugin named "${PLUGIN_NAME}"`);
    continue;
  }
  const source = sourceOf(entry);
  if (typeof source !== 'string') {
    fail(`${rel(file)}: plugin "${PLUGIN_NAME}" has no path source`);
    continue;
  }
  const target = path.resolve(ROOT, source);
  if (!existsSync(target) || !statSync(target).isDirectory()) fail(`${rel(file)}: source "${source}" does not exist`);
  else if (path.resolve(target) !== path.resolve(PLUGIN_DIR)) fail(`${rel(file)}: source "${source}" does not point at plugins/open-commerce`);
}

// Report ---------------------------------------------------------------------------
if (problems.length) {
  console.error(`validate: ${problems.length} problem(s)`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
const version = manifests.claude ? manifests.claude.version : '?';
console.log(`validate: ok (open-commerce ${version}; manifests in sync, OpenAI listing block complete, skills well-formed, no merchant data, marketplaces resolve)`);
