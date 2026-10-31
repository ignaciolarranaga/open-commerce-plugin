#!/usr/bin/env node
// Builds two archives in dist/:
//   open-commerce-<version>.zip      skills-only plugin for the ChatGPT submission path
//   open-commerce-skill-shop.zip     the `shop` skill folder alone (SKILL.md at the zip root),
//                                    for manual upload to Claude.ai and other clients that take a skill zip
//
// Contents, relative to the zip root:
//   .claude-plugin/plugin.json   (must carry a non-empty description)
//   skills/<name>/SKILL.md       (+ references/ under each skill)
//
// Nothing else: no hooks, no userConfig, no README, no marketplace files.
// Uses the `zip` CLI (present on macOS and ubuntu runners). Node 22, no dependencies.

import { readFileSync, existsSync, mkdirSync, rmSync, cpSync, readdirSync } from 'node:fs';
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

const result = spawnSync('zip', ['-r', '-X', '-q', zipPath, '.claude-plugin', 'skills'], { cwd: staging, encoding: 'utf8' });
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
