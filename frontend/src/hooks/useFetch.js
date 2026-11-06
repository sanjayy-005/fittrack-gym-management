import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../utils/errors";

/**
 * Load data from the API.
 *
 *   const { data, loading, error, reload } = useFetch(() => membersApi.get(id), [id]);
 *
 * The second argument lists the values that should trigger a new request.
 * Old data stays on screen while the new data loads, so tables do not flash.
 */
export function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null, errorStatus: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true; // ignore the response if the component moved on (stale request)
    setState((previous) => ({ ...previous, loading: true, error: null, errorStatus: null }));
    fetcher()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null, errorStatus: null });
      })
      .catch((error) => {
        if (active) {
          setState((previous) => ({
            ...previous,
            loading: false,
            error: getErrorMessage(error),
            errorStatus: error?.response?.status ?? null,
          }));
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((value) => value + 1), []);
  return { ...state, reload };
}
