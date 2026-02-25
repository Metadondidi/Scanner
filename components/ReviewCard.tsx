"use client";

import { useState } from "react";
import { Sparkles, CheckCircle, XCircle, Trash2, Loader2, Copy, Check } from "lucide-react";
import type { Review } from "@/types";
import { STATUS_LABELS, STATUS_COLORS } from "@/types";
import StarRating from "./StarRating";

interface ReviewCardProps {
  review: Review;
  onUpdate: (updated: Review) => void;
  onDelete: (id: number) => void;
}

export default function ReviewCard({ review, onUpdate, onDelete }: ReviewCardProps) {
  const [loading, setLoading] = useState<"generate" | "publish" | "reject" | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function generate() {
    setLoading("generate");
    try {
      const res = await fetch(`/api/generate/${review.id}`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
      onUpdate(await res.json());
    } catch (e) {
      alert("Erreur : " + (e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function setStatus(status: "published" | "rejected") {
    setLoading(status === "published" ? "publish" : "reject");
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      onUpdate(await res.json());
    } finally {
      setLoading(null);
    }
  }

  async function remove() {
    if (!confirm("Supprimer cet avis ?")) return;
    await fetch(`/api/reviews/${review.id}`, { method: "DELETE" });
    onDelete(review.id);
  }

  async function copyResponse() {
    if (!review.response) return;
    await navigator.clipboard.writeText(review.response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isShort = review.content.length <= 160;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{review.author}</p>
          <StarRating rating={review.rating} />
          {review.review_date && (
            <p className="text-xs text-gray-400 mt-0.5">{review.review_date}</p>
          )}
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[review.status]}`}>
          {STATUS_LABELS[review.status]}
        </span>
      </div>

      {/* Review content */}
      <div>
        <p className="text-sm text-gray-700 leading-relaxed">
          {isShort || expanded ? review.content : review.content.slice(0, 160) + "…"}
        </p>
        {!isShort && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-500 hover:underline mt-1"
          >
            {expanded ? "Voir moins" : "Voir plus"}
          </button>
        )}
      </div>

      {/* Generated response */}
      {review.response && (
        <div className="bg-gray-50 rounded-lg p-3 relative">
          <p className="text-xs font-medium text-gray-500 mb-1">Réponse générée</p>
          <p className="text-sm text-gray-700 leading-relaxed">{review.response}</p>
          <button
            onClick={copyResponse}
            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
            title="Copier la réponse"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Generate */}
        {review.status !== "published" && (
          <button
            onClick={generate}
            disabled={loading !== null}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition-colors"
          >
            {loading === "generate" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
            {review.response ? "Regénérer" : "Générer"}
          </button>
        )}

        {/* Validate */}
        {review.status === "to_validate" && (
          <>
            <button
              onClick={() => setStatus("published")}
              disabled={loading !== null}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
            >
              {loading === "publish" ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <CheckCircle size={13} />
              )}
              Valider
            </button>
            <button
              onClick={() => setStatus("rejected")}
              disabled={loading !== null}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              {loading === "reject" ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <XCircle size={13} />
              )}
              Rejeter
            </button>
          </>
        )}

        {/* Delete */}
        <button
          onClick={remove}
          className="ml-auto p-1.5 text-gray-300 hover:text-red-400 rounded transition-colors"
          title="Supprimer"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
