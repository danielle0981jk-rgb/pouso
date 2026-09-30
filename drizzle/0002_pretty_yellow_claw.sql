CREATE TABLE `brand_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandName` varchar(120) NOT NULL DEFAULT 'SUA MARCA',
	`logoUrl` text,
	`logoPath` varchar(1024),
	`primaryColor` varchar(7) NOT NULL DEFAULT '#ff7a22',
	`accentColor` varchar(7) NOT NULL DEFAULT '#ffad36',
	`backgroundColor` varchar(7) NOT NULL DEFAULT '#121313',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_settings_id` PRIMARY KEY(`id`)
);
