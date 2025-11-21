CREATE TABLE `artworks_to_collections` (
	`artwork_id` integer NOT NULL,
	`collection_id` integer NOT NULL,
	`is_default_for_collection` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`artwork_id`, `collection_id`),
	FOREIGN KEY (`artwork_id`) REFERENCES `artworks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artwork_collection_one_default_per_collection` ON `artworks_to_collections` (`collection_id`) WHERE "artworks_to_collections"."is_default_for_collection" = 1;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_artworks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`artist` text,
	`year` integer,
	`price` integer,
	`default_image_url` text,
	`images_json` text,
	`published_at` integer,
	`locale` text DEFAULT 'en' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_artworks`("id", "title", "slug", "description", "artist", "year", "price", "default_image_url", "images_json", "published_at", "locale", "created_at", "updated_at") SELECT "id", "title", "slug", "description", "artist", "year", "price", "default_image_url", "images_json", "published_at", "locale", "created_at", "updated_at" FROM `artworks`;--> statement-breakpoint
DROP TABLE `artworks`;--> statement-breakpoint
ALTER TABLE `__new_artworks` RENAME TO `artworks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `artworks_slug_unique` ON `artworks` (`slug`);--> statement-breakpoint
CREATE INDEX `artworks_slug_idx` ON `artworks` (`slug`);