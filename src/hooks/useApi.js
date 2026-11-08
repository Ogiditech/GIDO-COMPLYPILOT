import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

/** Fetches `path` on mount (and when it changes). Pass null to skip. */
export function useApi(path) {
  const [state, setState] = useState({ data: null, loading: !!path, error: null });
  const reqId = useRef(0);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!path) return null;
    const id = ++reqId.current;
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api(path);
      if (id === reqId.current) setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      if (id === reqId.current) setState((s) => ({ ...s, loading: false, error }));
      return null;
    }
  }, [path]);

  useEffect(() => { load(); }, [load]);

  const setData = useCallback((fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })), []);
  return { ...state, reload: load, setData };
}
