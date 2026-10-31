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

1. Build the archive: `npm run pack:chatgpt` → `dist/open-commerce-<version>.zip` with
   `.claude-plugin/plugin.json` (non-empty description) and `skills/shop/`. No hooks, no
   `userConfig`, no commands or agents: this plugin has none.
2. Content rules: provider-neutral language inside the skill (no vendor names; the skill
   and its references use "the runtime" and "the assistant"); no artifact instructions.
3. In the portal: **Create plugin → Skills only**, upload the archive, review the generated
   `.codex-plugin/plugin.json`, test the skills in a clean environment, fill the listing and
   review fields, fix every scan result, submit the draft.
4. After approval, record the install path on the site's ChatGPT page and in the
   compatibility matrix.

## Not covered by either listing

Codex and Cursor install from this repository's marketplaces directly; no submission exists
for them. Other agents copy the skill folder.
