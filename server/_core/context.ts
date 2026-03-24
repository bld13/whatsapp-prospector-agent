import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Local development bypass: simulate a default user if none is found
  if (!user && process.env.NODE_ENV !== 'production') {
    user = {
      id: 1, // Use numeric ID for database compatibility
      name: "Mateus",
      email: "mateus@prospector.local",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date()
    } as any;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
