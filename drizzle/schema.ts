import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Campaigns table
export const campaigns = mysqlTable(
  "campaigns",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    niche: varchar("niche", { length: 255 }).notNull(),

    minCapitalSocial: decimal("minCapitalSocial", { precision: 15, scale: 2 }),
    status: mysqlEnum("status", ["draft", "active", "paused", "completed"]).default("draft").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_campaigns_userId").on(table.userId),
  })
);

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// Leads table
export const leads = mysqlTable(
  "leads",
  {
    id: int("id").autoincrement().primaryKey(),
    campaignId: int("campaignId").notNull(),
    cnpj: varchar("cnpj", { length: 14 }).notNull().unique(),
    razaoSocial: varchar("razaoSocial", { length: 255 }).notNull(),
    nomeFantasia: varchar("nomeFantasia", { length: 255 }),
    porte: varchar("porte", { length: 50 }), // ME, EPP, Média, Grande
    capitalSocial: decimal("capitalSocial", { precision: 15, scale: 2 }),
    email: varchar("email", { length: 320 }),
    telefone: varchar("telefone", { length: 20 }),
    uf: varchar("uf", { length: 2 }).notNull(),
    municipio: varchar("municipio", { length: 100 }),
    cnaeSecundarios: text("cnaeSecundarios"), // JSON array
    naturezaJuridica: varchar("naturezaJuridica", { length: 255 }),
    situacaoCadastral: varchar("situacaoCadastral", { length: 50 }),
    decisionMakers: text("decisionMakers"), // JSON array of DecisionMaker objects
    outreachStatus: mysqlEnum("outreachStatus", ["none", "pending", "sent", "failed"]).default("none").notNull(),
    outreachLastSent: timestamp("outreachLastSent"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    campaignIdIdx: index("idx_leads_campaignId").on(table.campaignId),
    cnpjIdx: index("idx_leads_cnpj").on(table.cnpj),
  })
);

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// Lead qualifications table
export const leadQualifications = mysqlTable(
  "leadQualifications",
  {
    id: int("id").autoincrement().primaryKey(),
    leadId: int("leadId").notNull().unique(),
    isQualified: boolean("isQualified").default(false).notNull(),
    apiOfficialDetected: boolean("apiOfficialDetected").default(false),
    apiOfficialConfidence: int("apiOfficialConfidence").default(0), // 0-100
    qualificationReason: text("qualificationReason"), // JSON with reasons
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    leadIdIdx: index("idx_leadQualifications_leadId").on(table.leadId),
  })
);

export type LeadQualification = typeof leadQualifications.$inferSelect;
export type InsertLeadQualification = typeof leadQualifications.$inferInsert;

// Lead contacts table (for tracking interactions)
export const leadContacts = mysqlTable(
  "leadContacts",
  {
    id: int("id").autoincrement().primaryKey(),
    leadId: int("leadId").notNull(),
    status: mysqlEnum("status", ["novo", "contatado", "qualificado", "convertido", "rejeitado"]).default("novo").notNull(),
    lastContactDate: timestamp("lastContactDate"),
    nextFollowUpDate: timestamp("nextFollowUpDate"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    leadIdIdx: index("idx_leadContacts_leadId").on(table.leadId),
    statusIdx: index("idx_leadContacts_status").on(table.status),
  })
);

export type LeadContact = typeof leadContacts.$inferSelect;
export type InsertLeadContact = typeof leadContacts.$inferInsert;

// Sales arguments table
export const salesArguments = mysqlTable(
  "salesArguments",
  {
    id: int("id").autoincrement().primaryKey(),
    leadId: int("leadId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    keyBenefits: text("keyBenefits"), // JSON array
    costReductionEstimate: varchar("costReductionEstimate", { length: 100 }), // e.g., "30-50%"
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    leadIdIdx: index("idx_salesArguments_leadId").on(table.leadId),
  })
);

export type SalesArgument = typeof salesArguments.$inferSelect;
export type InsertSalesArgument = typeof salesArguments.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  campaigns: many(campaigns),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id],
  }),
  leads: many(leads),
}));

export const leadsRelations = relations(leads, ({ one, one: oneQualification, one: oneContact, many }) => ({
  campaign: one(campaigns, {
    fields: [leads.campaignId],
    references: [campaigns.id],
  }),
  qualification: oneQualification(leadQualifications, {
    fields: [leads.id],
    references: [leadQualifications.leadId],
  }),
  contact: oneContact(leadContacts, {
    fields: [leads.id],
    references: [leadContacts.leadId],
  }),
  salesArguments: many(salesArguments),
}));

export const leadQualificationsRelations = relations(leadQualifications, ({ one }) => ({
  lead: one(leads, {
    fields: [leadQualifications.leadId],
    references: [leads.id],
  }),
}));

export const leadContactsRelations = relations(leadContacts, ({ one }) => ({
  lead: one(leads, {
    fields: [leadContacts.leadId],
    references: [leads.id],
  }),
}));

export const salesArgumentsRelations = relations(salesArguments, ({ one }) => ({
  lead: one(leads, {
    fields: [salesArguments.leadId],
    references: [leads.id],
  }),
}));