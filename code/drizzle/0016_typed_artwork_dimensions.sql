ALTER TABLE `artworks` ADD `width` real;--> statement-breakpoint
ALTER TABLE `artworks` ADD `height` real;--> statement-breakpoint
ALTER TABLE `artworks` ADD `depth` real;--> statement-breakpoint
ALTER TABLE `artworks` ADD `dimension_unit` text DEFAULT 'in' NOT NULL;
--> statement-breakpoint
-- Fail before copying ambiguous or malformed measurements.
CREATE TABLE dimension_migration_check (valid integer NOT NULL CHECK(valid=1));
--> statement-breakpoint
INSERT INTO dimension_migration_check SELECT 0 FROM artworks_to_facets af JOIN facets f ON f.id=af.facet_id WHERE f.namespace='artwork' AND f.key IN ('width','height','depth','dimension-unit') GROUP BY af.artwork_id,f.key HAVING count(*)>1;
--> statement-breakpoint
INSERT INTO dimension_migration_check SELECT 0 FROM facets f JOIN artworks_to_facets af ON af.facet_id=f.id WHERE f.namespace='artwork' AND ((f.key IN ('width','height','depth') AND NOT (CASE WHEN json_valid(f.value) THEN json_type(f.value) IN ('integer','real') ELSE 0 END AND CAST(f.value AS REAL)>=0 AND CAST(f.value AS REAL)<1e999)) OR (f.key='dimension-unit' AND f.value NOT IN ('in','cm')));
--> statement-breakpoint
INSERT INTO dimension_migration_check SELECT 0 FROM artworks_to_facets af JOIN facets f ON f.id=af.facet_id WHERE f.namespace='artwork' AND f.key IN ('width','height','depth') AND NOT EXISTS (SELECT 1 FROM artworks_to_facets units JOIN facets u ON u.id=units.facet_id WHERE units.artwork_id=af.artwork_id AND u.namespace='artwork' AND u.key='dimension-unit');
--> statement-breakpoint
UPDATE artworks SET width=(SELECT CAST(f.value AS REAL) FROM artworks_to_facets af JOIN facets f ON f.id=af.facet_id WHERE af.artwork_id=artworks.id AND f.namespace='artwork' AND f.key='width');
--> statement-breakpoint
UPDATE artworks SET height=(SELECT CAST(f.value AS REAL) FROM artworks_to_facets af JOIN facets f ON f.id=af.facet_id WHERE af.artwork_id=artworks.id AND f.namespace='artwork' AND f.key='height');
--> statement-breakpoint
UPDATE artworks SET depth=(SELECT CAST(f.value AS REAL) FROM artworks_to_facets af JOIN facets f ON f.id=af.facet_id WHERE af.artwork_id=artworks.id AND f.namespace='artwork' AND f.key='depth');
--> statement-breakpoint
UPDATE artworks SET dimension_unit=COALESCE((SELECT f.value FROM artworks_to_facets af JOIN facets f ON f.id=af.facet_id WHERE af.artwork_id=artworks.id AND f.namespace='artwork' AND f.key='dimension-unit'),'in');
--> statement-breakpoint
DELETE FROM artworks_to_facets WHERE facet_id IN (SELECT id FROM facets WHERE namespace='artwork' AND key IN ('width','height','depth','dimension-unit'));
--> statement-breakpoint
DELETE FROM facets WHERE namespace='artwork' AND key IN ('width','height','depth','dimension-unit');
--> statement-breakpoint
DROP TABLE dimension_migration_check;
