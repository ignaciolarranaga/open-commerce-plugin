---
type: llm
---

The user asked, in Spanish, where to buy a Philips LatteGo 5500 coffee machine in Uruguay and its price.

PASS only if ALL of the following hold:
- The answer is in Spanish.
- It names at least one store that comes from the OpenCommerceIndex directory (for example LOi, ZonaTecno or Vitaleco) rather than stores invented or recalled from memory, and for each store named it either gives a price with its currency notation as shown on the store site (for example "$U", "$", "U$S", "USD") together with a source URL, or states explicitly that the store could not be checked, was blocked, or returned no results.
- It never claims a store does not sell the product when the real reason was a failed or blocked retrieval.
- It includes a coverage section (for example "Cobertura") listing which stores were checked, which failed and why, and the index revision or generation date.
- It does not present shipping costs, financing or warranty terms unless it says where they were retrieved from.

FAIL if any price, product title or URL appears without a source, if a connection failure is described as "no vende" or "no tiene", if the answer is not in Spanish, or if no coverage section is present.
