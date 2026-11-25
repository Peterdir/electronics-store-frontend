import type { ReviewFilters } from "./types";

export const REVIEW_PAGE_SIZES = [10, 20, 50] as const;
export const REVIEW_RATINGS = [1, 2, 3, 4, 5] as const;

export function parseReviewFilters(search: URLSearchParams): ReviewFilters {
  const rawPage = search.get("page") ?? "1";
  const page = /^[1-9]\d*$/.test(rawPage) ? Number(rawPage) : 1;

  return {
    productName: (search.get("productName") ?? "").trim(),
    rating: REVIEW_RATINGS.find((rating) => String(rating) === search.get("rating")) ?? null,
    page: Number.isSafeInteger(page) && page <= 2_147_483_647 ? page : 1,
    size: REVIEW_PAGE_SIZES.find((size) => String(size) === search.get("size")) ?? 10,
  };
}

export function serializeReviewFilters(filters: ReviewFilters): URLSearchParams {
  const search = new URLSearchParams({
    page: String(filters.page),
    size: String(filters.size),
  });

  if (filters.productName) search.set("productName", filters.productName);
  if (filters.rating !== null) search.set("rating", String(filters.rating));

  return search;
}
