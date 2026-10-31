# Maintainers guide

Everything a maintainer does in this repository: validating, testing a client, recording
results, bumping versions, cutting a release, and building the ChatGPT package.

## Prerequisites

- Node 22 or newer (`node --version`).
- The `zip` CLI (present on macOS and Ubuntu; `apt-get install zip` otherwise).
- Claude Code CLI for the Anthropic-side validation (`claude plugin validate`).
- `gh` CLI with push rights, or the ability to trigger GitHub Actions.

## Validate

```bash
node scripts/validate.js                        # manifests in sync, skills well-formed, no merchant data, marketplaces resolve
claude plugin validate ./plugins/open-commerce  # Claude Code plugin manifest
claude plugin validate .                        # Claude Code marketplace catalog
```

CI (`.github/workflows/validate.yml`) runs `scripts/validate.js` and a packaging smoke
test on every push and pull request. The Claude CLI validation is not run in CI because
the CLI is not available there without authentication; run it locally before a release.

## Test a client

1. Install the plugin in the client exactly as `README.md` tells a user to. For Claude
   Code, local testing without publishing works with:

   ```bash
   claude plugin marketplace add /absolute/path/to/open-commerce-plugin
   claude plugin install open-commerce@opencommerceindex
   ```

   Remove with `claude plugin uninstall open-commerce@opencommerceindex` and
   `claude plugin marketplace remove opencommerceindex`.
2. Copy `evals/run-log.template.md` to `evals/runs/<YYYY-MM-DD>-<client>.md`.
3. Run the queries from `evals/queries.json`. Minimum set for a compatibility row: q01,
   q02, q16, q17, q19 plus five others of your choice. Type the `query` text as the
   prompt, without naming the skill, to check triggering; if it does not trigger, note
   it and invoke the skill by name.
4. For every offer the assistant reports, open the source URL yourself and confirm the
   title and price. A price that cannot be found on the source page is a `fail`.
5. Fill the run log, including the raw answers.

## Record a result

1. Commit the run file under `evals/runs/`.
2. Update the client's row in `docs/compatibility.md`: label, observed limitations, test
   date linking to the run file.
3. If the run exposed a client-specific behaviour (URL refusals, missing tables, timeouts),
   add it to the runtime notes in
   `plugins/open-commerce/skills/shop/references/retrieval-patterns.md`.
4. Open a PR; the validator must pass.

## Bump the version

The three plugin manifests must carry identical `name`, `version` and `description`:

```
plugins/open-commerce/.claude-plugin/plugin.json
plugins/open-commerce/.codex-plugin/plugin.json
plugins/open-commerce/.cursor-plugin/plugin.json
```

Edit all three in the same commit (semver: patch for wording fixes, minor for new
behaviour or a new skill, major for a change in what the skill promises). Then:

```bash
node scripts/validate.js
grep '"version"' plugins/open-commerce/.*-plugin/plugin.json
```

Do not add `hooks` or `userConfig` to the Claude manifest; the ChatGPT package is built
from it and must stay skills-only. Do not add custom keys to it either: the Claude Code
CLI rejects unknown keys such as `metadata`.

## Cut a release

Every version bump gets a tag `v<version>` and a GitHub release with the ChatGPT zip
attached.

Option A, from a machine with `gh`:

```bash
git tag v<version> && git push origin v<version>
node scripts/pack.js
gh release create v<version> --title "v<version>" --notes "<markdown notes>" dist/open-commerce-<version>.zip dist/open-commerce-skill-shop.zip
```

Option B, the Release workflow (`.github/workflows/release.yml`, `workflow_dispatch`),
for environments without tag-push rights:

- `version`: the new version without the `v` prefix.
- `target`: the commit SHA or branch to tag (normally `main` after the bump merged).
- `notes`: markdown release notes.

The workflow checks that every manifest at the target reports exactly `version`, runs
the validator, builds the zip, and creates the tag and the release with the zip
attached. Trigger it with `gh workflow run release.yml -f version=... -f target=... -f notes=...`
or from the Actions tab.

Release notes should say what changed in the skill's behaviour and whether any
compatibility row changed. Never state or imply vendor approval.

## Build the ChatGPT package

```bash
npm run pack          # both archives; or: node scripts/pack.js
npm run pack:plugin   # only dist/open-commerce-<version>.zip
npm run pack:skill    # only dist/open-commerce-skill-shop.zip
unzip -l dist/open-commerce-<version>.zip
```

The zip contains `.claude-plugin/plugin.json` (with a non-empty description),
`.codex-plugin/plugin.json` (with the OpenAI listing block `interface`), a generated root
`plugin.json` that mirrors that block under `extensions."com.openai"`, the images under
`assets/`, and `skills/<name>/SKILL.md` plus each skill's `references/`. No hooks, no
`userConfig`, no README, no marketplace files. `dist/open-commerce-skill-shop.zip` is the
`skills/shop` folder alone, which Claude.ai users upload manually.

Submitting the package to OpenAI is a separate, manual step that this repository does
not automate; until it happens, `docs/compatibility.md` keeps the ChatGPT row as
`planned`.

## When the index changes

The skill reads the live index and the schema version is recorded in
`plugins/open-commerce/README.md`. If the data repository publishes a new
`schema_version` or changes the country-file shape, update `SKILL.md` Step 1, the
references, and the plugin README in one PR, bump the minor version, and re-run at
least one client eval.

## Automated eval suite

`plugins/open-commerce/evals/` holds a `claude plugin eval` suite (five cases: the LatteGo
primary query, an unrelated request that must not trigger the skill, a destination outside
coverage, a nonsense product, and an English laptop query). Each case has a `tool_used`
grader for the skill, a cheap deterministic grader where possible, and an `llm` rubric
written as PASS and FAIL conditions. Run it from the plugin root with the network tools the
skill needs granted explicitly (requires Claude Code 2.1.269 or later):

```sh
npm run evals                                  # 3 runs per case, with the no-plugin baseline
EVAL_RUNS=1 EVAL_ABLATION=none npm run evals   # cheaper single pass
```

`scripts/run-evals.sh` holds the models, threshold, cost cap and network grants shared with CI.
Add a `WebFetch(domain:…)` grant there for every store you expect the skill to reach. Results land in
`plugins/open-commerce/evals/results/` (gitignored). The manual query set in `evals/queries.json`
at the repository root is the longer list for hands-on runs in other clients; record those with
`evals/run-log.template.md`.

## Eval gate

Until the `ANTHROPIC_API_KEY` repository secret is set, the gate runs in Claude Code: the
project hook in `.claude/settings.json` calls `scripts/eval-gate.sh` before any `git push`
Claude runs in this repository. When the commits not yet on the remote change the skill, its
evals, the plugin manifest or `scripts/run-evals.sh`, it runs the suite (one run, no
baseline; override with `EVAL_RUNS` and `EVAL_ABLATION`) and blocks the push when a case
scores below 0.8. The log lands in `plugins/open-commerce/evals/results/eval-gate.log`.
Pushes from your own terminal are not gated; run `npm run evals` first. Mention the result in
the PR description.

`.github/workflows/evals.yml` runs the same script. Its `pull_request` trigger is commented
out until the secret exists; re-enable it then. When enabled it runs the automated suite on pull requests touching the skill, the evals or the plugin manifest, with `--threshold 0.8`, pinned models (`claude-sonnet-5` under test, `claude-haiku-4-5` as judge) and a USD 20 cost cap. It requires the `ANTHROPIC_API_KEY` repository secret. Make `evals` a required check in the `main` ruleset after its first green run. A run can also be started by hand from the Actions tab with a custom run count or `--ablation none`.
