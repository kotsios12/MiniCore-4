export const BOOT_SEEN_KEY = "minicore4_boot_seen";

let seenInPage = false;
export function shouldPlayBoot(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return false;
  if (seenInPage) return false;
  try {
    return window.sessionStorage.getItem(BOOT_SEEN_KEY) !== "1";
  } catch {
    return true;
  }
}
export function markBootSeen(): void {
  seenInPage = true;
  try {
    window.sessionStorage.setItem(BOOT_SEEN_KEY, "1");
  } catch {
    return;
  }
}
