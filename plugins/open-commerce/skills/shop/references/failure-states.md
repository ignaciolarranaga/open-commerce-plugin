# Failure states

Every store you considered ends in exactly one state. The user sees the state in the
Coverage block. The point of these labels is to keep "we could not check" clearly apart
from "the store does not have it": a failure is never reported as absence of the product.

| state | when | what the user reads |
|---|---|---|
| `success` | At least one matching offer was retrieved from the store's site | Offers listed in the table |
| `no_results` | The search ran (endpoint or page returned a normal response) and nothing matched the query | "Searched, nothing matching found. The store may list it under another name." |
| `unsupported_access` | The manifest gives no route you can use: no `json_search`/`products_feed`, no `search.url_template`, or `rendering: client` and no search tool in this runtime | "Could not be checked automatically from this assistant. Link to the store's search." |
| `unavailable` | Network error, timeout, 5xx, or empty body on a route that should work | "Temporarily unreachable; try again later. Link to the store." |
| `blocked` | 403, a bot challenge page, or `robots.ai_user_agents: disallowed` | "The store does not allow assistants to fetch its pages; link so the user can look." |
| `not_checked` | Deliberately skipped: cap reached, no matching category, does not ship to the destination | "Not checked: <reason>." |

## Decision rules

- `robots.ai_user_agents: disallowed` → `blocked` **before** any fetch. Do not fetch.
- `bot_protection: challenge | blocked` → try search-first once; no result → `blocked`.
- HTTP 403, 429, or a page whose body is a challenge ("Checking your browser",
  "Attention Required", "Access denied", Cloudflare/Akamai interstitials) → `blocked`.
- HTTP 5xx, connection refused, DNS failure, timeout, or a zero-length body → `unavailable`.
- HTTP 200 with a normal results page or JSON that holds zero items → `no_results`.
- HTTP 200 on a client-rendered shell (navigation, no products) with no other route →
  `unsupported_access`, not `no_results`.
- Fetch tool refuses the URL (not previously seen) and search-first finds nothing on
  the host → `unsupported_access`, and say the tool restriction was the cause.
- Two attempts exhausted with mixed errors → pick the state of the **last** attempt.

## Distinguishing `no_results` from "does not sell it"

A `no_results` is about the query, not the catalogue. Always phrase it as "searched for
'<query>' and found no match", and when the product family is clearly within the
store's declared `categories` and `brands`, add "the store lists <brand> among its
brands, so the item may exist under another name; here is its search link". Never write
"<store> does not sell <product>" unless the store's own page explicitly states that.

## Message examples

English:

- `no_results`: "ZonaTecno: searched 'Philips LatteGo 5500' and 'EP5541', no matching
  product in the results. The store is a technology retailer, so this family may simply
  be out of its range, but the search is not proof of that."
- `unsupported_access`: "LOi: its search results load with JavaScript and this
  assistant cannot run it, so the store could not be checked automatically. You can
  search it here: https://loi.com.uy/buscar?q=Philips%20LatteGo%205500"
- `unavailable`: "Vitaleco: the search endpoint returned a server error twice
  (HTTP 503). Not checked this time; try again in a few minutes."
- `blocked`: "<store>: the site answered with a bot challenge (HTTP 403) and the
  web-search route found no product page. The store does not allow assistants to fetch
  its pages. Link: <website>"
- `blocked` (robots): "<store>: its robots.txt asks AI assistants not to crawl the
  site, so nothing was fetched. You can look yourself: <website>"
- `not_checked`: "<store>: not checked, it does not list a matching category
  (`fashion`)." / "<store>: not checked, candidate list capped at 8."

Spanish:

- `no_results`: "ZonaTecno: busqué 'Philips LatteGo 5500' y 'EP5541' sin resultados
  coincidentes. Es una tienda de tecnología, así que puede no trabajar esta familia,
  pero la búsqueda no lo demuestra."
- `unsupported_access`: "LOi: los resultados de búsqueda cargan con JavaScript y este
  asistente no puede ejecutarlo, así que no se pudo revisar automáticamente. Podés
  buscar acá: https://loi.com.uy/buscar?q=Philips%20LatteGo%205500"
- `unavailable`: "Vitaleco: el endpoint de búsqueda devolvió error del servidor dos
  veces (HTTP 503). No se pudo revisar; probá de nuevo en unos minutos."
- `blocked`: "<tienda>: el sitio respondió con un desafío anti-bot (HTTP 403) y la
  búsqueda web no encontró una página de producto. La tienda no permite que los
  asistentes lean sus páginas. Enlace: <website>"
- `blocked` (robots): "<tienda>: su robots.txt pide a los asistentes de IA que no
  recorran el sitio, así que no se consultó nada. Podés mirar vos: <website>"
- `not_checked`: "<tienda>: no revisada, no declara una categoría compatible
  (`fashion`)." / "<tienda>: no revisada, se alcanzó el tope de 8 tiendas."

## Index-level failures

- Root index or country file unreachable after two attempts: tell the user the
  directory could not be loaded, give `https://ignaciolarranaga.github.io/open-commerce-index/`,
  and stop. Do not fall back to a remembered list of stores.
- Destination country not in `countries[]`: say the index does not cover it yet and
  offer the add-store form. Do not search unrelated stores.
- Country file present but `stores` empty for the matched categories: say no listed
  store declares that category and offer the add-store form.
