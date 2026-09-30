import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { createAdminSession, LOCAL_ADMIN_COOKIE, localSessionCookieOptions, verifyAdminCredentials } from "./adminAuth";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { saveUploadedImage } from "./uploads";
import { landingRouter } from "./routers/landing";
import { shortLinksRouter } from "./routers/shortLinks";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      if (!(await verifyAdminCredentials(input.email, input.password))) return { success: false, message: "E-mail ou senha inválidos." } as const;
      ctx.res.cookie(LOCAL_ADMIN_COOKIE, await createAdminSession(input.email), localSessionCookieOptions());
      return { success: true } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      if ((ctx.req.headers.cookie ?? "").includes(`${LOCAL_ADMIN_COOKIE}=`)) ctx.res.clearCookie(LOCAL_ADMIN_COOKIE, { ...localSessionCookieOptions(), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  landing: landingRouter,
  shortLinks: shortLinksRouter,
  identity: router({
    get: publicProcedure.query(() => db.getBrandSettings()),
    update: adminProcedure.input(z.object({
      brandName: z.string().trim().min(2).max(120),
      primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      logoUrl: z.string().max(2048).nullable().optional(),
      logoPath: z.string().max(1024).nullable().optional(),
    })).mutation(({ input }) => db.updateBrandSettings(input)),
    uploadLogo: adminProcedure.input(z.object({ base64: z.string().min(20), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]) })).mutation(({ input }) => saveUploadedImage(input.base64, input.mimeType)),
  }),
});
export type AppRouter = typeof appRouter;
