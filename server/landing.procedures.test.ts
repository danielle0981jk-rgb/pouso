import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  listLandings: vi.fn(), getLandingById: vi.fn(), getPublishedLandingBySlug: vi.fn(), slugInUse: vi.fn(),
  createLanding: vi.fn(), updateLanding: vi.fn(), deleteLanding: vi.fn(),
}));

const user = (role: "admin" | "user"): NonNullable<TrpcContext["user"]> => ({
  id: 1, openId: "test", name: "Test", email: "test@example.com", loginMethod: "test", role,
  createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
});
const context = (role: "admin" | "user"): TrpcContext => ({
  user: user(role), req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});
const valid = { title: "Campanha de verão", description: "Detalhes", buttonLabel: "Participar agora", destinationUrl: "https://example.com/destino", slug: "campanha-verao", status: "draft" as const, coverImageUrl: null, coverImagePath: null };

describe("landing procedures", () => {
  it("blocks non-admin listing", async () => {
    await expect(appRouter.createCaller(context("user")).landing.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("lists pages for admins", async () => {
    vi.mocked(db.listLandings).mockResolvedValueOnce([]);
    await expect(appRouter.createCaller(context("admin")).landing.list()).resolves.toEqual([]);
  });
  it("rejects publishing without a cover image", async () => {
    await expect(appRouter.createCaller(context("admin")).landing.create({ ...valid, status: "published" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.createLanding).not.toHaveBeenCalled();
  });
  it("rejects a duplicate slug", async () => {
    vi.mocked(db.slugInUse).mockResolvedValueOnce(true);
    await expect(appRouter.createCaller(context("admin")).landing.create(valid)).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("normalizes public slugs before querying", async () => {
    const page = { id: 1, slug: "campanha-verao", status: "published" } as any;
    vi.mocked(db.getPublishedLandingBySlug).mockResolvedValueOnce(page);
    await expect(appRouter.createCaller(context("user")).landing.getPublicBySlug({ slug: " Campanha Verão " })).resolves.toEqual(page);
    expect(db.getPublishedLandingBySlug).toHaveBeenCalledWith("campanha-verao");
  });
  it("rejects removing an unknown page", async () => {
    vi.mocked(db.deleteLanding).mockResolvedValueOnce(false);
    await expect(appRouter.createCaller(context("admin")).landing.remove({ id: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("rejects updating an unknown page", async () => {
    vi.mocked(db.getLandingById).mockResolvedValueOnce(undefined);
    await expect(appRouter.createCaller(context("admin")).landing.update({ ...valid, id: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
