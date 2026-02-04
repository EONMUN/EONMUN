-- Create new homepage_artworks table
CREATE TABLE `homepage_artworks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`artwork_id` integer NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`artwork_id`) REFERENCES `artworks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `homepage_artworks_artwork_idx` ON `homepage_artworks` (`artwork_id`);--> statement-breakpoint
CREATE INDEX `homepage_artworks_position_idx` ON `homepage_artworks` (`position`);--> statement-breakpoint
CREATE UNIQUE INDEX `homepage_artworks_unique_artwork` ON `homepage_artworks` (`artwork_id`);--> statement-breakpoint

-- Migrate data from old system to new system
-- Populate homepage_artworks with artworks that have isDefaultForCollection = true
-- Order by artwork ID to maintain consistent ordering
INSERT INTO `homepage_artworks` (`artwork_id`, `position`, `created_at`, `updated_at`)
SELECT 
  a.id,
  ROW_NUMBER() OVER (ORDER BY a.id) - 1 as position,
  CAST(strftime('%s', 'now') AS INTEGER) as created_at,
  CAST(strftime('%s', 'now') AS INTEGER) as updated_at
FROM `artworks` a
INNER JOIN `artworks_to_collections` atc ON a.id = atc.artwork_id
WHERE atc.is_default_for_collection = 1
  AND a.published_at IS NOT NULL
ORDER BY a.id;