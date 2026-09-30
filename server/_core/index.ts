import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { uploadsDirectory } from "../uploads";
import { getActiveShortLinkBySlug, getLandingById, incrementShortLinkClicks } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => server.close(() => resolve(true)));
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(start = 3000) {
  for (let port = start; port < start + 20; port += 1) if (await isPortAvailable(port)) return port;
  throw new Error("No available port found");
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
  app.get("/r/:slug", async (req, res) => {
    try {
      const shortLink = await getActiveShortLinkBySlug(req.params.slug);
      if (!shortLink) return res.status(404).send("Link não encontrado ou inativo.");
      let target: string | null = shortLink.destinationUrl;
      if (shortLink.mode === "landing" && shortLink.landingPageId) {
        const page = await getLandingById(shortLink.landingPageId);
        if (!page || page.status !== "published") return res.status(404).send("A página de destino não está publicada.");
        target = `/p/${page.slug}`;
      }
      if (!target) return res.status(404).send("Destino do link não configurado.");
      await incrementShortLinkClicks(shortLink.id);
      return res.redirect(302, target);
    } catch (error) {
      console.error("[ShortLink] Redirect failed", error);
      return res.status(500).send("Não foi possível abrir este link agora.");
    }
  });
  app.use("/uploads", express.static(uploadsDirectory(), { maxAge: "7d" }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  if (process.env.NODE_ENV === "development") await setupVite(app, server);
  else serveStatic(app);
  const preferred = Number.parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferred);
  server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
}
startServer().catch(console.error);
