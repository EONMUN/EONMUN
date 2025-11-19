ALTER TABLE `artworks` ADD `slug` text NOT NULL;--> statement-breakpoint
ALTER TABLE `artworks` ADD `year` integer;--> statement-breakpoint
ALTER TABLE `artworks` ADD `default_image_url` text;--> statement-breakpoint
ALTER TABLE `artworks` ADD `images_json` text;--> statement-breakpoint
ALTER TABLE `artworks` ADD `published_at` integer;--> statement-breakpoint
ALTER TABLE `artworks` ADD `locale` text DEFAULT 'en' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `artworks_slug_unique` ON `artworks` (`slug`);--> statement-breakpoint
CREATE INDEX `artworks_slug_idx` ON `artworks` (`slug`);--> statement-breakpoint
ALTER TABLE `collections` ADD `slug` text NOT NULL;--> statement-breakpoint
ALTER TABLE `collections` ADD `published_at` integer;--> statement-breakpoint
ALTER TABLE `collections` ADD `locale` text DEFAULT 'en' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `collections_slug_unique` ON `collections` (`slug`);--> statement-breakpoint
CREATE INDEX `collections_slug_idx` ON `collections` (`slug`);