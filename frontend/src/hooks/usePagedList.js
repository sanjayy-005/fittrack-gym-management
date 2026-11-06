import { useEffect, useState } from "react";
import { useFetch } from "./useFetch";

/**
 * Paginated list helper for DRF list endpoints ({count, next, previous, results}).
 *
 *   const list = usePagedList(membersApi.list, { search, status }, 10);
 *   list.items, list.count, list.page, list.setPage, list.loading, list.error, list.reload
 *
 * The page automatically goes back to 1 when any filter changes.
 */
export function usePagedList(fetchPage, filters, pageSize = 10) {
  const filtersKey = JSON.stringify(filters);
  const [pageState, setPageState] = useState({ key: filtersKey, page: 1 });
  const page = pageState.key === filtersKey ? pageState.page : 1;
  const setPage = (next) => setPageState({ key: filtersKey, page: next });

  const { data, loading, error, errorStatus, reload } = useFetch(
    () => fetchPage({ ...filters, page, page_size: pageSize }),
    [filtersKey, page, pageSize]
  );

  // If the last item of the last page was deleted, the page no longer exists (404): step back.
  useEffect(() => {
    if (errorStatus === 404 && page > 1) setPageState({ key: filtersKey, page: page - 1 });
  }, [errorStatus, page, filtersKey]);

  return {
    items: data?.results ?? [],
    count: data?.count ?? 0,
    page,
    setPage,
    pageSize,
    loading,
    error,
    reload,
  };
}
