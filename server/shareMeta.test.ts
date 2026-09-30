import { describe, expect, it } from "vitest";
import { absoluteUrl, landingHead } from "./_core/vite";

describe("landing share metadata", () => {
  it("turns a storage-relative cover URL into an absolute public URL", () => {
    expect(absoluteUrl("/manus-storage/landing-assets/cover.webp", "https://campanha.example.com")).toBe("https://campanha.example.com/manus-storage/landing-assets/cover.webp");
  });

  it("includes the cover image in Open Graph and Twitter metadata", () => {
    const head = landingHead({
      slug: "campanha-verao",
      title: "Campanha de verão",
      description: "Detalhes da campanha",
      coverImageUrl: "/manus-storage/landing-assets/cover.webp",
    } as any, "https://campanha.example.com");

    expect(head).toContain('property="og:image" content="https://campanha.example.com/manus-storage/landing-assets/cover.webp"');
    expect(head).toContain('name="twitter:image" content="https://campanha.example.com/manus-storage/landing-assets/cover.webp"');
    expect(head).toContain('href="https://campanha.example.com/p/campanha-verao"');
  });
});
