/**
 * scripts/lib/paginate-all.mjs — paginated whole-table reads.
 *
 * PostgREST caps unbounded selects at ~1000 rows. This helper walks .range()
 * pages until a short page signals the end or the ceiling is exceeded.
 *
 * IMPORTANT: the caller's fetchPage must apply a TOTAL ordering (a unique
 * tie-breaker column like a primary key). A non-total ordering means rows
 * sharing the page-boundary key can reorder between page requests — the
 * range then silently skips or duplicates records, and no post-hoc sort of
 * the assembled result can recover them.
 */

/**
 * @param {(from: number, to: number) => Promise<unknown[]>} fetchPage
 *   Returns one page of rows (inclusive range, applied after the caller's
 *   deterministic ordering).
 * @param {{pageSize?: number, ceiling?: number}} [opts]
 * @returns {Promise<unknown[]>} all rows, in fetch order.
 * @throws {Error} with code 'PAGINATION_CEILING' when the ceiling is hit.
 */
export async function paginateAll(
  fetchPage,
  { pageSize = 1000, ceiling = 50_000 } = {},
) {
  const all = [];
  for (let from = 0; from < ceiling; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    if (!Array.isArray(page)) {
      throw new TypeError("paginateAll: fetchPage must resolve to an array");
    }
    all.push(...page);
    if (page.length < pageSize) return all; // short page = last page
  }
  const err = new Error(`paginated read exceeded ${ceiling} rows`);
  err.code = "PAGINATION_CEILING";
  throw err;
}
