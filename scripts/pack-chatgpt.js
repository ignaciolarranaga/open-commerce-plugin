#!/usr/bin/env node
// Builds two archives in dist/:
//   open-commerce-<version>.zip      skills-only plugin for the ChatGPT submission path
//   open-commerce-skill-shop.zip     the `shop` skill folder alone (SKILL.md at the zip root),
//                                    for manual upload to Claude.ai and other clients that take a skill zip
//
// Contents, relative to the zip root:
//   .claude-plugin/plugin.json   (must carry a non-empty description)
//   .codex-plugin/plugin.json    (carries the OpenAI listing block `interface`)
//   plugin.json                  (generated: Agent Plugins manifest with extensions."com.openai".interface,
//                                 so the OpenAI portal fills the listing from the archive)
//   assets/<icon files>          (every image the manifests reference)
//   skills/<name>/SKILL.md       (+ references/ under each skill)
//
// Nothing else: no hooks, no userConfig, no README, no marketplace files.
// Uses the `zip` CLI (present on macOS and ubuntu runners). Node 22, no dependencies.

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, cpSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN_DIR = path.join(ROOT, 'plugins', 'open-commerce');
const DIST = path.join(ROOT, 'dist');

function die(msg) {
  console.error(`pack-chatgpt: ${msg}`);
  process.exit(1);
}

const manifestFile = path.join(PLUGIN_DIR, '.claude-plugin', 'plugin.json');
if (!existsSync(manifestFile)) die(`missing ${path.relative(ROOT, manifestFile)}`);
const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
if (!manifest.name) die('plugin manifest has no name');
if (!/^\d+\.\d+\.\d+$/.test(String(manifest.version))) die(`plugin version "${manifest.version}" is not semver`);
if (!manifest.description || !String(manifest.description).trim()) die('plugin manifest description must be non-empty');
if ('hooks' in manifest) die('plugin manifest declares hooks; the submission must be skills-only');
if ('userConfig' in manifest) die('plugin manifest declares userConfig; the submission must be skills-only');

const codexFile = path.join(PLUGIN_DIR, '.codex-plugin', 'plugin.json');
if (!existsSync(codexFile)) die(`missing ${path.relative(ROOT, codexFile)}`);
const codex = JSON.parse(readFileSync(codexFile, 'utf8'));
const iface = codex.interface;
if (!iface || typeof iface !== 'object') die('codex manifest has no "interface" block; the OpenAI listing is filled from it');
for (const key of ['displayName', 'shortDescription', 'longDescription', 'developerName', 'category', 'websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL', 'logo', 'composerIcon']) {
  if (!iface[key]) die(`codex manifest interface.${key} is required for the OpenAI listing`);
}
const imageRefs = [iface.logo, iface.composerIcon, ...(iface.screenshots || []), manifest.icon].filter(Boolean);
for (const ref of imageRefs) {
  if (!ref.startsWith('./')) die(`image path ${ref} must be relative and start with ./`);
  if (!existsSync(path.join(PLUGIN_DIR, ref))) die(`referenced image ${ref} is missing`);
}

const skillsDir = path.join(PLUGIN_DIR, 'skills');
if (!existsSync(skillsDir)) die('missing skills/ directory');
const skills = readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
if (skills.length === 0) die('no skills to pack');
for (const s of skills) {
  if (!existsSync(path.join(skillsDir, s, 'SKILL.md'))) die(`skills/${s}/SKILL.md is missing`);
}

const zipCheck = spawnSync('zip', ['-v'], { encoding: 'utf8' });
if (zipCheck.error || zipCheck.status !== 0) {
  die('the `zip` command-line tool is required and was not found on PATH (install it with your package manager, e.g. `apt-get install zip` or `brew install zip`)');
}

const staging = path.join(os.tmpdir(), `open-commerce-pack-${process.pid}`);
rmSync(staging, { recursive: true, force: true });
mkdirSync(path.join(staging, '.claude-plugin'), { recursive: true });
cpSync(manifestFile, path.join(staging, '.claude-plugin', 'plugin.json'));
mkdirSync(path.join(staging, '.codex-plugin'), { recursive: true });
cpSync(codexFile, path.join(staging, '.codex-plugin', 'plugin.json'));
for (const ref of new Set(imageRefs)) {
  mkdirSync(path.dirname(path.join(staging, ref)), { recursive: true });
  cpSync(path.join(PLUGIN_DIR, ref), path.join(staging, ref));
}
// Portable root manifest (Agent Plugins format). OpenAI reads its listing from
// extensions."com.openai".interface when present; the Claude manifest stays free of
// that key because `claude plugin validate --strict` rejects unknown fields.
const portable = {
  $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
  name: manifest.name,
  version: manifest.version,
  description: manifest.description,
  author: manifest.author,
  homepage: manifest.homepage,
  repository: manifest.repository,
  license: manifest.license,
  keywords: manifest.keywords,
  skills: './skills/',
  extensions: { 'com.openai': { interface: iface } },
};
writeFileSync(path.join(staging, 'plugin.json'), `${JSON.stringify(portable, null, 2)}\n`);
cpSync(skillsDir, path.join(staging, 'skills'), {
  recursive: true,
  filter: (src) => {
    const base = path.basename(src);
    return base !== '.DS_Store' && !base.startsWith('._');
  },
});

mkdirSync(DIST, { recursive: true });
const zipName = `${manifest.name}-${manifest.version}.zip`;
const zipPath = path.join(DIST, zipName);
rmSync(zipPath, { force: true });

const result = spawnSync('zip', ['-r', '-X', '-q', zipPath, '.'], { cwd: staging, encoding: 'utf8' });
rmSync(staging, { recursive: true, force: true });
if (result.error || result.status !== 0) die(`zip failed: ${result.error ? result.error.message : result.stderr}`);

function report(file) {
  const listing = spawnSync('unzip', ['-Z1', file], { encoding: 'utf8' });
  console.log(`pack-chatgpt: wrote ${path.relative(ROOT, file)}`);
  if (!listing.error && listing.status === 0) {
    for (const line of listing.stdout.trim().split('\n')) console.log(`  ${line}`);
  }
}
report(zipPath);

// Skill-only archive: SKILL.md at the root, as Claude.ai's skill upload expects.
for (const skill of skills) {
  const skillZip = path.join(DIST, `${manifest.name}-skill-${skill}.zip`);
  rmSync(skillZip, { force: true });
  const skillResult = spawnSync('zip', ['-r', '-X', '-q', skillZip, '.', '-x', '.DS_Store', '-x', '*/.DS_Store', '-x', '._*'], { cwd: path.join(skillsDir, skill), encoding: 'utf8' });
  if (skillResult.error || skillResult.status !== 0) die(`zip failed for skill ${skill}: ${skillResult.error ? skillResult.error.message : skillResult.stderr}`);
  report(skillZip);
}
