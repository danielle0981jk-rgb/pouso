import { and, desc, eq, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { BrandSettings, InsertBrandSettings, InsertLandingPage, InsertShortLink, InsertUser, brandSettings, landingPages, ShortLink, shortLinks, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let database: ReturnType<typeof drizzle> | null = null;

export function resolveDatabaseUrl() {
  const direct = [process.env.DATABASE_URL, process.env.MYSQL_URL, process.env.MYSQL_PUBLIC_URL].find(value => Boolean(value?.trim()));
  if (direct) return direct;
  const host = process.env.MYSQLHOST;
  const port = process.env.MYSQLPORT ?? "3306";
  const user = process.env.MYSQLUSER;
  const password = process.env.MYSQLPASSWORD;
  const databaseName = process.env.MYSQLDATABASE;
  if (!host || !user || !password || !databaseName) return "";
  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(databaseName)}`;
}

export async function getDb() {
  if (!database) {
    const url = resolveDatabaseUrl();
    if (url) database = drizzle(url);
  }
  return database;
}
async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Banco indisponível. Configure DATABASE_URL ou as variáveis MYSQL_* do Railway.");
  return db;
}
export async function upsertUser(user: InsertUser) {
  const db = await getDb();
  if (!db || !user.openId) return;
  const values: InsertUser = { openId: user.openId, name: user.name ?? null, email: user.email ?? null, loginMethod: user.loginMethod ?? null, role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"), lastSignedIn: new Date() };
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: { name: values.name, email: values.email, loginMethod: values.loginMethod, role: values.role, lastSignedIn: values.lastSignedIn } });
}
export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return result[0];
}
export async function listLandings() { const db = await requireDb(); return db.select().from(landingPages).orderBy(desc(landingPages.updatedAt)); }
export async function getLandingById(id: number) { const db = await requireDb(); return (await db.select().from(landingPages).where(eq(landingPages.id, id)).limit(1))[0]; }
export async function getPublishedLandingBySlug(slug: string) { const db = await requireDb(); return (await db.select().from(landingPages).where(and(eq(landingPages.slug, slug), eq(landingPages.status, "published"))).limit(1))[0]; }
export async function slugInUse(slug: string, excludeId?: number) {
  const db = await requireDb();
  const condition = excludeId ? and(eq(landingPages.slug, slug), ne(landingPages.id, excludeId)) : eq(landingPages.slug, slug);
  return Boolean((await db.select({ id: landingPages.id }).from(landingPages).where(condition).limit(1))[0]);
}
export async function createLanding(values: InsertLandingPage) {
  const db = await requireDb(); const result = await db.insert(landingPages).values(values);
  const landing = await getLandingById(Number(result[0].insertId)); if (!landing) throw new Error("Falha ao salvar página."); return landing;
}
export async function updateLanding(id: number, values: Partial<InsertLandingPage>) { const db = await requireDb(); await db.update(landingPages).set(values).where(eq(landingPages.id, id)); return getLandingById(id); }
export async function deleteLanding(id: number) { const db = await requireDb(); const result = await db.delete(landingPages).where(eq(landingPages.id, id)); return result[0].affectedRows > 0; }
export async function getBrandSettings(): Promise<BrandSettings> {
  const db = await requireDb();
  const current = (await db.select().from(brandSettings).where(eq(brandSettings.id, 1)).limit(1))[0];
  if (current) return current;
  await db.insert(brandSettings).values({ id: 1 }).onDuplicateKeyUpdate({ set: { id: 1 } });
  return (await db.select().from(brandSettings).where(eq(brandSettings.id, 1)).limit(1))[0];
}
export async function updateBrandSettings(values: Partial<InsertBrandSettings>) {
  const db = await requireDb();
  await db.insert(brandSettings).values({ id: 1, ...values }).onDuplicateKeyUpdate({ set: values });
  return getBrandSettings();
}

export async function listShortLinks(): Promise<ShortLink[]> {
  const db = await requireDb();
  return db.select().from(shortLinks).orderBy(desc(shortLinks.updatedAt));
}
export async function getShortLinkById(id: number) {
  const db = await requireDb();
  return (await db.select().from(shortLinks).where(eq(shortLinks.id, id)).limit(1))[0];
}
export async function getActiveShortLinkBySlug(slug: string) {
  const db = await requireDb();
  return (await db.select().from(shortLinks).where(and(eq(shortLinks.slug, slug), eq(shortLinks.status, "active"))).limit(1))[0];
}
export async function shortLinkSlugInUse(slug: string, excludeId?: number) {
  const db = await requireDb();
  const condition = excludeId ? and(eq(shortLinks.slug, slug), ne(shortLinks.id, excludeId)) : eq(shortLinks.slug, slug);
  return Boolean((await db.select({ id: shortLinks.id }).from(shortLinks).where(condition).limit(1))[0]);
}
export async function createShortLink(values: InsertShortLink) {
  const db = await requireDb();
  const result = await db.insert(shortLinks).values(values);
  const link = await getShortLinkById(Number(result[0].insertId));
  if (!link) throw new Error("Falha ao salvar link encurtado.");
  return link;
}
export async function updateShortLink(id: number, values: Partial<InsertShortLink>) {
  const db = await requireDb();
  await db.update(shortLinks).set(values).where(eq(shortLinks.id, id));
  return getShortLinkById(id);
}
export async function deleteShortLink(id: number) {
  const db = await requireDb();
  const result = await db.delete(shortLinks).where(eq(shortLinks.id, id));
  return result[0].affectedRows > 0;
}
export async function incrementShortLinkClicks(id: number) {
  const db = await requireDb();
  await db.update(shortLinks).set({ clicks: sql`${shortLinks.clicks} + 1` }).where(eq(shortLinks.id, id));
}
