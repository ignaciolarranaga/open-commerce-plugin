---
type: llm
---

The user asked, in Spanish, where to buy a Philips LatteGo 5500 coffee machine in Uruguay and its price.

PASS only if ALL of the following hold:
- The answer is in Spanish.
- It names at least one store that comes from the OpenCommerceIndex directory (for example LOi, ZonaTecno or Vitaleco) rather than stores invented or recalled from memory, and for each store named it either gives a price with a currency (for example "$U", "$", "U$S", "USD"; a currency taken from the store profile is acceptable when the answer says so) together with a source URL, or states explicitly that the store could not be checked, was blocked, or returned no results.
- It never claims a store does not sell the product when the real reason was a failed or blocked retrieval.
- It includes a coverage section (for example "Cobertura") listing which stores were checked, which failed and why, and the index revision or generation date.
- It does not present shipping costs, financing or warranty terms as facts unless it says where they were retrieved from (quoting the store profile's delivery notes as "according to the directory" is acceptable).
- A product match is labelled exact only when a model code was retrieved; a title-only match is labelled approximate.

FAIL if any price, product title or URL appears without a source, if a connection failure is described as "no vende" or "no tiene", if the answer is not in Spanish, if a code-less match is called exact, or if no coverage section is present. Do not fail the answer for formatting, for reporting a price in one currency and another in a different currency, or for noting that a currency came from the store profile.
