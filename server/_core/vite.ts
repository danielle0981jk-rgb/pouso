import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getPublishedLandingBySlug } from "../db";

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function absoluteUrl(value: string | null | undefined, origin: string) {
  if (!value) return "";
  try { return new URL(value, origin).toString(); } catch { return ""; }
}

export function landingHead(page: NonNullable<Awaited<ReturnType<typeof getPublishedLandingBySlug>>>, origin: string) {
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description || "Confira os detalhes e acesse o projeto completo.");
  const image = escapeHtml(absoluteUrl(page.coverImageUrl, origin));
  const canonical = escapeHtml(`${origin}/p/${page.slug}`);
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    image ? `<meta property="og:image" content="${image}" />` : "",
    image ? `<meta property="og:image:secure_url" content="${image}" />` : "",
    image ? `<meta name="twitter:card" content="summary_large_image" />` : `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    image ? `<meta name="twitter:image" content="${image}" />` : "",
  ].filter(Boolean).join("\n    ");
}

async function htmlTemplate() {
  return fs.promises.readFile(path.resolve(import.meta.dirname, "public", "index.html"), "utf-8");
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(import.meta.dirname, "../..", "client", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = process.env.NODE_ENV === "development"
    ? path.resolve(import.meta.dirname, "../..", "dist", "public")
    : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) console.error(`Could not find the build directory: ${distPath}, make sure to build the client first`);

  app.get("/p/:slug", async (req, res, next) => {
    try {
      const page = await getPublishedLandingBySlug(req.params.slug);
      if (!page) return next();
      const template = await htmlTemplate();
      const forwardedProto = String(req.headers["x-forwarded-proto"] ?? "").split(",")[0];
      const protocol = forwardedProto || req.protocol;
      const requestOrigin = `${protocol}://${req.get("host")}`;
      const origin = (process.env.CANONICAL_ORIGIN || requestOrigin).replace(/\/$/, "");
      const html = template.replace("</head>", `    ${landingHead(page, origin)}\n  </head>`);
      return res.status(200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache" }).send(html);
    } catch (error) {
      console.error("[ShareMeta] Failed to compose landing metadata", error);
      return next(error);
    }
  });

  app.use(express.static(distPath, { index: false, redirect: false }));
  app.use("*", (_req, res) => res.sendFile(path.resolve(distPath, "index.html")));
}
