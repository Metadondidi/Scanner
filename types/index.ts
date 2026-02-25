export type Brand = "green" | "red";

export type ReviewStatus = "pending" | "to_validate" | "published" | "rejected";

export interface Review {
  id: number;
  brand: Brand;
  author: string;
  rating: number;
  content: string;
  review_date: string | null;
  response: string | null;
  status: ReviewStatus;
  google_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReviewInput {
  brand: Brand;
  author?: string;
  rating: number;
  content: string;
  review_date?: string;
  google_id?: string;
}

export const BRAND_LABELS: Record<Brand, string> = {
  green: "Green Society",
  red: "Red Society",
};

export const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "À traiter",
  to_validate: "À valider",
  published: "Publié",
  rejected: "Rejeté",
};

export const STATUS_COLORS: Record<ReviewStatus, string> = {
  pending: "bg-gray-100 text-gray-700",
  to_validate: "bg-amber-100 text-amber-700",
  published: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};
