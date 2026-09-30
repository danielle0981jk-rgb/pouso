import { TRPCError } from "@trpc/server";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import * as db from "../db";
import { adminProcedure, router } from "../_core/trpc";

const generateSlug = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 7);
const reserved = new Set(["admin", "api", "health", "p", "r", "uploads"]);
export function normalizeShortSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}
export function isHttpUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; }
}
const input = z.object({
  name: z.string().trim().min(2, "Informe um nome para o link.").max(160),
  slug: z.string().trim().max(40).default(""),
  mode: z.enum(["landing", "direct"]),
  landingPageId: z.number().int().positive().nullable().optional(),
  destinationUrl: z.string().trim().max(2048).nullable().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});
async function uniqueSlug(requested: string, id?: number) {
  const normalized = normalizeShortSlug(requested);
  if (requested && (normalized.length < 3 || reserved.has(normalized))) throw new TRPCError({ code: "BAD_REQUEST", message: "Escolha um slug com ao menos 3 caracteres e não reservado." });
  if (normalized && !(await db.shortLinkSlugInUse(normalized, id))) return normalized;
  if (normalized) throw new TRPCError({ code: "CONFLICT", message: "Este slug já está em uso." });
  for (let i = 0; i < 10; i += 1) { const candidate = generateSlug(); if (!(await db.shortLinkSlugInUse(candidate, id))) return candidate; }
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível gerar um slug exclusivo." });
}
async function normalizeTarget(data: z.infer<typeof input>) {
  if (data.mode === "landing") {
    if (!data.landingPageId) throw new TRPCError({ code: "BAD_REQUEST", message: "Escolha uma página Pouso publicada." });
    const page = await db.getLandingById(data.landingPageId);
    if (!page || page.status !== "published") throw new TRPCError({ code: "BAD_REQUEST", message: "A página escolhida precisa estar publicada." });
    return { landingPageId: page.id, destinationUrl: null };
  }
  if (!data.destinationUrl || !isHttpUrl(data.destinationUrl)) throw new TRPCError({ code: "BAD_REQUEST", message: "Informe uma URL http ou https válida." });
  return { landingPageId: null, destinationUrl: data.destinationUrl };
}

export const shortLinksRouter = router({
  list: adminProcedure.query(() => db.listShortLinks()),
  create: adminProcedure.input(input).mutation(async ({ ctx, input }) => {
    const target = await normalizeTarget(input);
    return db.createShortLink({ ...input, slug: await uniqueSlug(input.slug), ...target, creatorEmail: ctx.user.email ?? "admin" });
  }),
  update: adminProcedure.input(input.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const old = await db.getShortLinkById(input.id);
    if (!old) throw new TRPCError({ code: "NOT_FOUND", message: "Link encurtado não encontrado." });
    const target = await normalizeTarget(input);
    return db.updateShortLink(input.id, { ...input, slug: await uniqueSlug(input.slug, input.id), ...target });
  }),
  remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    if (!(await db.deleteShortLink(input.id))) throw new TRPCError({ code: "NOT_FOUND", message: "Link encurtado não encontrado." });
    return { success: true } as const;
  }),
});
