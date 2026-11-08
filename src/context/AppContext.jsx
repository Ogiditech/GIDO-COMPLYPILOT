// UI-only state: theme and toasts. All business data comes from /api.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AppContext = createContext(null);

const safeGet = (k, fallback) => {
  try { return localStorage.getItem(k) ?? fallback; } catch { return fallback; }
};
const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => safeGet('cp-theme', 'dark'));
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    safeSet('cp-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === 'error' ? 6000 : 3800);
  }, []);

  return (
    <AppContext.Provider value={{ theme, toggleTheme, toasts, toast, dismissToast }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
