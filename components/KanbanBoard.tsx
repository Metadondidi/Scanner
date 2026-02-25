"use client";

import type { Review, ReviewStatus } from "@/types";
import { STATUS_LABELS } from "@/types";
import ReviewCard from "./ReviewCard";

const COLUMNS: { status: ReviewStatus; color: string; dot: string }[] = [
  { status: "pending",     color: "bg-gray-50 border-gray-200",   dot: "bg-gray-400"   },
  { status: "to_validate", color: "bg-amber-50 border-amber-200", dot: "bg-amber-400"  },
  { status: "published",   color: "bg-green-50 border-green-200", dot: "bg-green-500"  },
  { status: "rejected",    color: "bg-red-50 border-red-200",     dot: "bg-red-400"    },
];

interface KanbanBoardProps {
  reviews: Review[];
  onUpdate: (updated: Review) => void;
  onDelete: (id: number) => void;
}

export default function KanbanBoard({ reviews, onUpdate, onDelete }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map(({ status, color, dot }) => {
        const col = reviews.filter((r) => r.status === status);
        return (
          <div key={status} className={`rounded-xl border p-3 flex flex-col gap-3 ${color}`}>
            {/* Column header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-sm font-semibold text-gray-700">
                  {STATUS_LABELS[status]}
                </span>
              </div>
              <span className="text-xs font-medium bg-white text-gray-500 px-2 py-0.5 rounded-full border">
                {col.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-3 min-h-[120px] max-h-[calc(100vh-260px)] overflow-y-auto scrollbar-thin pr-0.5">
              {col.length === 0 ? (
                <p className="text-xs text-gray-400 text-center mt-8">Aucun avis</p>
              ) : (
                col.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
