CREATE TABLE `user_capabilities` (
	`username` text NOT NULL,
	`capability` text NOT NULL,
	PRIMARY KEY(`username`, `capability`),
	FOREIGN KEY (`username`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
