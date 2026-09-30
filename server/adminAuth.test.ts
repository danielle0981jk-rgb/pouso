import { afterEach, describe, expect, it, vi } from "vitest";
import { createAdminSession, getLocalAdminUser, LOCAL_ADMIN_COOKIE, verifyAdminCredentials } from "./adminAuth";

afterEach(() => vi.unstubAllEnvs());

describe("local admin session", () => {
  it("accepts configured admin credentials", async () => {
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com");
    vi.stubEnv("ADMIN_PASSWORD", "strong-password");
    expect(await verifyAdminCredentials("admin@example.com", "strong-password")).toBe(true);
    expect(await verifyAdminCredentials("user@example.com", "strong-password")).toBe(false);
  });

  it("returns an admin user from the signed cookie", async () => {
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com");
    vi.stubEnv("ADMIN_PASSWORD", "strong-password");
    vi.stubEnv("JWT_SECRET", "test-secret-for-session");
    const token = await createAdminSession("admin@example.com");
    const request = { headers: { cookie: `${LOCAL_ADMIN_COOKIE}=${token}` } } as any;
    const user = await getLocalAdminUser(request);
    expect(user?.role).toBe("admin");
    expect(user?.email).toBe("admin@example.com");
  });
});
