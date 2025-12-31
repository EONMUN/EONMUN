-- Create new artwork_images table
CREATE TABLE `artwork_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`artwork_id` integer NOT NULL,
	`url` text NOT NULL,
	`caption` text,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`artwork_id`) REFERENCES `artworks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `artwork_images_artwork_idx` ON `artwork_images` (`artwork_id`);
--> statement-breakpoint
-- Migrate existing default_image_url values to artwork_images table as default images
INSERT INTO `artwork_images` (`artwork_id`, `url`, `is_default`, `created_at`, `updated_at`)
SELECT `id`, `default_image_url`, 1, `created_at`, `updated_at`
FROM `artworks`
WHERE `default_image_url` IS NOT NULL AND `default_image_url` != '';
--> statement-breakpoint
-- Create unique index after data migration to avoid conflicts
CREATE UNIQUE INDEX `artwork_images_one_default_per_artwork` ON `artwork_images` (`artwork_id`) WHERE "artwork_images"."is_default" = 1;
--> statement-breakpoint
-- Now safe to drop the old columns
ALTER TABLE `artworks` DROP COLUMN `default_image_url`;
--> statement-breakpoint
ALTER TABLE `artworks` DROP COLUMN `images_json`;