# Publishing to the assistant directories

Two public listings are possible for the `shop` skill. Both are submitted by a human from
the project owner's accounts; this page is the checklist. Status is tracked in
[compatibility.md](compatibility.md).

## Anthropic directory (claude.ai, Cowork, Claude Code via account sync)

Portal: https://claude.ai/directory/manage (paid claude.ai plan, GitHub account connected,
push access to this repository).

1. Pre-checks, all satisfied in this repository: `plugins/open-commerce/.claude-plugin/plugin.json`
   with `name`, `displayName`, `version`, `description`, `author`, `license`, `icon`,
   `documentationUrl`, `supportUrl`, `privacyPolicyUrl`, `termsOfServiceUrl`; a README of
   more than 40 words in the plugin folder that discloses what the plugin fetches; no system
   files; every file under 256 KiB; `claude plugin validate --strict ./plugins/open-commerce`
   passes.
2. In the portal: **Submit new → Plugin bundle**. Repository `ignaciolarranaga/open-commerce-plugin`,
   plugin path `plugins/open-commerce`, tracked branch `main` (or a release tag to publish
   only tagged versions).
3. **Validate**, fix anything marked Blocking, re-validate.
4. **Data handling**: reads no personal data; sends nothing to services other than the
   public directory and the listed stores' public pages through the assistant's own tools;
   keeps no data; not intended for people under 18 specifically.
5. **Compliance**: contact email, four acknowledgements. Policy point to expect a question
   on: the plugin reads merchant websites the project does not control. The README states
   this and that access follows each store's profile and `robots.txt`.
6. **Submit for review**, then **Publish** when the version passes. Later releases: bump
   `version` in the three manifests, merge to `main`, the directory picks it up.

After listing, update the Claude.ai page on the site and the compatibility matrix: the
install path becomes "Add from the directory" instead of the manual zip upload.

## OpenAI (ChatGPT, skills-only plugin)

Portal: https://platform.openai.com/plugins (organization with identity verification and
Apps Management write access).

1. Listing fields are read from the archive, not typed in the portal. They live in the
   `interface` block of `plugins/open-commerce/.codex-plugin/plugin.json`, and
   `scripts/pack-chatgpt.js` copies them into a root `plugin.json`
   (`extensions."com.openai".interface`) so either import route finds them. Limits enforced
   by `node scripts/validate.js`: `displayName` and `shortDescription` (the subtitle) at most
   30 characters, `longDescription` at most 4000, `developerName` at most 80, `category`,
   the four https URLs `websiteURL`, `supportURL`, `privacyPolicyURL`,
   `termsOfServiceURL`, and `logo` plus `composerIcon` as relative paths under `assets/`
   (square PNG, JPEG, WebP or SVG, 48 to 4096 px, under 5 MiB). The Claude manifest does not
   carry this block: `claude plugin validate --strict` rejects unknown keys.
2. Build the archive: `npm run pack:chatgpt` → `dist/open-commerce-<version>.zip` with
   `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, the generated `plugin.json`,
   `assets/` and `skills/shop/`. No hooks, no `userConfig`, no commands or agents: this
   plugin has none.
3. Content rules: provider-neutral language inside the skill (no vendor names; the skill
   and its references use "the runtime" and "the assistant"); no artifact instructions.
4. In the portal: **Create plugin → Skills only**, upload the archive, check that the
   listing fields were imported, test the skills in a clean environment, fill the
   review fields, fix every scan result, submit the draft. The portal's `category` list
   has no shopping entry (Productivity, Creativity, Developer Tools, Business & Operations,
   Data & Analytics, Communication, Education & Research, Security, Finance, Healthcare,
   Travel, Entertainment, Other), so the manifest uses `Other`; the validator enforces the
   list.
5. Known blocker (checked 2026-10-31): the portal answered "We are not accepting more
   skills-only submissions at this time" on a draft that passed every other check. That is
   a directory policy, not a package defect. Evidence at that date: the "Skills only"
   option started disappearing from other developers' portals around 2026-09-26, the same
   message has been reported publicly since 2026-10-23, OpenAI's docs still describe the
   path and say only that skills-only plugins "may be subject to additional eligibility
   requirements", and no reason or reopening date has been published. The draft stays
   saved in the portal; re-check it before each release. The only documented alternative
   is a remote MCP server over HTTPS, a hosted component this project does not have, so
   the ChatGPT page on the site keeps the manual path and the compatibility row stays
   `planned`.
6. After approval, record the install path on the site's ChatGPT page and in the
   compatibility matrix.

## Not covered by either listing

Codex and Cursor install from this repository's marketplaces directly; no submission exists
for them. Other agents copy the skill folder.
