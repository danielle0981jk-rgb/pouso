import { TRPCError } from "@trpc/server";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import * as db from "../db";
import { saveUploadedImage } from "../uploads";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";

const generateSlug = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 7);
const reserved = new Set(["admin", "api", "uploads", "health"]);
export function normalizeSlug(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40); }
export function isHttpUrl(value: string) { try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; } }
const input = z.object({
  title: z.string().trim().min(3, "Use pelo menos 3 caracteres.").max(180),
  description: z.string().trim().max(1500).default(""),
  buttonLabel: z.string().trim().min(2, "Informe o texto do botão.").max(80),
  destinationUrl: z.string().trim().refine(isHttpUrl, "Informe uma URL http ou https válida."),
  desktopDestinationUrl: z.string().trim().refine(isHttpUrl, "Informe uma URL http ou https válida.").nullable().optional(),
  slug: z.string().trim().max(40).default(""),
  status: z.enum(["draft", "published"]),
  clickMode: z.enum(["mobile_only", "all_devices"]).default("all_devices"),
  logoUrl: z.string().max(2048).nullable().optional(),
  logoPath: z.string().max(1024).nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  buttonTextColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  kickerText: z.string().max(100).nullable().optional(),
  trustText: z.string().max(100).nullable().optional(),
  footerText: z.string().max(1500).nullable().optional(),
  coverImageUrl: z.string().max(2048).nullable().optional(),
  coverImagePath: z.string().max(1024).nullable().optional(),
});
async function uniqueSlug(requested: string, id?: number) {
  const normalized = normalizeSlug(requested);
  if (requested && (normalized.length < 3 || reserved.has(normalized))) throw new TRPCError({ code: "BAD_REQUEST", message: "A URL curta precisa ter ao menos 3 caracteres e não pode ser reservada." });
  if (normalized) { if (await db.slugInUse(normalized, id)) throw new TRPCError({ code: "CONFLICT", message: "Essa URL curta já está em uso." }); return normalized; }
  for (let i = 0; i < 10; i += 1) { const value = generateSlug(); if (!(await db.slugInUse(value, id))) return value; }
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível gerar um slug exclusivo." });
}
function ensurePublishable(data: z.infer<typeof input>) { if (data.status === "published" && !data.coverImageUrl) throw new TRPCError({ code: "BAD_REQUEST", message: "Adicione uma imagem de capa para publicar." }); }

export const landingRouter = router({
  list: adminProcedure.query(() => db.listLandings()),
  getById: adminProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
    const page = await db.getLandingById(input.id); if (!page) throw new TRPCError({ code: "NOT_FOUND", message: "Página não encontrada." }); return page;
  }),
  getPublicBySlug: publicProcedure.input(z.object({ slug: z.string().min(3).max(40) })).query(async ({ input, ctx }) => {
    const page = await db.getPublishedLandingBySlug(normalizeSlug(input.slug)); if (!page) throw new TRPCError({ code: "NOT_FOUND", message: "Esta página não está disponível." }); 
    const ip = ctx.req.ip || ctx.req.socket.remoteAddress || "0.0.0.0";
    const ua = ctx.req.headers["user-agent"] || "Unknown";
    await db.recordVisit(ip, ua);
    return page;
  }),
  create: adminProcedure.input(input).mutation(async ({ ctx, input }) => {
    ensurePublishable(input); const slug = await uniqueSlug(input.slug); const brand = await db.getBrandSettings();
    return db.createLanding({ ...input, slug, description: input.description || null, coverImageUrl: input.coverImageUrl ?? null, coverImagePath: input.coverImagePath ?? null, logoUrl: input.logoUrl ?? brand.logoUrl, logoPath: input.logoPath ?? brand.logoPath, primaryColor: input.primaryColor ?? brand.primaryColor, accentColor: input.accentColor ?? brand.accentColor, backgroundColor: input.backgroundColor ?? brand.backgroundColor, creatorEmail: ctx.user.email ?? "admin", publishedAt: input.status === "published" ? new Date() : null });
  }),
  update: adminProcedure.input(input.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const old = await db.getLandingById(input.id); if (!old) throw new TRPCError({ code: "NOT_FOUND", message: "Página não encontrada." });
    ensurePublishable(input); const slug = await uniqueSlug(input.slug, input.id);
    return db.updateLanding(input.id, { ...input, slug, description: input.description || null, coverImageUrl: input.coverImageUrl ?? null, coverImagePath: input.coverImagePath ?? null, publishedAt: input.status === "published" ? old.publishedAt ?? new Date() : null });
  }),
  remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => { if (!(await db.deleteLanding(input.id))) throw new TRPCError({ code: "NOT_FOUND", message: "Página não encontrada." }); return { success: true } as const; }),
  uploadImage: adminProcedure.input(z.object({ base64: z.string().min(20), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]) })).mutation(({ input }) => saveUploadedImage(input.base64, input.mimeType)),
});
