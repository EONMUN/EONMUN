ALTER TABLE facets RENAME COLUMN type TO key;
--> statement-breakpoint
ALTER TABLE facets RENAME COLUMN name TO value;
--> statement-breakpoint
DROP INDEX facets_slug_type_unique;
--> statement-breakpoint
DROP INDEX facets_type_idx;
--> statement-breakpoint
ALTER TABLE facets ADD namespace text NOT NULL DEFAULT 'artwork';
--> statement-breakpoint
ALTER TABLE facets DROP COLUMN slug;
--> statement-breakpoint
UPDATE facets SET value = trim(value);
--> statement-breakpoint
-- Preserve memberships when legacy slugs represented the same value more than once.
INSERT OR IGNORE INTO artworks_to_facets (artwork_id, facet_id, created_at)
SELECT membership.artwork_id, min(canonical.id), min(membership.created_at)
FROM artworks_to_facets membership
JOIN facets original ON original.id = membership.facet_id
JOIN facets canonical ON canonical.namespace = original.namespace AND canonical.key = original.key AND canonical.value = original.value COLLATE NOCASE
GROUP BY membership.artwork_id, original.namespace, original.key, original.value COLLATE NOCASE;
--> statement-breakpoint
DELETE FROM artworks_to_facets WHERE facet_id NOT IN (
 SELECT min(id) FROM facets GROUP BY namespace, key, value COLLATE NOCASE
);
--> statement-breakpoint
DELETE FROM facets WHERE id NOT IN (
 SELECT min(id) FROM facets GROUP BY namespace, key, value COLLATE NOCASE
);
--> statement-breakpoint
CREATE UNIQUE INDEX facets_namespace_key_value_unique ON facets (namespace, key, value COLLATE NOCASE);
