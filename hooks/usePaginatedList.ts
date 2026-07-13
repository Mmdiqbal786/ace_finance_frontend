import { useEffect, useMemo, useState } from "react";

type FilterState = Record<string, string>;

interface UsePaginatedListOptions<T> {
  filterFn: (item: T, search: string, filters: FilterState) => boolean;
  initialFilters?: FilterState;
  defaultPageSize?: number;
}

export function usePaginatedList<T>(
  items: T[],
  { filterFn, initialFilters = {}, defaultPageSize = 10 }: UsePaginatedListOptions<T>
) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const setFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const filtered = useMemo(
    () => items.filter((item) => filterFn(item, search, filters)),
    [items, search, filters, filterFn]
  );

  useEffect(() => {
    setPage(1);
  }, [search, filters, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  return {
    search,
    setSearch,
    filters,
    setFilter,
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    filtered,
    paginated,
    totalPages,
    totalCount: filtered.length,
  };
}
