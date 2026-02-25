"use client";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md";
}

export default function StarRating({ rating, size = "sm" }: StarRatingProps) {
  const sz = size === "sm" ? "text-sm" : "text-base";
  return (
    <span className={sz} aria-label={`${rating} étoile(s) sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "text-amber-400" : "text-gray-200"}>
          ★
        </span>
      ))}
    </span>
  );
}
