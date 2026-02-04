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
CREATE UNIQUE INDEX `homepage_artworks_unique_artwork` ON `homepage_artworks` (`artwork_id`);