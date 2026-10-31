# Retrieval patterns by platform

How to use what a store manifest declares in `access`, platform by platform, and what
each route returns. Only use the URLs the manifest gives you (filled `search.url_template`
and `endpoints[].url`) plus the search-first route; the patterns below explain how to
**read** those responses, they are not licence to guess URLs the manifest does not list.

## General

- **URL-encode the query.** Replace `{query}` with `encodeURIComponent(query)`:
  spaces become `%20`, `'` stays `'` but is safer as `%27`, `+` becomes `%2B`. Keep
  the query short: brand plus family plus one distinguishing token ("Philips LatteGo
  5500", "Lenovo IdeaPad 15"). Model codes (`EP5541`) are often better than names.
- **Two attempts per store.** A typical pair is: full phrase first, then the model code
  or a shorter phrase. Do not run a third.
- **Prices.** Read the figure and currency as the page shows it. Uruguayan sites write
  pesos as `$ 24.990` or `$U 24.990` (thousands separator `.`, decimals `,`) and US
  dollars as `U$S 549` or `USD 549`. If a page shows two prices (list vs. promo, cash
  vs. card, "precio contado"), report the one labelled as the current selling price and
  mention the other with its label. Do not convert currencies.
- **Availability.** Report the exact wording ("En stock", "Sin stock", "Agotado",
  "Consultar", "Disponible", "Últimas unidades"); when absent, report "not shown".
- **Retrieval time.** Note the time (with timezone or UTC) at which you fetched.

## Fenicio (`platform: fenicio`)

Common among Uruguayan retailers. Server-rendered.

- Search page: `https://<host>/catalogo?q={query}` (the manifest gives the exact
  template). Returns an HTML list of products; each card has the title, the price with
  the currency symbol, and a link to the product page.
- Product pages carry the model/SKU in the title or in a "Código" / "SKU" field.
- Pagination usually via `&page=2`; do not go beyond page 2.
- Category paths like `/catalogo/<category>` exist but are not in the manifest: do not
  construct them.

## Shopify (`platform: shopify`)

Server-rendered. Best structured coverage in the index.

- `json_search`: `https://<host>/search/suggest.json?q={query}&resources[type]=product&resources[limit]=10`
  returns `resources.results.products[]` with `title`, `handle`, `url`, `price`
  (a string in the shop currency, decimals with `.`), `vendor`, `available` (boolean),
  `variants[]` where present. The product URL is `https://<host>` + `url`. The
  currency is the manifest's `currencies[0]` unless the page says otherwise.
- `products_feed`: `https://<host>/products.json?limit=250` returns `products[]` with
  `title`, `handle`, `vendor`, `product_type`, `tags`, `variants[]` (`title`, `sku`,
  `price`, `available`, `compare_at_price`). Filter client-side by `title`, `vendor`,
  `sku`, `tags`. This feed can be paginated with `&page=2`; stop at page 2. Note that
  `available` may be stale by minutes and `products.json` may omit hidden products.
- Search HTML: `https://<host>/search?q={query}&type=product` returns a results grid;
  use it only when JSON is not available.
- Variant codes: Shopify titles often embed the model ("Philips EP5541/50"); `sku`
  on variants is the most reliable code when present.
- Some Shopify stores also expose `/.well-known/ucp`, a storefront MCP at `/api/mcp`
  and `llms.txt`. Mention them when relevant; call MCP only if your runtime has a
  native MCP client configured for that URL.

**Model codes in Shopify `suggest.json`.** Each product result carries a `body` field with the product description as HTML; model codes such as `EP5541/50` usually appear there even when the title omits them. Read `body` (and `variants[].sku` in `products.json`) before reporting a code as not retrieved.

**Currency in Shopify JSON.** `suggest.json` and `products.json` return prices as bare numbers in the shop's currency; the number carries no currency symbol. Take the currency from the manifest's `currencies` when it lists exactly one (and say so once), otherwise read it from the product page or `/meta.json`, which returns `{"currency": "UYU", ...}`, before stating it.

## VTEX (`platform: vtex`)

Mostly client-rendered storefronts.

- `/busca?ft={query}` or `/<query>?_q={query}&map=ft` search pages typically render
  with JavaScript: plain HTML fetches return a shell with no products. Treat as
  `rendering: client` unless the manifest says `server`.
- Intelligent Search API (when listed in `endpoints` as `json_search` or `api`):
  `https://<host>/api/io/_v/api/intelligent-search/product_search/?query={query}`
  returns `products[]` with `productName`, `brand`, `linkText`, `items[]` (each with
  `itemId`, `name`, `referenceId[].Value` for model codes, `sellers[0].commertialOffer.Price`,
  `ListPrice`, `AvailableQuantity`). Product URL is `https://<host>/<linkText>/p`.
  Prices are in the store currency (manifest `currencies`).
- Legacy catalog API `/api/catalog_system/pub/products/search/?ft={query}` returns a
  similar array (`productName`, `items[].sellers[].commertialOffer`). Use it only if
  the manifest lists it.
- When neither API is listed, use search-first.

## WooCommerce (`platform: woocommerce`)

- Store API (when listed): `https://<host>/wp-json/wc/store/v1/products?search={query}`
  returns an array with `name`, `sku`, `permalink`, `prices.price` (minor units, use
  `prices.currency_minor_unit` to place the decimal), `prices.currency_code`,
  `is_in_stock`, `variations[]`.
- Search HTML: `https://<host>/?s={query}&post_type=product` is usually server-rendered.
- Prices in HTML appear inside `.woocommerce-Price-amount` spans with the currency
  symbol.

## Magento (`platform: magento`)

- Search HTML: `https://<host>/catalogsearch/result/?q={query}` is server-rendered in
  most themes; product cards have `.product-item-name` and `.price` nodes.
- Prices may be embedded as JSON in `data-price-amount` attributes; prefer those.
- Product pages carry the SKU in a "SKU" field.

## Tiendanube / Nuvemshop, PrestaShop, Wix, custom, unknown

- Tiendanube: `https://<host>/search/?q={query}` is server-rendered; cards show title
  and price. Some stores expose `/products.json`-like feeds only if listed.
- PrestaShop: `https://<host>/search?controller=search&s={query}` server-rendered.
- Wix: almost always client-rendered; use search-first.
- `custom` / `unknown`: trust `rendering` and `search.status`. If the template is
  `unverified` with a note that results render with JavaScript, try the template once
  and fall back to search-first.

## Search-first (Route C) in detail

1. Take the host from `website` (strip `https://` and the trailing slash).
2. Run a web search: `site:<host> <brand> <family or model code>`.
3. Pick the result whose title best matches; prefer product pages over category or
   blog pages.
4. Open that URL with your fetch tool. Read the title, price, availability and model
   code from the page.
5. The source is the page you opened. If the result is stale (price differs from the
   snippet), trust the page, not the snippet.

## Runtime notes

### Claude.ai and Claude Code (`web_fetch`, `WebFetch`)

- On Claude.ai, `web_fetch` opens only URLs that the user provided or that already
  appear in the conversation (search results, previously fetched pages). The index
  URLs are literal in this skill, so they can be fetched directly. A **filled search
  template or JSON endpoint is a new URL** and may be refused: when that happens, use
  search-first (`web_search` with `site:<host>`), then fetch the result.
- Claude Code's `WebFetch` can open arbitrary URLs but returns a model-processed
  summary of the page; ask it explicitly for "product titles, prices with currency,
  availability text, model codes and product URLs, verbatim" so nothing is paraphrased.
- Both tools follow redirects; a redirect to a home page usually means the search path
  does not exist or was blocked.

### ChatGPT browsing

- Browsing opens the URL and returns the rendered text. JSON endpoints come back as
  raw text and are readable. Client-rendered pages often show navigation only.
- If a page is blocked (403, challenge) the tool reports an error; do not retry more
  than once, move to search-first.

### Codex and Cursor

- Shell access is usually available: `curl -sL --max-time 20 '<url>'` works for JSON
  endpoints and server-rendered HTML. Set a descriptive `User-Agent` that identifies an
  assistant acting for a user; never spoof a browser to bypass a block.
- Pipe HTML through a quick extraction (`grep -o`, a few lines of Node) rather than
  dumping entire pages into the conversation.
