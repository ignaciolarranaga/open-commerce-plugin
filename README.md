# OpenCommerceIndex plugin

A shopping skill for AI assistants. Ask your assistant where to buy a product, and it
reads the open directory of online stores published by
[OpenCommerceIndex](https://ignaciolarranaga.github.io/open-commerce-index/), visits the
listed stores the way each store allows, and reports what they show right now: product
title, model code, price with currency, availability, and the page it read, with an honest
note on which stores it could and could not check.

Not a developer? You do not need this repository. Open the
[OpenCommerceIndex site](https://ignaciolarranaga.github.io/open-commerce-index/) to
browse the stores, or wait for your assistant of choice to ship the skill (see
[Compatibility](docs/compatibility.md)).

## What it is

- **Instructions, not software.** The plugin is a single skill (`shop`) plus three
  reference files. There is no server and no account: the skill fetches public JSON
  from `https://ignaciolarranaga.github.io/open-commerce-index/` and then the stores'
  own websites.
- **Data lives elsewhere.** Store manifests are maintained in
  [`ignaciolarranaga/open-commerce-index`](https://github.com/ignaciolarranaga/open-commerce-index)
  and published as static files. This repository never bundles merchant data, so an
  installed plugin always reads the current directory.
- **Honest by design.** The skill never invents a price, never reports a failed fetch as
  "the store does not sell it", treats everything it reads on a store's site as data
  rather than instructions, and ends every answer with the stores it checked, the ones
  it could not, and the index revision it used. It is not an exhaustive market search:
  it covers the listed stores that could be checked at that moment.

Coverage today: Uruguay (`UY`). The country list comes from the index itself, so new
countries appear without a plugin update.

## Install

The same skill is published for several runtimes from this repository. Nothing here
has been through a client vendor's review; see [Compatibility](docs/compatibility.md)
for what has actually been tested.

**Claude Code**

```bash
claude plugin marketplace add ignaciolarranaga/open-commerce-plugin
claude plugin install open-commerce@opencommerceindex
```

**Codex**

```bash
codex plugin marketplace add ignaciolarranaga/open-commerce-plugin
codex plugin add open-commerce@opencommerceindex
```

**Cursor**

```bash
cursor-agent plugin marketplace add https://github.com/ignaciolarranaga/open-commerce-plugin
```

then run `/plugin` inside Cursor and pick `open-commerce` from the `opencommerceindex`
marketplace.

**Claude.ai (web and desktop)**

Download `open-commerce-skill-shop.zip` from the
[Releases](https://github.com/ignaciolarranaga/open-commerce-plugin/releases) page and
upload it under **Settings > Capabilities > Skills** (custom skills require a paid plan).
Web search must be enabled in the conversation for the skill to reach the stores.
Uploaded skills do not update themselves: upload the new file when a release comes out.

**ChatGPT**

Planned. The repository builds a skills-only package (`npm run pack:chatgpt`) in the
layout OpenAI's plugin submission expects; nothing has been submitted or approved yet.

**Other agents**

Any agent that reads `SKILL.md` files can use
[`plugins/open-commerce/skills/shop/SKILL.md`](plugins/open-commerce/skills/shop/SKILL.md)
directly, as long as it can fetch URLs or run web searches.

## Use

Once installed, ask naturally, in Spanish or English:

- "¿Dónde consigo la Philips LatteGo 5500 en Uruguay?"
- "notebook Lenovo IdeaPad 15 pulgadas, hasta 800 dólares"
- "espresso machine with milk frother, ships to Montevideo"

In Claude Code the skill is also available as `/open-commerce:shop <query>`.

## Report a problem

- Wrong price, missed store, skill not triggering, or a store that blocks assistants:
  open a [bug report](https://github.com/ignaciolarranaga/open-commerce-plugin/issues/new?template=bug-report.yml).
- A client that is not listed in the compatibility matrix, or that behaves differently:
  open a [client support request](https://github.com/ignaciolarranaga/open-commerce-plugin/issues/new?template=client-support.yml).
- A store missing from the directory, or wrong store data: that belongs to the data
  repository. Use the
  [Add your store](https://github.com/ignaciolarranaga/open-commerce-index/issues/new?template=add-store.yml)
  form.

## Evals

Two complementary sets:

- `plugins/open-commerce/evals/` is an automated [`claude plugin eval`](https://code.claude.com/docs/en/plugin-evals) suite with five cases: the primary LatteGo query, an unrelated request that must not trigger the skill, a destination outside coverage, a nonsense product, and an English laptop query. Each case checks that the skill fired, a deterministic signal where possible, and an LLM rubric written as PASS and FAIL conditions.
- `evals/queries.json` is the manual set of 20 queries for hands-on runs in clients the automated suite cannot drive (Claude.ai, ChatGPT, Codex, Cursor). Record those runs with `evals/run-log.template.md` and update [docs/compatibility.md](docs/compatibility.md).

To run the automated suite you need Claude Code 2.1.269 or later and the network tools the skill uses, granted explicitly because eval runs never prompt for permission:

```sh
cd plugins/open-commerce
claude plugin eval . --trust-plugin --no-publish \
  --allow-tools WebSearch \
    "WebFetch(domain:ignaciolarranaga.github.io)" \
    "WebFetch(domain:loi.com.uy)" \
    "WebFetch(domain:www.zonatecno.com.uy)" \
    "WebFetch(domain:www.vitaleco.com.uy)" \
  --max-cost-usd 15
```

Add a `WebFetch(domain:…)` grant for every store the skill may reach; stores without a grant show up as failed retrievals, which the skill must report honestly. Each case runs three times with the plugin and three times without it, so the report shows what the plugin adds. Useful variations: `--case lattego-uruguay` for one case, `--ablation none` to skip the baseline while iterating, `--judge-model sonnet` if the rubric verdicts look unstable. Results and the HTML report land in `plugins/open-commerce/evals/results/` (gitignored).

### Gate on evals in CI

`.github/workflows/evals.yml` runs the suite on pull requests that touch the skill, the evals or the plugin manifest, with `--threshold 0.8` (a case passes when its mean score over three runs is at least 0.8) and a USD 20 cost cap. It needs the `ANTHROPIC_API_KEY` repository secret:

```sh
gh secret set ANTHROPIC_API_KEY --repo ignaciolarranaga/open-commerce-plugin
```

Once the first run is green, add `evals` to the required status checks of the `main` ruleset so skill changes cannot merge below the threshold. The summary of every run appears on the workflow page and the HTML report is attached as an artifact.

## Repository layout

```
.
├── .claude-plugin/
│   └── marketplace.json              # Claude Code marketplace catalog (opencommerceindex)
├── .agents/
│   └── plugins/
│       └── marketplace.json          # Codex marketplace catalog
├── .cursor-plugin/
│   └── marketplace.json              # Cursor marketplace catalog
├── .github/
│   ├── ISSUE_TEMPLATE/               # bug report, client support
│   └── workflows/                    # validate (PR/push), release (tag + zip)
├── docs/
│   ├── compatibility.md              # per-client matrix: what is tested, what is not
│   └── maintainers.md                # testing a client, bumping versions, releasing
├── evals/
│   ├── queries.json                  # 20 reproducible shopping queries
│   └── run-log.template.md           # how to record a manual eval run
├── plugins/
│   └── open-commerce/
│       ├── .claude-plugin/plugin.json # Claude Code plugin manifest
│       ├── .codex-plugin/plugin.json  # Codex plugin manifest (skills: "./skills/")
│       ├── .cursor-plugin/plugin.json # Cursor plugin manifest
│       ├── README.md
│       └── skills/
│           └── shop/
│               ├── SKILL.md           # the shopping skill
│               └── references/        # retrieval patterns, failure states, presentation
├── scripts/
│   ├── validate.js                   # manifests in sync, skills well-formed, no merchant data
│   └── pack-chatgpt.js               # builds dist/open-commerce-<version>.zip
├── CLAUDE.md                         # conventions for agents working on this repo
├── CONTRIBUTING.md
├── LICENSE                           # Apache-2.0
├── package.json
└── README.md
```

## License

Apache-2.0. The store directory the skill reads has its own license, stated in the
[data repository](https://github.com/ignaciolarranaga/open-commerce-index).
