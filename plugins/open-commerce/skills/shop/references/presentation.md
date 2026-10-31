# Presentation templates

Answer in the user's language. Keep store names, product titles and model codes
exactly as the store shows them. One table (or a list when the client cannot render
tables), then the Coverage block. Omit columns that are empty for every row rather than
filling them with dashes, except price and source, which are always present for a
`success` row.

Currency notation:

- Uruguayan pesos: `$U 24.990` (also acceptable: `UYU 24.990`). If the site shows `$`,
  write `$U` so it is not read as US dollars.
- US dollars: `U$S 549` (also acceptable: `USD 549`).
- Never convert. If the user asks for a conversion, label it: "≈ U$S 610 at <rate> on
  <date>, indicative only".

Match quality:

- **exact**: the model/variant code the user asked for, or the only variant of the named
  product.
- **approximate**: same family or series, different variant, capacity, colour or
  generation; or a title that matches the words but shows no code. Say what differs.

## English template

```
**<Product as the user asked>** in <Country> — <N> stores checked, <M> with offers

| Store | Product (as shown) | Code | Price | Availability | Match | Source |
|---|---|---|---|---|---|---|
| <Store name> | <Product title exactly as shown> | <model code> | $U <price as shown> | <availability as shown> | exact | [<store host>](<url>) · <time> UTC |
| <Store> | <title> | <code or —> | <price> | <text or "not shown"> | approximate: <what differs> | [<host>](<url>) · <time> |

Shipping / payment (only what was retrieved): <store>: <fact> (<source>). Not
retrieved for the other stores.

**Coverage**
- Checked: <store> (success), <store> (no_results), …
- Failed: <store> — <state>: <reason>. <link>
- Skipped: <store> — <reason>.
- Index revision <source_revision>, generated <generated_at>.
- This is not an exhaustive market search: it covers the stores listed in
  OpenCommerceIndex that could be checked right now. Missing a store? Add it:
  https://github.com/ignaciolarranaga/open-commerce-index/issues/new?template=add-store.yml
```

## Spanish template

```
**<Producto tal como lo pidió el usuario>** en <País> — <N> tiendas revisadas, <M> con ofertas

| Tienda | Producto (como figura) | Código | Precio | Disponibilidad | Coincidencia | Fuente |
|---|---|---|---|---|---|---|
| <Nombre de la tienda> | <Título del producto tal como aparece> | <código de modelo> | $U <precio tal como aparece> | <disponibilidad tal como aparece> | exacta | [<dominio>](<url>) · <hora> UTC |
| <Tienda> | <título> | <código o —> | <precio> | <texto o "no figura"> | aproximada: <qué difiere> | [<host>](<url>) · <hora> |

Envío / pago (solo lo recuperado): <tienda>: <dato> (<fuente>). No se recuperó para
las demás tiendas.

**Cobertura**
- Revisadas: <tienda> (con resultados), <tienda> (sin resultados), …
- Fallaron: <tienda> — <estado>: <motivo>. <enlace>
- Omitidas: <tienda> — <motivo>.
- Índice revisión <source_revision>, generado <generated_at>.
- Esto no es una búsqueda exhaustiva del mercado: cubre las tiendas listadas en
  OpenCommerceIndex que pudieron revisarse ahora. ¿Falta una tienda? Agregala:
  https://github.com/ignaciolarranaga/open-commerce-index/issues/new?template=add-store.yml
```

## List form (clients without tables)

```
<Store name> — <Product title exactly as shown> — <model code> — $U <price as shown> — <availability> — exact — <url> (<time> UTC)
ZonaTecno — no_results: searched "Philips LatteGo 5500" and "EP5541", nothing matching.
LOi — unsupported_access: results render with JavaScript; search here: <filled url>
```

## State wording in the Coverage block

| state | English | Spanish |
|---|---|---|
| success | with offers | con resultados |
| no_results | searched, nothing matching | buscada, sin coincidencias |
| unsupported_access | could not be checked from this assistant | no se pudo revisar desde este asistente |
| unavailable | temporarily unreachable | temporalmente inaccesible |
| blocked | does not allow assistant access | no permite acceso de asistentes |
| not_checked | not checked: <reason> | no revisada: <motivo> |

## When the user names a store that is not listed

Add one line after Coverage:

- EN: "<Store> is not in OpenCommerceIndex yet, so it was not checked. Anyone can
  propose it: <add-store link>."
- ES: "<Tienda> todavía no está en OpenCommerceIndex, así que no se revisó. Cualquiera
  puede proponerla: <enlace add-store>."

## When the destination is not covered

- EN: "OpenCommerceIndex does not list stores for <country> yet, so no store was
  searched. Stores listed for <covered country> declare shipping to: <ships_to
  summary>; none confirms <country>. Site: https://ignaciolarranaga.github.io/open-commerce-index/"
- ES: "OpenCommerceIndex todavía no lista tiendas para <país>, así que no se buscó en
  ninguna. Las tiendas de <país cubierto> declaran envío a: <resumen ships_to>; ninguna
  confirma <país>. Sitio: https://ignaciolarranaga.github.io/open-commerce-index/"
