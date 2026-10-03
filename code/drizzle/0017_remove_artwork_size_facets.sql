DELETE FROM artworks_to_facets WHERE facet_id IN (SELECT id FROM facets WHERE namespace='artwork' AND key='size');
--> statement-breakpoint
DELETE FROM facets WHERE namespace='artwork' AND key='size';
