import { NextRequest, NextResponse } from "next/server";
import { getAllReviews, createReview } from "@/lib/db";
import type { Brand } from "@/types";

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get("brand") as Brand | null;
  const reviews = getAllReviews(brand ?? undefined);
  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { brand, author, rating, content, review_date } = body;

  if (!brand || !rating || !content) {
    return NextResponse.json({ error: "brand, rating et content sont requis" }, { status: 400 });
  }

  const review = createReview({ brand, author, rating, content, review_date });
  return NextResponse.json(review, { status: 201 });
}
