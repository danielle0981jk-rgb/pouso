import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  listShortLinks: vi.fn(), getShortLinkById: vi.fn(), getActiveShortLinkBySlug: vi.fn(), shortLinkSlugInUse: vi.fn(),
  createShortLink: vi.fn(), updateShortLink: vi.fn(), deleteShortLink: vi.fn(), incrementShortLinkClicks: vi.fn(),
  getLandingById: vi.fn(),
}));

const context = (role: "admin" | "user"): TrpcContext => ({
  user: { id: 1, openId: "test", name: "Test", email: "test@example.com", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});
const direct = { name: "Anúncio verão", slug: "verao", mode: "direct" as const, landingPageId: null, destinationUrl: "https://example.com/oferta", status: "active" as const };

describe("short link procedures", () => {
  it("blocks non-admin listing", async () => {
    await expect(appRouter.createCaller(context("user")).shortLinks.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("creates a direct link with a unique slug", async () => {
    vi.mocked(db.shortLinkSlugInUse).mockResolvedValueOnce(false);
    const saved = { id: 1, ...direct } as any;
    vi.mocked(db.createShortLink).mockResolvedValueOnce(saved);
    await expect(appRouter.createCaller(context("admin")).shortLinks.create(direct)).resolves.toEqual(saved);
    expect(db.createShortLink).toHaveBeenCalledWith(expect.objectContaining({ slug: "verao", destinationUrl: direct.destinationUrl, landingPageId: null, creatorEmail: "test@example.com" }));
  });
  it("requires a published landing for landing mode", async () => {
    vi.mocked(db.getLandingById).mockResolvedValueOnce({ id: 7, status: "draft" } as any);
    await expect(appRouter.createCaller(context("admin")).shortLinks.create({ ...direct, mode: "landing", landingPageId: 7, destinationUrl: null })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("rejects a duplicate slug", async () => {
    vi.mocked(db.shortLinkSlugInUse).mockResolvedValueOnce(true);
    await expect(appRouter.createCaller(context("admin")).shortLinks.create(direct)).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("rejects updating an unknown short link", async () => {
    vi.mocked(db.getShortLinkById).mockResolvedValueOnce(undefined);
    await expect(appRouter.createCaller(context("admin")).shortLinks.update({ ...direct, id: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
