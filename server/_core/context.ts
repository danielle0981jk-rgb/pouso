import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getLocalAdminUser } from "../adminAuth";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const localAdmin = await getLocalAdminUser(opts.req);
  if (localAdmin) return { req: opts.req, res: opts.res, user: localAdmin };
  let user: User | null = null;
  try { user = await sdk.authenticateRequest(opts.req); } catch { user = null; }
  return { req: opts.req, res: opts.res, user };
}
