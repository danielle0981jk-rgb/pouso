import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const landingPages = mysqlTable("landing_pages", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  buttonLabel: varchar("buttonLabel", { length: 80 }).notNull(),
  destinationUrl: varchar("destinationUrl", { length: 2048 }).notNull(),
  slug: varchar("slug", { length: 40 }).notNull().unique(),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  coverImageUrl: text("coverImageUrl"),
  coverImagePath: varchar("coverImagePath", { length: 1024 }),
  logoUrl: text("logoUrl"),
  logoPath: varchar("logoPath", { length: 1024 }),
  primaryColor: varchar("primaryColor", { length: 7 }).notNull().default("#ff7a22"),
  accentColor: varchar("accentColor", { length: 7 }).notNull().default("#ffad36"),
  backgroundColor: varchar("backgroundColor", { length: 7 }).notNull().default("#121313"),
  clickMode: mysqlEnum("clickMode", ["mobile_only", "all_devices"]).notNull().default("all_devices"),
  creatorEmail: varchar("creatorEmail", { length: 320 }).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const shortLinks = mysqlTable("short_links", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 40 }).notNull().unique(),
  mode: mysqlEnum("mode", ["landing", "direct"]).notNull().default("direct"),
  landingPageId: int("landingPageId"),
  destinationUrl: varchar("destinationUrl", { length: 2048 }),
  status: mysqlEnum("status", ["active", "inactive"]).notNull().default("active"),
  clicks: int("clicks").notNull().default(0),
  creatorEmail: varchar("creatorEmail", { length: 320 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export const brandSettings = mysqlTable("brand_settings", {
  id: int("id").autoincrement().primaryKey(),
  brandName: varchar("brandName", { length: 120 }).notNull().default("SUA MARCA"),
  logoUrl: text("logoUrl"),
  logoPath: varchar("logoPath", { length: 1024 }),
  primaryColor: varchar("primaryColor", { length: 7 }).notNull().default("#ff7a22"),
  accentColor: varchar("accentColor", { length: 7 }).notNull().default("#ffad36"),
  backgroundColor: varchar("backgroundColor", { length: 7 }).notNull().default("#121313"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LandingPage = typeof landingPages.$inferSelect;
export type InsertLandingPage = typeof landingPages.$inferInsert;
export type BrandSettings = typeof brandSettings.$inferSelect;
export type ShortLink = typeof shortLinks.$inferSelect;
export type InsertShortLink = typeof shortLinks.$inferInsert;
export type InsertBrandSettings = typeof brandSettings.$inferInsert;
