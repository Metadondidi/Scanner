import { NextRequest, NextResponse } from "next/server";
import { getReviewById, updateStatus, deleteReview } from "@/lib/db";
import type { ReviewStatus } from "@/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const review = getReviewById(Number(id));
  if (!review) return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
  return NextResponse.json(review);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json() as { status: ReviewStatus };

  const validStatuses: ReviewStatus[] = ["pending", "to_validate", "published", "rejected"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const updated = updateStatus(Number(id), status);
  if (!updated) return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteReview(Number(id));
  return NextResponse.json({ success: true });
}
