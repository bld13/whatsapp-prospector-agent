CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`niche` varchar(255) NOT NULL,
	`cnaeCodes` text NOT NULL,
	`regions` text NOT NULL,
	`minCapitalSocial` decimal(15,2),
	`status` enum('draft','active','paused','completed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leadContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`status` enum('novo','contatado','qualificado','convertido','rejeitado') NOT NULL DEFAULT 'novo',
	`lastContactDate` timestamp,
	`nextFollowUpDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leadContacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leadQualifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`isQualified` boolean NOT NULL DEFAULT false,
	`apiOfficialDetected` boolean DEFAULT false,
	`apiOfficialConfidence` int DEFAULT 0,
	`qualificationReason` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leadQualifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `leadQualifications_leadId_unique` UNIQUE(`leadId`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`cnpj` varchar(14) NOT NULL,
	`razaoSocial` varchar(255) NOT NULL,
	`nomeFantasia` varchar(255),
	`porte` varchar(50),
	`capitalSocial` decimal(15,2),
	`email` varchar(320),
	`telefone` varchar(20),
	`uf` varchar(2) NOT NULL,
	`municipio` varchar(100),
	`cnaeSecundarios` text,
	`naturezaJuridica` varchar(255),
	`situacaoCadastral` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `leads_cnpj_unique` UNIQUE(`cnpj`)
);
--> statement-breakpoint
CREATE TABLE `salesArguments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`keyBenefits` text,
	`costReductionEstimate` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `salesArguments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_campaigns_userId` ON `campaigns` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_leadContacts_leadId` ON `leadContacts` (`leadId`);--> statement-breakpoint
CREATE INDEX `idx_leadContacts_status` ON `leadContacts` (`status`);--> statement-breakpoint
CREATE INDEX `idx_leadQualifications_leadId` ON `leadQualifications` (`leadId`);--> statement-breakpoint
CREATE INDEX `idx_leads_campaignId` ON `leads` (`campaignId`);--> statement-breakpoint
CREATE INDEX `idx_leads_cnpj` ON `leads` (`cnpj`);--> statement-breakpoint
CREATE INDEX `idx_salesArguments_leadId` ON `salesArguments` (`leadId`);