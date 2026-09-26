CREATE TABLE `artworks_to_facets` (
	`artwork_id` integer NOT NULL,
	`facet_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`artwork_id`, `facet_id`),
	FOREIGN KEY (`artwork_id`) REFERENCES `artworks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`facet_id`) REFERENCES `facets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `artworks_to_facets_facet_idx` ON `artworks_to_facets` (`facet_id`);--> statement-breakpoint
CREATE TABLE `facets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `facets_slug_type_unique` ON `facets` (`slug`,`type`);--> statement-breakpoint
CREATE INDEX `facets_type_idx` ON `facets` (`type`);--> statement-breakpoint
ALTER TABLE `artworks` ADD `width` real;--> statement-breakpoint
ALTER TABLE `artworks` ADD `height` real;--> statement-breakpoint
ALTER TABLE `artworks` ADD `depth` real;--> statement-breakpoint
ALTER TABLE `artworks` ADD `dimension_unit` text DEFAULT 'in';