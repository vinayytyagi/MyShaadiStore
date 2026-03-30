/**
 * Shared server-side list helpers for admin APIs (search, sort, pagination).
 */

export function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parsePagination(searchParams, { defaultLimit = 20, maxLimit = 200 } = {}) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  let limit = Number(searchParams.get("limit"));
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  return { page, limit, skip: (page - 1) * limit };
}

/**
 * @param {URLSearchParams} searchParams
 * @param {string[]} allowedFieldNames
 * @param {string} defaultField
 * @param {"asc"|"desc"} defaultDir
 */
export function parseSort(searchParams, allowedFieldNames, defaultField, defaultDir = "desc") {
  const allowed = new Set(allowedFieldNames);
  const raw = (searchParams.get("sort") || searchParams.get("sortBy") || "").trim();
  const dirParam = (searchParams.get("dir") || searchParams.get("sortDir") || defaultDir).toLowerCase();
  const dir = dirParam === "asc" ? 1 : -1;
  const field = allowed.has(raw) ? raw : defaultField;
  return { sort: { [field]: dir }, field, dir: dir === 1 ? "asc" : "desc" };
}
