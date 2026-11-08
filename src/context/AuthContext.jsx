import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const { user: u } = await api('/auth/me');
      setUser(u);
      setError(null);
      return u;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('cp:unauthorized', onUnauthorized);
    return () => window.removeEventListener('cp:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: u } = await api('/auth/login', { method: 'POST', body: { email, password } });
    setUser(u); setError(null);
    return u;
  }, []);

  const signup = useCallback(async (payload) => {
    const { user: u } = await api('/auth/signup', { method: 'POST', body: payload });
    setUser(u); setError(null);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST' }); } finally { setUser(null); }
  }, []);

  const value = useMemo(() => ({ user, loading, error, login, signup, logout, refresh, setUser }), [user, loading, error, login, signup, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
