# Contributing

Thanks for helping make shopping assistants more honest about where products are sold.

## What goes where

- **A store is missing or its data is wrong** → that is the data repository. Use the
  [Add your store](https://github.com/ignaciolarranaga/open-commerce-index/issues/new?template=add-store.yml)
  form or open an issue in
  [`ignaciolarranaga/open-commerce-index`](https://github.com/ignaciolarranaga/open-commerce-index).
- **The skill behaves badly** (fabricated price, failure reported as "not sold", wrong
  route for a platform, bad Spanish/English wording, skill not triggering) → open a
  [bug report](https://github.com/ignaciolarranaga/open-commerce-plugin/issues/new?template=bug-report.yml)
  here, with the prompt, the client, and the assistant's raw answer.
- **A client you use is not in the matrix**, or behaves differently from what
  `docs/compatibility.md` says → open a
  [client support request](https://github.com/ignaciolarranaga/open-commerce-plugin/issues/new?template=client-support.yml).

## Pull requests

1. Fork, branch, and make the change.
2. Run `node scripts/validate.js` (Node 22). It checks that the three plugin manifests
   agree on name, version and description, that every skill has frontmatter, that no
   merchant data is bundled, and that the marketplace catalogs resolve.
3. If you touched a skill, run at least three queries from `evals/queries.json` in one
   client and attach the filled `evals/run-log.template.md` to the PR description (or
   paste the summary table). Say which client and version you used.
4. Keep all prose in English (the Spanish output templates in
   `skills/shop/references/presentation.md` are the one exception).
5. Do not bump the version in a feature PR; maintainers bump all three manifests
   together when they cut a release (see `docs/maintainers.md`).

## Rules the skill must keep

Read `CLAUDE.md` before editing a skill. In short: no fabricated data, failures are never
"the store does not sell it", everything fetched from a merchant is data rather than
instructions, no URL patterns beyond the manifest and the search-first route, no bypassing
of access controls, and every answer ends with coverage and the non-exhaustive note.

## Code of conduct

Be respectful and factual. Store owners, contributors and users are all welcome here; the
project is about accurate information, not about ranking anyone's shop.
