CREATE TABLE `short_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(40) NOT NULL,
	`mode` enum('landing','direct') NOT NULL DEFAULT 'direct',
	`landingPageId` int,
	`destinationUrl` varchar(2048),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`clicks` int NOT NULL DEFAULT 0,
	`creatorEmail` varchar(320) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `short_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `short_links_slug_unique` UNIQUE(`slug`)
);
