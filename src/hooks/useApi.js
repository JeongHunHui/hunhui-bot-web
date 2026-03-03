import { useState, useEffect, useCallback, useRef } from 'react';

export function useApi(fetchFn, deps = [], autoRefreshMs = 0) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const timeoutRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setLoading(prev => prev || !data); // only show loading on first fetch
      const result = await Promise.race([
        fetchFn(),
        new Promise((_, reject) => {
          timeoutRef.current = setTimeout(() => reject(new Error('timeout')), 15000);
        }),
      ]);
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e.message);
      }
    } finally {
      clearTimeout(timeoutRef.current);
      if (mountedRef.current) setLoading(false);
    }
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    load();
    let id;
    if (autoRefreshMs > 0) {
      id = setInterval(load, autoRefreshMs);
    }
    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutRef.current);
      if (id) clearInterval(id);
    };
  }, [load, autoRefreshMs]);

  return { data, loading, error, reload: load };
}
