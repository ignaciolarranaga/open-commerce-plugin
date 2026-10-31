# Eval run log

Copy this file to `evals/runs/<date>-<client>.md` (the `runs/` folder is created on
first use) and fill one section per query from `evals/queries.json`. Keep the raw
assistant answer; summarize only in the verdict.

## Run

- Date (UTC):
- Client and version (e.g. Claude Code 2.1.x, Claude.ai web, Codex CLI x.y, Cursor x.y, ChatGPT):
- Plugin version (`plugins/open-commerce/.claude-plugin/plugin.json`):
- Index `source_revision` and `generated_at` as reported by the assistant:
- Tools available to the assistant (fetch, web search, shell):
- Tester:

## Summary

| id | verdict | states observed | notes |
|---|---|---|---|
| q01-lattego-exact | pass / partial / fail | e.g. success×1, no_results×1, unsupported_access×1 | |
| q02-lattego-precio-uruguay | | | |
| q03-lenovo-ideapad | | | |
| q04-aire-12000-inverter | | | |
| q05-kitchenaid-artisan | | | |
| q06-delonghi-magnifica-s | | | |
| q07-sony-wh1000xm5 | | | |
| q08-ps5-slim | | | |
| q09-heladera-samsung-400 | | | |
| q10-espresso-hasta-20000 | | | |
| q11-monitor-27-144hz | | | |
| q12-colchon-queen | | | |
| q13-iphone-16-128 | | | |
| q14-licuadora-oster | | | |
| q15-freidora-aire-5l | | | |
| q16-inexistente | | | |
| q17-tienda-no-listada | | | |
| q18-english-budget-usd | | | |
| q19-envio-argentina | | | |
| q20-usd-vs-uyu | | | |

Verdicts: **pass** = every `expected` point met and no `must_not` hit; **partial** = some
expected points missing but no `must_not` hit; **fail** = any `must_not` hit (a fabricated
price or a failure reported as "does not sell it" is always a fail).

## Per query

### <id>

- Prompt as typed:
- Skill triggered automatically? (yes / no / had to invoke by name)
- Index fetched? (root, country file, categories)
- Stores selected and why (as the assistant explained):
- Per store: route used (A endpoint / B search page / C search-first / D ai_text), attempts, state, time
- Offers reported (title as shown, code, price with currency, availability, source URL):
- Spot check: open each source URL yourself; does the price/title match what the assistant reported? (yes / no / page changed)
- Coverage block present with revision, date and non-exhaustive sentence? (yes / no)
- `must_not` hits:
- Verdict:
- Raw answer:

```
<paste>
```

## Client observations

Anything about the client itself worth carrying into `docs/compatibility.md`: tool
restrictions, URL refusals, table rendering, timeouts, how the skill was installed.
