/** Default ring colors for hero slideshow pagination (yellow → blue → pink). */
export const DEFAULT_INDICATOR_COLORS = ["#FFC107", "#4C6FFF", "#FF4F86"];

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function isHexColor(value) {
  return HEX.test(String(value || "").trim());
}

export function normalizeIndicatorColors(input) {
  return [0, 1, 2].map((i) => {
    const c = Array.isArray(input) ? String(input[i] || "").trim() : "";
    return isHexColor(c) ? c : DEFAULT_INDICATOR_COLORS[i];
  });
}
