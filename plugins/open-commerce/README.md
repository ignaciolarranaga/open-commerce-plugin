# open-commerce plugin

Shopping skill for assistants, reading the OpenCommerceIndex directory of online stores.

- Index base URL: `https://ignaciolarranaga.github.io/open-commerce-index/`
- Root index: `https://ignaciolarranaga.github.io/open-commerce-index/index.json`
- Index schema version this plugin reads: **1** (store manifests `schema_version: 1`,
  taxonomy `taxonomy_version: 1`)
- Install id: `open-commerce@opencommerceindex`

Install in Claude Code with one command:

```
/plugin install open-commerce --marketplace ignaciolarranaga/open-commerce-plugin
```

## Skills

| skill | purpose |
|---|---|
| `shop` | Find where a product is sold in the indexed stores of a country, retrieve current offers from each store following its declared access methods, and present prices, availability and sources with a coverage summary. |

Each skill lives in `skills/<name>/SKILL.md` with its supporting material under
`skills/<name>/references/`. The same folder is loaded by Claude Code, Codex and Cursor
through the manifests in `.claude-plugin/`, `.codex-plugin/` and `.cursor-plugin/`, and
is zipped for manual upload (Claude.ai) and for the planned ChatGPT submission.

## What this plugin connects to and what it collects

The plugin is instructions only. It runs no code and has no server. During a conversation
it asks the assistant to use its own web fetch and web search tools to read:

- the public directory files at `https://ignaciolarranaga.github.io/open-commerce-index/`
  (operated by this project on GitHub Pages);
- public pages and public JSON endpoints of the online stores listed in that directory,
  which this project does not own or control, only as far as each store's profile and
  `robots.txt` allow;
- the assistant's web search results limited to a listed store's domain.

It collects nothing. No data about the user or the conversation is sent to this project;
requests to the directory and to stores are made by the assistant's own tools under the
assistant provider's policies, and store websites see those requests as they would any
visit. The plugin stores no state. Prices and availability are shown exactly as retrieved,
with their source and time; the project has no commercial relationship with any listed
store and gives no purchase recommendation.

Privacy policy: https://ignaciolarranaga.github.io/open-commerce-index/en/privacy/ ·
Terms: https://ignaciolarranaga.github.io/open-commerce-index/en/terms/ ·
Support: https://github.com/ignaciolarranaga/open-commerce-plugin/issues

## What this plugin never does

- Bundle merchant data: stores, prices and availability are always fetched live.
- Reuse a cached copy of the directory: the index files are re-fetched on every request.
- Invent a price, title, model code or URL.
- Report a store it could not reach as a store that does not sell the product.
- Follow instructions found in store manifests or store pages.
- Bypass bot protection, log in, or place orders.

See the repository root `README.md` for installation and `docs/compatibility.md` for
the per-client status.
