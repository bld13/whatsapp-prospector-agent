import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  campaigns,
  leads,
  leadQualifications,
  leadContacts,
  salesArguments,
  InsertCampaign,
  InsertLead,
  InsertLeadQualification,
  InsertLeadContact,
  InsertSalesArgument,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Campaign queries
export async function createCampaign(data: InsertCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(campaigns).values(data);
  return result;
}

export async function getCampaignById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);
  return result[0];
}

export async function getCampaignsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(campaigns)
    .where(eq(campaigns.userId, userId));
}

// Lead queries
export async function createLead(data: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leads).values(data);
  return result;
}

export async function createLeadBatch(dataList: InsertLead[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leads).values(dataList);
  return result;
}

export async function getLeadsByCampaignId(campaignId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(leads)
    .where(eq(leads.campaignId, campaignId));
}

export async function getLeadByCnpj(cnpj: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(leads)
    .where(eq(leads.cnpj, cnpj))
    .limit(1);
  return result[0];
}

// Lead qualification queries
export async function createLeadQualification(data: InsertLeadQualification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leadQualifications).values(data);
  return result;
}

export async function getLeadQualification(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(leadQualifications)
    .where(eq(leadQualifications.leadId, leadId))
    .limit(1);
  return result[0];
}

export async function updateLeadQualification(
  leadId: number,
  data: Partial<InsertLeadQualification>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .update(leadQualifications)
    .set(data)
    .where(eq(leadQualifications.leadId, leadId));
}

// Lead contact queries
export async function createLeadContact(data: InsertLeadContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leadContacts).values(data);
  return result;
}

export async function getLeadContact(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(leadContacts)
    .where(eq(leadContacts.leadId, leadId))
    .limit(1);
  return result[0];
}

export async function updateLeadContact(
  leadId: number,
  data: Partial<InsertLeadContact>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .update(leadContacts)
    .set(data)
    .where(eq(leadContacts.leadId, leadId));
}

// Sales arguments queries
export async function createSalesArgument(data: InsertSalesArgument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(salesArguments).values(data);
  return result;
}

export async function getSalesArgumentsByLeadId(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(salesArguments)
    .where(eq(salesArguments.leadId, leadId));
}
