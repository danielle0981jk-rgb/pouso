export type ClickMode = "mobile_only" | "all_devices";

export function isMobileUserAgent(userAgent: string) {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent);
}

export function canClickCta(clickMode: ClickMode, userAgent: string) {
  return clickMode === "all_devices" || isMobileUserAgent(userAgent);
}
