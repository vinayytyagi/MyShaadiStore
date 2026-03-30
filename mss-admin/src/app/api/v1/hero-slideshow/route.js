import { NextResponse } from "next/server";
import { getSiteSettingsCollection } from "@/lib/db";
import { normalizeIndicatorColors } from "@/lib/heroSlideshowSettings";

const DOC_ID = "hero_slideshow";

const DEFAULTS = {
  slides: [],
  interval_seconds: 5,
  transition_ms: 900,
  autoplay: true,
};

function sanitizeSlide(s) {
  const image_url = String(s?.image_url || "").trim();
  if (!image_url) return null;
  return {
    image_url,
    alt: String(s?.alt || "").trim() || "Wedding hero image",
  };
}

export async function GET() {
  try {
    const col = await getSiteSettingsCollection();
    const doc = await col.findOne({ _id: DOC_ID });
    const slides = Array.isArray(doc?.slides) ? doc.slides.map(sanitizeSlide).filter(Boolean) : [];
    const indicator_colors = normalizeIndicatorColors(doc?.indicator_colors);
    return NextResponse.json({
      slides,
      interval_seconds: Math.min(60, Math.max(2, Number(doc?.interval_seconds) || DEFAULTS.interval_seconds)),
      transition_ms: Math.min(3000, Math.max(200, Number(doc?.transition_ms) || DEFAULTS.transition_ms)),
      autoplay: doc?.autoplay !== false,
      indicator_colors,
    });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
