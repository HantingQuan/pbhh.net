CREATE TABLE `hitokoto` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`from` text,
	`from_who` text,
	`creator` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`creator`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
