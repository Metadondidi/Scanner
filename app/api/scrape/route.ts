import { NextRequest, NextResponse } from "next/server";
import { scrapeReviews } from "@/lib/scraper";
import { upsertReview } from "@/lib/db";
import type { Brand } from "@/types";

export const maxDuration = 120; // 2 min timeout for scraping

export async function POST(req: NextRequest) {
  const { brand } = await req.json() as { brand: Brand };

  if (brand !== "green" && brand !== "red") {
    return NextResponse.json({ error: "brand doit être 'green' ou 'red'" }, { status: 400 });
  }

  try {
    const scraped = await scrapeReviews(brand);

    let inserted = 0;
    let skipped = 0;

    for (const item of scraped) {
      if (!item.google_id) continue;
      const result = upsertReview({ brand, ...item, google_id: item.google_id });
      result.inserted ? inserted++ : skipped++;
    }

    return NextResponse.json({
      brand,
      total: scraped.length,
      inserted,
      skipped,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
