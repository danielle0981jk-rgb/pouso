import { describe, expect, it } from "vitest";
import { canClickCta, isMobileUserAgent } from "../shared/clickMode";

describe("CTA click mode", () => {
  const desktop = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36";
  const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";

  it("allows all devices in the default mode", () => {
    expect(canClickCta("all_devices", desktop)).toBe(true);
    expect(canClickCta("all_devices", iphone)).toBe(true);
  });

  it("only allows mobile user agents in mobile_only mode", () => {
    expect(canClickCta("mobile_only", desktop)).toBe(false);
    expect(canClickCta("mobile_only", iphone)).toBe(true);
    expect(isMobileUserAgent(iphone)).toBe(true);
  });
});
