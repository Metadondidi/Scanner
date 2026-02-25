import { NextRequest, NextResponse } from "next/server";
import { getReviewById, getTrainingResponses, updateResponse } from "@/lib/db";
import { generateResponse } from "@/lib/claude";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const review = getReviewById(Number(id));

  if (!review) return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
  if (review.status === "published") {
    return NextResponse.json({ error: "Cet avis est déjà publié" }, { status: 400 });
  }

  const samples = getTrainingResponses(40);

  try {
    const response = await generateResponse(review.content, review.rating, samples);
    const updated = updateResponse(Number(id), response);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur Claude";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
