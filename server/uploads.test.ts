import { rm } from "fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import { saveUploadedImage } from "./uploads";
import { storagePut } from "./storage";

vi.mock("./storage", () => ({ storagePut: vi.fn() }));

describe("persistent image uploads", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("falls back to the Railway volume when platform storage credentials are absent", async () => {
    const directory = "/tmp/pouso-upload-test";
    vi.stubEnv("BUILT_IN_FORGE_API_URL", "");
    vi.stubEnv("BUILT_IN_FORGE_API_KEY", "");
    vi.stubEnv("UPLOAD_DIR", directory);

    const result = await saveUploadedImage(Buffer.from("valid image bytes").toString("base64"), "image/jpeg");

    expect(result.url).toMatch(/^\/uploads\/.+\.jpg$/);
    await rm(directory, { recursive: true, force: true });
  });

  it("sends the uploaded bytes to shared storage and returns its public URL", async () => {
    vi.stubEnv("BUILT_IN_FORGE_API_URL", "https://forge.test");
    vi.stubEnv("BUILT_IN_FORGE_API_KEY", "test-key");
    vi.mocked(storagePut).mockResolvedValueOnce({
      key: "landing-assets/cover.webp_abc123.webp",
      url: "/manus-storage/landing-assets/cover.webp_abc123.webp",
    });

    const result = await saveUploadedImage(Buffer.from("valid image bytes").toString("base64"), "image/webp");

    expect(storagePut).toHaveBeenCalledWith(
      expect.stringMatching(/^landing-assets\/.+\.webp$/),
      expect.any(Buffer),
      "image/webp",
    );
    expect(result.url).toBe("/manus-storage/landing-assets/cover.webp_abc123.webp");
    expect(result.path).toBe("landing-assets/cover.webp_abc123.webp");
  });
});
