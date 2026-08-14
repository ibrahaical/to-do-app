CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`icon` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`notes` text,
	`due_date` integer,
	`reminder_at` integer,
	`priority` text DEFAULT 'medium' NOT NULL,
	`is_completed` integer DEFAULT 0 NOT NULL,
	`completed_at` integer,
	`order_index` integer DEFAULT 0 NOT NULL,
	`category_id` text,
	`category` text,
	`notification_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
