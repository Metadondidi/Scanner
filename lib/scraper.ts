import { chromium, type Page } from "playwright";
import type { Brand, CreateReviewInput } from "@/types";

const BRAND_URLS: Record<Brand, string> = {
  green: process.env.GREEN_SOCIETY_MAPS_URL ?? "",
  red:   process.env.RED_SOCIETY_MAPS_URL   ?? "",
};

const MAX_REVIEWS = parseInt(process.env.SCRAPE_MAX_REVIEWS ?? "50", 10);

// ── Public entry point ───────────────────────────────────────────────────────

export async function scrapeReviews(brand: Brand): Promise<Omit<CreateReviewInput, "brand">[]> {
  const url = BRAND_URLS[brand];
  if (!url) throw new Error(`URL non configurée pour la marque "${brand}". Vérifiez votre .env.`);

  // CHROMIUM_EXECUTABLE_PATH can be set to force a specific binary (useful in Docker)
  const launchOptions = process.env.CHROMIUM_EXECUTABLE_PATH
    ? { headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
    : { headless: true };
  const browser = await chromium.launch(launchOptions);
  try {
    const context = await browser.newContext({
      locale: "fr-FR",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    await _acceptCookies(page);
    await _navigateToReviews(page);
    const reviews = await _extractReviews(page);
    return reviews;
  } finally {
    await browser.close();
  }
}

// ── Internal helpers ─────────────────────────────────────────────────────────

async function _acceptCookies(page: Page) {
  try {
    const acceptBtn = page.locator('button:has-text("Tout accepter"), button:has-text("Accept all")').first();
    if (await acceptBtn.isVisible({ timeout: 4_000 })) {
      await acceptBtn.click();
      await page.waitForTimeout(1_000);
    }
  } catch {
    // Banner may not appear — continue
  }
}

async function _navigateToReviews(page: Page) {
  // Click the "Avis" tab on the place panel
  const reviewsTab = page
    .locator('[role="tab"]')
    .filter({ hasText: /avis|reviews/i })
    .first();

  await reviewsTab.waitFor({ timeout: 10_000 });
  await reviewsTab.click();
  await page.waitForTimeout(1_500);

  // Sort by "Les plus récents"
  try {
    const sortBtn = page.locator('button[aria-label*="Trier"], button[data-value="sort"]').first();
    if (await sortBtn.isVisible({ timeout: 3_000 })) {
      await sortBtn.click();
      await page.waitForTimeout(500);
      const newestOption = page
        .locator('[role="menuitemradio"], [role="option"]')
        .filter({ hasText: /récent|newest/i })
        .first();
      if (await newestOption.isVisible({ timeout: 2_000 })) {
        await newestOption.click();
        await page.waitForTimeout(1_500);
      }
    }
  } catch {
    // Sort unavailable — use default order
  }
}

async function _extractReviews(page: Page): Promise<Omit<CreateReviewInput, "brand">[]> {
  const results: Omit<CreateReviewInput, "brand">[] = [];
  let previousCount = 0;
  let stallRounds = 0;

  while (results.length < MAX_REVIEWS && stallRounds < 3) {
    // Scroll the review pane to load more
    await page.evaluate(() => {
      const pane = document.querySelector('[role="main"] [tabindex="-1"]') as HTMLElement | null;
      if (pane) pane.scrollBy(0, 3000);
      else window.scrollBy(0, 3000);
    });
    await page.waitForTimeout(1_500);

    // Expand "Plus" / "More" buttons
    const moreButtons = page.locator('button[aria-label*="Voir plus"], button:has-text("Plus"), button:has-text("More")');
    const count = await moreButtons.count();
    for (let i = 0; i < count; i++) {
      try { await moreButtons.nth(i).click({ timeout: 1_000 }); } catch { /* skip */ }
    }

    // Extract current cards
    const cards = await page.$$('[data-review-id], [data-google-review-id], .jftiEf');

    for (const card of cards) {
      if (results.length >= MAX_REVIEWS) break;

      try {
        const googleId =
          (await card.getAttribute("data-review-id")) ??
          (await card.getAttribute("data-google-review-id")) ??
          `review-${Date.now()}-${Math.random()}`;

        // Skip if already captured
        if (results.some((r) => r.google_id === googleId)) continue;

        const author = (await card.$eval(
          '.d4r55, [class*="author"], [class*="reviewer"]',
          (el) => el.textContent?.trim() ?? "Anonyme"
        ).catch(() => "Anonyme"));

        const ratingStr = await card.$eval(
          '[aria-label*="étoile"], [aria-label*="star"]',
          (el) => el.getAttribute("aria-label") ?? ""
        ).catch(() => "");
        const rating = _parseRating(ratingStr);

        const content = (await card.$eval(
          '.wiI7pd, [class*="text"], [data-expandable-section]',
          (el) => el.textContent?.trim() ?? ""
        ).catch(() => ""));

        if (!content || rating === 0) continue;

        const dateText = await card.$eval(
          '.rsqaWe, [class*="date"]',
          (el) => el.textContent?.trim() ?? ""
        ).catch(() => "");

        results.push({
          author,
          rating,
          content,
          review_date: dateText || null,
          google_id: googleId,
        });
      } catch {
        // Malformed card — skip
      }
    }

    if (results.length === previousCount) {
      stallRounds++;
    } else {
      stallRounds = 0;
      previousCount = results.length;
    }
  }

  return results;
}

function _parseRating(ariaLabel: string): number {
  const match = ariaLabel.match(/(\d)[,.]?\d?\s*(étoile|star)/i);
  if (match) return parseInt(match[1], 10);
  const numMatch = ariaLabel.match(/(\d)/);
  return numMatch ? parseInt(numMatch[1], 10) : 0;
}
