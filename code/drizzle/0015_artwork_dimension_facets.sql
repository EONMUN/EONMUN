-- Preserve measurements before removing legacy columns; unlabeled pairs use portrait order.
CREATE TABLE artwork_dimension_backfill (artwork_id integer PRIMARY KEY, width real, height real, depth real, unit text);
--> statement-breakpoint
INSERT INTO artwork_dimension_backfill SELECT id, width, height, depth, COALESCE(dimension_unit, 'in') FROM artworks;
--> statement-breakpoint
UPDATE artwork_dimension_backfill SET width=(SELECT f.value FROM facets f JOIN artworks_to_facets af ON af.facet_id=f.id WHERE af.artwork_id=artwork_dimension_backfill.artwork_id AND f.namespace='artwork' AND f.key='width' LIMIT 1) WHERE EXISTS (SELECT 1 FROM facets f JOIN artworks_to_facets af ON af.facet_id=f.id WHERE af.artwork_id=artwork_dimension_backfill.artwork_id AND f.namespace='artwork' AND f.key='width');
--> statement-breakpoint
UPDATE artwork_dimension_backfill SET height=(SELECT f.value FROM facets f JOIN artworks_to_facets af ON af.facet_id=f.id WHERE af.artwork_id=artwork_dimension_backfill.artwork_id AND f.namespace='artwork' AND f.key='height' LIMIT 1) WHERE EXISTS (SELECT 1 FROM facets f JOIN artworks_to_facets af ON af.facet_id=f.id WHERE af.artwork_id=artwork_dimension_backfill.artwork_id AND f.namespace='artwork' AND f.key='height');
--> statement-breakpoint
UPDATE artwork_dimension_backfill SET depth=(SELECT f.value FROM facets f JOIN artworks_to_facets af ON af.facet_id=f.id WHERE af.artwork_id=artwork_dimension_backfill.artwork_id AND f.namespace='artwork' AND f.key='depth' LIMIT 1) WHERE EXISTS (SELECT 1 FROM facets f JOIN artworks_to_facets af ON af.facet_id=f.id WHERE af.artwork_id=artwork_dimension_backfill.artwork_id AND f.namespace='artwork' AND f.key='depth');
--> statement-breakpoint
UPDATE artwork_dimension_backfill SET unit=(SELECT f.value FROM facets f JOIN artworks_to_facets af ON af.facet_id=f.id WHERE af.artwork_id=artwork_dimension_backfill.artwork_id AND f.namespace='artwork' AND f.key='dimension-unit' LIMIT 1) WHERE EXISTS (SELECT 1 FROM facets f JOIN artworks_to_facets af ON af.facet_id=f.id WHERE af.artwork_id=artwork_dimension_backfill.artwork_id AND f.namespace='artwork' AND f.key='dimension-unit');
--> statement-breakpoint
UPDATE artwork_dimension_backfill SET width=12, height=14, unit='in' WHERE width IS NULL AND height IS NULL AND depth IS NULL AND artwork_id IN (SELECT id FROM artworks WHERE slug='banc-de-poissons' AND instr(description, '12"x14"') > 0);
--> statement-breakpoint
UPDATE artwork_dimension_backfill SET width=19, height=25, unit='in' WHERE width IS NULL AND height IS NULL AND depth IS NULL AND artwork_id IN (SELECT id FROM artworks WHERE slug='camelia' AND instr(description, '19"x25"') > 0);
--> statement-breakpoint
UPDATE artwork_dimension_backfill SET width=12, height=14, unit='in' WHERE width IS NULL AND height IS NULL AND depth IS NULL AND artwork_id IN (SELECT id FROM artworks WHERE slug='casa-de-fuji' AND instr(description, '12"x14"') > 0);
--> statement-breakpoint
UPDATE artwork_dimension_backfill SET width=9, height=12, unit='in' WHERE width IS NULL AND height IS NULL AND depth IS NULL AND artwork_id IN (SELECT id FROM artworks WHERE slug='elephants-bw' AND instr(description, '12”x9”') > 0);
--> statement-breakpoint
UPDATE artwork_dimension_backfill SET width=13, height=16, unit='in' WHERE width IS NULL AND height IS NULL AND depth IS NULL AND artwork_id IN (SELECT id FROM artworks WHERE slug='equestrian-equilibrium' AND instr(description, '13"x16"') > 0);
--> statement-breakpoint
UPDATE artwork_dimension_backfill SET width=14, height=18, unit='in' WHERE width IS NULL AND height IS NULL AND depth IS NULL AND artwork_id IN (SELECT id FROM artworks WHERE slug='occullilium' AND instr(description, '14"x18"') > 0);
--> statement-breakpoint
UPDATE artwork_dimension_backfill SET width=14, height=18, unit='in' WHERE width IS NULL AND height IS NULL AND depth IS NULL AND artwork_id IN (SELECT id FROM artworks WHERE slug='persimmons-del-oro' AND instr(description, '14"x18"') > 0);
--> statement-breakpoint
UPDATE artwork_dimension_backfill SET width=14, height=18, unit='in' WHERE width IS NULL AND height IS NULL AND depth IS NULL AND artwork_id IN (SELECT id FROM artworks WHERE slug='quetzalcoatlin-tetl' AND instr(description, '14"x18"') > 0);
--> statement-breakpoint
UPDATE artwork_dimension_backfill SET width=12, height=16, unit='in' WHERE width IS NULL AND height IS NULL AND depth IS NULL AND artwork_id IN (SELECT id FROM artworks WHERE slug='quiescent-citadel' AND instr(description, '12"x16"') > 0);
--> statement-breakpoint
UPDATE artwork_dimension_backfill SET width=13, height=16, unit='in' WHERE width IS NULL AND height IS NULL AND depth IS NULL AND artwork_id IN (SELECT id FROM artworks WHERE slug='soleil-et-montagnes' AND instr(description, '13"x16"') > 0);
--> statement-breakpoint
CREATE TABLE artwork_dimension_values (artwork_id integer NOT NULL, key text NOT NULL, value text NOT NULL);
--> statement-breakpoint
INSERT INTO artwork_dimension_values SELECT artwork_id, 'width', printf('%.15g', width) FROM artwork_dimension_backfill WHERE width IS NOT NULL;
--> statement-breakpoint
INSERT INTO artwork_dimension_values SELECT artwork_id, 'height', printf('%.15g', height) FROM artwork_dimension_backfill WHERE height IS NOT NULL;
--> statement-breakpoint
INSERT INTO artwork_dimension_values SELECT artwork_id, 'depth', printf('%.15g', depth) FROM artwork_dimension_backfill WHERE depth IS NOT NULL;
--> statement-breakpoint
INSERT INTO artwork_dimension_values SELECT artwork_id, 'dimension-unit', unit FROM artwork_dimension_backfill WHERE width IS NOT NULL OR height IS NOT NULL OR depth IS NOT NULL;
--> statement-breakpoint
INSERT INTO artwork_dimension_values SELECT artwork_id, 'orientation', CASE WHEN width>0 AND height>0 AND width=height THEN 'Square' WHEN width>0 AND height>0 AND width>height THEN 'Landscape' ELSE 'Portrait' END FROM artwork_dimension_backfill b WHERE (width>0 AND height>0) OR NOT EXISTS (SELECT 1 FROM artworks_to_facets af JOIN facets f ON f.id=af.facet_id WHERE af.artwork_id=b.artwork_id AND f.namespace='artwork' AND f.key='orientation');
--> statement-breakpoint
INSERT INTO artwork_dimension_values SELECT artwork_id, 'size', CASE WHEN max(width,height)*(CASE unit WHEN 'in' THEN 2.54 ELSE 1 END)<=50 THEN 'Small' WHEN max(width,height)*(CASE unit WHEN 'in' THEN 2.54 ELSE 1 END)<=100 THEN 'Medium' ELSE 'Large' END FROM artwork_dimension_backfill WHERE width>0 AND height>0;
--> statement-breakpoint
DELETE FROM artworks_to_facets WHERE EXISTS (SELECT 1 FROM facets f JOIN artwork_dimension_values v ON v.key=f.key AND v.artwork_id=artworks_to_facets.artwork_id WHERE f.id=artworks_to_facets.facet_id AND f.namespace='artwork');
--> statement-breakpoint
INSERT INTO facets (namespace,key,value,created_at,updated_at) SELECT DISTINCT 'artwork',key,value,unixepoch(),unixepoch() FROM artwork_dimension_values WHERE 1 ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO artworks_to_facets (artwork_id,facet_id,created_at) SELECT v.artwork_id,f.id,unixepoch() FROM artwork_dimension_values v JOIN facets f ON f.namespace='artwork' AND f.key=v.key AND f.value=v.value COLLATE NOCASE WHERE 1 ON CONFLICT DO NOTHING;
--> statement-breakpoint
DROP TABLE artwork_dimension_values;
--> statement-breakpoint
DROP TABLE artwork_dimension_backfill;
--> statement-breakpoint
ALTER TABLE artworks DROP COLUMN width;
--> statement-breakpoint
ALTER TABLE artworks DROP COLUMN height;
--> statement-breakpoint
ALTER TABLE artworks DROP COLUMN depth;
--> statement-breakpoint
ALTER TABLE artworks DROP COLUMN dimension_unit;
