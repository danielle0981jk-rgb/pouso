CREATE TABLE `landing_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text,
	`buttonLabel` varchar(80) NOT NULL,
	`destinationUrl` varchar(2048) NOT NULL,
	`slug` varchar(40) NOT NULL,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`coverImageUrl` text,
	`coverImagePath` varchar(1024),
	`creatorEmail` varchar(320) NOT NULL,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `landing_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `landing_pages_slug_unique` UNIQUE(`slug`)
);
