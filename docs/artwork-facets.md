# Artwork facets and catalog audit

Reviewed 2026-10-02; dimension decision updated 2026-10-03. Scope: the 18 published artwork detail pages in the live sitemap, the active schema, and three gallery storefronts. This public audit does not establish the contents of unpublished work or private database fields.

## Current size decision

Small, Medium and Large are not stored artwork attributes. Migration `0017` removes `artwork/size` memberships and values; the admin has no Size field. Any frontend size filter must compare width and height using explicit criteria and unit conversion. Unknown measurements cannot be treated as zero or assigned a size. The existing public gallery still filters by collection; this correction does not add a new size-filter interface. Historical size-band decisions below describe earlier releases.

## Facet identity

`facets(id, namespace, key, value, description, created_at, updated_at)` stores shared values. `artworks_to_facets(artwork_id, facet_id)` assigns multiple values to multiple works.

| Namespace | Key | Value | Meaning |
| --- | --- | --- | --- |
| artwork | tag | bird | Broad descriptive tag |
| artwork | material | Watercolor | Documented working material |
| artwork | material | Gold leaf | Another material on the same artwork |
| artwork | support | Rice paper | Surface carrying the work |
| artwork | subject | botanical | Reviewed subject classification |
| artwork | style | abstract | Reviewed style classification |
| artwork | orientation | Portrait | Derived or assumed orientation |

Migration `0013` maps the old `type` to `key`, `name` to `value`, adds namespace `artwork`, and removes the derived slug. The database enforces unique namespace/key/value identity with SQLite NOCASE value comparison. Namespace and key identifiers use lowercase letters, digits, and hyphens. Values retain display spelling and are trimmed. NOCASE folds ASCII characters; it is not full Unicode normalization. Existing IDs survive unless duplicate values must be combined; their artwork memberships are transferred first.

Namespaces distinguish vocabularies; they do not specify the value's data type. Exact measurements use nullable numeric `artworks.width`, `height`, and `depth` columns, with `dimension_unit` (`in` or `cm`). Tags use the same table and relationship as every other facet.

## Gallery comparison

| Source | Observed organization | Implication for EONMUN |
| --- | --- | --- |
| [Artfinder](https://www.artfinder.com/art/) | Category/medium, style, subject, colour, orientation, size bands and a dimension range, price, shipping and framing options | Separate factual materials, subjects, and styles; support range filters alongside categories. |
| [Romero Britto's artist shop](https://www.shopbritto.com/collections/original-paintings) | Separate original-work collections, price, size bands based on average dimension, width/height ranges, inches/centimetres, date/price sort | A direct artist catalog can benefit from exact measurements and size shortcuts. |
| [Local Canvas gallery](https://thelocalcanvas.com/shop/) | Medium, movement, size, color, price, artist | These are distinct filter dimensions, not one undifferentiated tag list. Artist adds little value to a single-artist catalog. |

Artfinder's visible size bands use 50/100/150 cm boundaries; Britto uses 17/40 inch boundaries and explicitly averages dimensions. There is no shared size standard in these examples. These captures establish available controls, not their sales impact or backend schemas. Saatchi and Wychwood were also investigated but direct source capture returned HTTP 403; they are not used as archived evidence here.

## Historical public catalog audit (2026-10-02)

Ten works document materials/supports and a pair of dimensions. Eight do not document materials or measurements in the public copy. No audited description labels the axes of its dimension pair or gives depth. The public detail template does not render the numeric dimension fields, so their absence from the page does not prove that the database fields are empty.

| Work | Documented materials/support | Recorded dimensions, interpreted as portrait |
| --- | --- | --- |
| [banc-de-poissons](https://eonmun.com/artworks/banc-de-poissons) | Watercolor, rice paper | 12"x14" |
| [before-the-eternal](https://eonmun.com/artworks/before-the-eternal) | Not documented | Not documented |
| [camelia](https://eonmun.com/artworks/camelia) | Carbon ink, rice paper | 19"x25" |
| [casa-de-fuji](https://eonmun.com/artworks/casa-de-fuji) | Acrylic, watercolor, paper | 12"x14" |
| [cows](https://eonmun.com/artworks/cows) | Not documented | Not documented |
| [crane-beneath-the-maple](https://eonmun.com/artworks/crane-beneath-the-maple) | Not documented | Not documented |
| [elephants-bw](https://eonmun.com/artworks/elephants-bw) | Acrylic, canvas paper | 12”x9” |
| [equestrian-equilibrium](https://eonmun.com/artworks/equestrian-equilibrium) | Watercolor, gold leaf, paper | 13"x16" |
| [limones-del-cobre](https://eonmun.com/artworks/limones-del-cobre) | Not documented | Not documented |
| [occullilium](https://eonmun.com/artworks/occullilium) | Watercolor, pencil, gold leaf, paper | 14"x18" |
| [persimmons-del-oro](https://eonmun.com/artworks/persimmons-del-oro) | Watercolor, pencil, gold leaf, paper | 14"x18" |
| [poppies](https://eonmun.com/artworks/poppies) | Not documented | Not documented |
| [quetzalcoatlin-tetl](https://eonmun.com/artworks/quetzalcoatlin-tetl) | Watercolor, pencil, paper | 14"x18" |
| [quiescent-citadel](https://eonmun.com/artworks/quiescent-citadel) | Watercolor, paper | 12"x16" |
| [soleil-et-montagnes](https://eonmun.com/artworks/soleil-et-montagnes) | Acrylic, canvas paper | 13"x16" |
| [somewhere-in-big-bend](https://eonmun.com/artworks/somewhere-in-big-bend) | Not documented | Not documented |
| [somewhere-in-west-texas](https://eonmun.com/artworks/somewhere-in-west-texas) | Not documented | Not documented |
| [when-clouds-part](https://eonmun.com/artworks/when-clouds-part) | Not documented | Not documented |

## Migration decisions

- **Material and support:** migration `0014` prepares 27 links across the ten documented works. Watercolor, acrylic, carbon ink, pencil, and gold leaf use `material`; paper, rice paper, and canvas paper use `support`. Existing groups already assigned by an editor are left intact. Legacy facet memberships retain their original key; no broad reclassification of historical material values is performed.
- **Specifications in descriptions:** retain the original material/measurement text after the improved prose. The backfill only restores it when the description exactly matches the earlier copy migration, and only adds facets where the original or restored copy matches the audit. Later editorial copy remains authoritative.
- **Width, height, depth, unit:** migration `0015` moved these into facets. Migration `0016` restores typed artwork columns, copies assigned measurements exactly, and removes the physical measurement facets. Duplicate or malformed values stop the migration. Unknown dimensions stay null; existing zero values are preserved.
- **Portrait assumption:** on 2026-10-03 the artist authorized treating unlabeled pairs as portrait: smaller value is width, larger is height. This fills the ten documented pairs only when existing measurements are absent and the original dimension text is still present. Existing labeled measurements remain authoritative. Other works receive Portrait orientation without invented dimensions.
- **Size and orientation:** calculated on save from complete positive width and height. Longest edge up to 50 cm is Small, over 50 through 100 cm is Medium, over 100 cm is Large. Equal axes are Square; otherwise the larger axis determines Portrait or Landscape. These are local catalog rules. Incomplete measurements can retain an editorial size/orientation. Public dimension labels read the numeric columns; future range queries must convert units.
- **Subject, style, color, medium/category:** use controlled facet keys once the artist reviews them. Broad existing tags remain `artwork/tag`; image-based suggestions do not establish physical materials, support, or dimensions. Gold-colored work does not by itself prove gold leaf.
- **Year, price, availability, collections:** keep the existing authoritative fields and relationships. Public filters can combine these with facets without copying them into strings.

## Public filtering follow-up

Start with material, subject, size, orientation, availability, and existing collections. Offer width/height ranges in a selected unit when measurements are complete. Use OR within selected values of one facet and AND between facet groups. Compute result counts from the same filtered catalog and preserve selections in the URL. The current PR stores, edits, and displays facets; it does not implement this filtering interface.

## Confidence and open questions

High confidence in the field mapping and the 27 explicitly documented material/support associations. Portrait axis order and size bands are now decided. Framing inclusion, eight works' missing specifications, and subjective categories still need artist review. Source HTML and hashes are archived in the 2026-10-02 artwork-facet research packages in the notes vault.

## Earlier facet release verification, 2026-10-03

Production inspection found additional measurements that the public-page audit could not see. Migration preserved all 30 existing width/height/depth values across ten works, including landscape and square dimensions. The eight remaining works received their documented portrait pairs. All 18 exposed dimensions from facets after that release. Existing depth values were retained; missing depth remains absent.

“Somewhere in Big Bend” already had height `0`. That value was preserved and needs an editorial correction; incomplete positive measurements do not generate a size band. The artist-approved Portrait default applies where no complete measurement or existing orientation is available.

The release used a temporary maintenance Worker to block old reads/writes before backup and migration. All 18 public artwork pages, homepage metadata, artwork/collection indexes, sitemap, and privacy page were checked after migration. Migration staging tables are dropped by their own migrations; temporary release tooling and the backup table are removed after production acceptance. The historical migrations stay checked in for reproducible database setup.

## Dedicated editor and Shopify comparison

The artwork editor presents Dimensions (width, height, depth, unit, size and orientation), Materials and surface (materials, surface and medium), and Subject and style (subjects, styles and colors). Tags remain a separate field. Editors never enter facet namespaces or keys. Shared categorical values remain many-to-many internally; unknown categories already assigned to artwork survive an edit.

Shopify's [metafield data types](https://shopify.dev/docs/apps/build/metafields/list-of-data-types) define a typed `dimension` value with a unit. Its [Search & Discovery filter guidance](https://help.shopify.com/en/manual/online-store/storefront-search/search-and-discovery-filters) lists supported custom filter types, including integer and decimal, but does not list `dimension`. This supports separating physical specifications from browsing categories. It does not establish Shopify's internal database schema or forbid numeric range filters. Our SQL choice is numeric measurement columns with categorical Size and Orientation retained as facets.

Migration `0016` requires a coordinated release: block old writes, take a catalog backup, migrate, verify the new Worker preview, and deploy. The runtime has one measurement source and no legacy read/write adapter. Historical migrations remain necessary for reproducible setup.

## Typed dimension release verification, 2026-10-03

PR #117 restored typed measurements and the dedicated editor. The migration preserved all 64 measurement/unit assignments across 18 artworks, including the pre-existing zero height, and passed the foreign-key check. All 18 artwork pages matched their pre-migration dimension labels in preview and production. Homepage metadata, artwork and collection indexes, sitemap, privacy, the direct Astro Worker, and unauthenticated admin guards were also checked. The authenticated editor was verified locally in browser tests; a live Google-authenticated editing session was not exercised.

Two independent Codex reviewers identified manual-category preservation and zero-only display issues; both were fixed and received follow-up approval. The rebased build, 100 unit tests, and CI browser suite passed. Temporary release tooling is removed after verification; historical SQL migrations and their snapshots remain required for fresh database setup.
