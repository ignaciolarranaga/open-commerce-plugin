---
description: Primary stage 0 query. Spanish request for a specific coffee machine model in Uruguay.
tags: [shopping, spanish, exact-model]
expected_outcome: The shop skill fires, the index is fetched, candidate stores are checked, and the answer reports prices as shown or an honest failure per store, with a coverage block.
max_turns: 40
timeout_seconds: 900
allowed_tools: [Skill, Read, WebFetch, WebSearch]
---

¿Dónde consigo una cafetera Philips LatteGo 5500 en Uruguay y cuánto sale?
