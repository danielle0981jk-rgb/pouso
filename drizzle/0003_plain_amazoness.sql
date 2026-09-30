ALTER TABLE `landing_pages` ADD `logoUrl` text;--> statement-breakpoint
ALTER TABLE `landing_pages` ADD `logoPath` varchar(1024);--> statement-breakpoint
ALTER TABLE `landing_pages` ADD `primaryColor` varchar(7) DEFAULT '#ff7a22' NOT NULL;--> statement-breakpoint
ALTER TABLE `landing_pages` ADD `accentColor` varchar(7) DEFAULT '#ffad36' NOT NULL;--> statement-breakpoint
ALTER TABLE `landing_pages` ADD `backgroundColor` varchar(7) DEFAULT '#121313' NOT NULL;