import { afterEach, describe, expect, it, vi } from "vitest";
import { decodeImage } from "./uploads";
import { isHttpUrl, normalizeSlug } from "./routers/landing";
import { resolveDatabaseUrl } from "./db";

afterEach(() => vi.unstubAllEnvs());

describe("landing page validation", () => {
  it("normalizes readable slugs", () => {
    expect(normalizeSlug("  Verão na Fazenda 2026! ")).toBe("verao-na-fazenda-2026");
  });
  it("accepts only http and https destinations", () => {
    expect(isHttpUrl("https://example.com/offer")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("not-a-url")).toBe(false);
  });
  it("resolves the native Railway MySQL variables", () => {
    vi.stubEnv("DATABASE_URL", ""); vi.stubEnv("MYSQL_URL", ""); vi.stubEnv("MYSQL_PUBLIC_URL", "");
    vi.stubEnv("MYSQLHOST", "mysql.railway.internal"); vi.stubEnv("MYSQLPORT", "3306"); vi.stubEnv("MYSQLUSER", "root"); vi.stubEnv("MYSQLPASSWORD", "p@ss"); vi.stubEnv("MYSQLDATABASE", "railway");
    expect(resolveDatabaseUrl()).toBe("mysql://root:p%40ss@mysql.railway.internal:3306/railway");
  });
  it("rejects unsupported or oversized images", () => {
    expect(() => decodeImage(Buffer.from("hello").toString("base64"), "image/gif")).toThrow();
    expect(() => decodeImage(Buffer.alloc(5 * 1024 * 1024 + 1).toString("base64"), "image/png")).toThrow();
  });
});
