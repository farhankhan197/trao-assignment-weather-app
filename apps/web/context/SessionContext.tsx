'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import api, { clearApiCache } from '@/lib/api';

export interface User {
  _id: string;
  name: string;
  email: string;
}

interface SessionContextType {
  user: User | null;
  loading: boolean;
  unreadAlertCount: number;
  refreshAlertCount: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);

  const refreshAlertCount = useCallback(async () => {
    try {
      const res = await api.get('/api/calendar/alerts', {
        skipAuthRedirect: true,
        cacheTTL: 900000,
      } as any);
      setUnreadAlertCount(res.data.unreadCount || 0);
    } catch {
      setUnreadAlertCount(0);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/auth/me', { skipAuthRedirect: true })
      .then((res) => {
        if (!cancelled) setUser(res.data.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    clearApiCache();
    setUser(res.data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { name, email, password });
    clearApiCache();
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    clearApiCache();
    localStorage.removeItem('mausam_local_cache');
    setUser(null);
    setUnreadAlertCount(0);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      unreadAlertCount,
      refreshAlertCount,
      login,
      register,
      logout,
    }),
    [user, loading, unreadAlertCount, refreshAlertCount, login, register, logout]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
};
