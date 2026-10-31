# Compatibility

Status of the `shop` skill per client. Nothing in this table has been through a vendor
review process, and no vendor has approved or listed this plugin. A row is `tested` only
after an eval run recorded with `evals/run-log.template.md` against the queries in
`evals/queries.json`; the run file is linked in the "test date" column.

Labels:

- **tested**: an eval run exists for this client and version; limitations are observed.
- **experimental**: installable today, no recorded eval run yet; limitations are
  expected from the client's documented tool behaviour, not observed.
- **planned**: install path not yet available (submission pending, format not final).
- **unsupported**: known not to work and no plan to support.

| client | product surface | install path | index file retrieval | merchant access | limitations | label | test date |
|---|---|---|---|---|---|---|---|
| Claude Code (CLI) 2.1.x | Terminal agent; skill invoked automatically or as `/open-commerce:shop` | `claude plugin marketplace add ignaciolarranaga/open-commerce-plugin` then `claude plugin install open-commerce@opencommerceindex` | `WebFetch` on the absolute index URLs (expected to work; untested) | `WebFetch` to filled search templates and JSON endpoints; `WebSearch` for search-first; shell `curl` if the user permits Bash | `WebFetch` returns a model-processed summary of the page, so the skill must ask for verbatim titles/prices; permission prompts per domain in default mode | experimental | untested |
| Claude.ai (web, desktop) | Chat with custom Skills (paid plans) | Download `open-commerce-skill-shop.zip` from Releases and upload it under Settings > Capabilities > Skills | `web_fetch` on URLs literally present in the skill (expected to work; untested) | `web_fetch` refuses URLs not already in context, so filled search templates may be refused; search-first via `web_search` is the expected main route | Table rendering fine; no shell; per-conversation tool limits may cap the number of stores checked | experimental | untested |
| Claude mobile apps | Chat with Skills enabled on the account | Same as Claude.ai (skills sync with the account) | As Claude.ai | As Claude.ai | Unverified whether custom skills are exposed on mobile | planned | untested |
| Codex CLI | Terminal agent with marketplace plugins | `codex plugin marketplace add ignaciolarranaga/open-commerce-plugin` then `codex plugin add open-commerce@opencommerceindex` | Shell `curl` (network access depends on sandbox mode) | Shell `curl` to endpoints and search pages; no built-in web search in all modes | Sandbox may block network by default; user must allow it. Skill discovery through `skills: "./skills/"` is assumed from the Codex plugin format and untested | experimental | untested |
| Codex (IDE extension, cloud) | Codex in VS Code / cloud tasks | Same marketplace catalog (`.agents/plugins/marketplace.json`) | Depends on the surface's network policy | Depends on the surface's network policy | Not verified that plugins from a local-path marketplace load in these surfaces | planned | untested |
| Cursor (agent) | Cursor chat / cursor-agent with plugins | `cursor-agent plugin marketplace add https://github.com/ignaciolarranaga/open-commerce-plugin` then `/plugin` | Agent web fetch or shell | Agent web fetch or shell | Cursor plugin manifest format mirrored from a working reference repo; skill auto-triggering behaviour not verified | experimental | untested |
| ChatGPT (plugins / Apps with skills) | ChatGPT chat with an installed skills-only plugin | Pending: package built by `npm run pack:chatgpt` (`.claude-plugin/plugin.json` + `skills/`), submission not made | ChatGPT browsing on the index URLs | ChatGPT browsing on store pages; JSON endpoints come back as raw text | Submission process, review and listing are outside this project's control; no approval exists or is implied | planned | untested |
| Other agents reading `SKILL.md` (e.g. custom Agent SDK apps, open-source agents) | Any | Copy `plugins/open-commerce/skills/shop/` into the agent's skills folder | Agent's fetch tool | Agent's fetch/search tools | Behaviour depends entirely on the agent's tools and instruction following | experimental | untested |

## Recording a result

1. Run the eval queries in the client (at least q01, q02, q16, q17, q19, plus any five
   others) and fill `evals/run-log.template.md` as `evals/runs/<date>-<client>.md`.
2. Update the row: label (`tested` if the run completed, regardless of pass rate),
   observed limitations, and the test date linking to the run file.
3. If the client needs a different install path or tool behaviour than documented,
   update the skill's `references/retrieval-patterns.md` runtime notes in the same PR.

## Known gaps across all clients

- Stores with `rendering: client` and no JSON endpoint can only be reached through
  search-first, which depends on the client having a web-search tool.
- Stores with `bot_protection: challenge|blocked` or `robots.ai_user_agents: disallowed`
  are reported, not fetched.
- The skill caps candidates at 6–8 stores per query; large country files will need
  category shards in the index (reserved in the index schema) and a tighter selection.
