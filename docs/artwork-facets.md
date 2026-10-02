# Artwork facets and catalog audit

Reviewed 2026-10-02. Scope: the 18 published artwork detail pages in the live sitemap, the active schema, and three gallery storefronts. This public audit does not establish the contents of unpublished work or private database fields.

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
| artwork | size | Small | Editorial category, pending a consistent size policy |

Migration `0013` maps the old `type` to `key`, `name` to `value`, adds namespace `artwork`, and removes the derived slug. The database enforces unique namespace/key/value identity with SQLite NOCASE value comparison. Namespace and key identifiers use lowercase letters, digits, and hyphens. Values retain display spelling and are trimmed. NOCASE folds ASCII characters; it is not full Unicode normalization. Existing IDs survive unless duplicate values must be combined; their artwork memberships are transferred first.

Namespaces distinguish vocabularies; they do not specify the value's data type. Exact measurements remain numeric. Tags use the same table and relationship as every other facet.

## Gallery comparison

| Source | Observed organization | Implication for EONMUN |
| --- | --- | --- |
| [Artfinder](https://www.artfinder.com/art/) | Category/medium, style, subject, colour, orientation, size bands and a dimension range, price, shipping and framing options | Separate factual materials, subjects, and styles; support range filters alongside categories. |
| [Romero Britto's artist shop](https://www.shopbritto.com/collections/original-paintings) | Separate original-work collections, price, size bands based on average dimension, width/height ranges, inches/centimetres, date/price sort | A direct artist catalog can benefit from exact measurements and size shortcuts. |
| [Local Canvas gallery](https://thelocalcanvas.com/shop/) | Medium, movement, size, color, price, artist | These are distinct filter dimensions, not one undifferentiated tag list. Artist adds little value to a single-artist catalog. |

Artfinder's visible size bands use 50/100/150 cm boundaries; Britto uses 17/40 inch boundaries and explicitly averages dimensions. There is no shared size standard in these examples. These captures establish available controls, not their sales impact or backend schemas. Saatchi and Wychwood were also investigated but direct source capture returned HTTP 403; they are not used as archived evidence here.

## Current catalog

Ten works document materials/supports and a pair of dimensions. Eight do not document materials or measurements in the public copy. No audited description labels the axes of its dimension pair or gives depth. The public detail template does not render the numeric dimension fields, so their absence from the page does not prove that the database fields are empty.

| Work | Documented materials/support | Recorded dimensions, axis order unconfirmed |
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
- **Width, height, depth, unit:** keep `artworks.width`, `height`, `depth`, and `dimension_unit` as the numeric source for ranges and unit conversion. Do not infer missing depth as zero or map an unlabeled dimension pair to axes. Confirm axis order and whether measurements include framing before filling these columns.
- **Size and orientation:** recommend deriving these from confirmed measurements when public filtering is implemented. Proposed EONMUN rule: size by longest edge, with small up to 50 cm, medium over 50 through 100 cm, and large over 100 cm. This is a proposed local policy, not an industry standard. Decide square tolerance and handling of three-dimensional work at that point. The current form still permits manually assigned size values.
- **Subject, style, color, medium/category:** use controlled facet keys once the artist reviews them. Broad existing tags remain `artwork/tag`; image-based suggestions do not establish physical materials, support, or dimensions. Gold-colored work does not by itself prove gold leaf.
- **Year, price, availability, collections:** keep the existing authoritative fields and relationships. Public filters can combine these with facets without copying them into strings.

## Public filtering follow-up

Start with material, subject, size, orientation, availability, and existing collections. Offer width/height ranges in a selected unit when measurements are complete. Use OR within selected values of one facet and AND between facet groups. Compute result counts from the same filtered catalog and preserve selections in the URL. The current PR stores, edits, and displays facets; it does not implement this filtering interface.

## Confidence and open questions

High confidence in the field mapping and the 27 explicitly documented material/support associations. Size definitions, measurement axis order, framing inclusion, eight works' missing specifications, and subjective categories need artist review. Source HTML and hashes are archived in the 2026-10-02 artwork-facet research packages in the notes vault.
