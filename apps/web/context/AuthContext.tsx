'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import api from '@/lib/api';

export interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  unreadAlertCount: number;
  refreshAlertCount: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);

  const refreshAlertCount = useCallback(async () => {
    try {
      const res = await api.get('/api/calendar/alerts', { skipAuthRedirect: true } as any);
      setUnreadAlertCount(res.data.unreadCount || 0);
    } catch {
      setUnreadAlertCount(0);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.get('/auth/me', { skipAuthRedirect: true } as any)
      .then((res) => {
        if (!cancelled) {
          setUser(res.data.user);
          refreshAlertCount();
        }
      })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshAlertCount]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { name, email, password });
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
    setUnreadAlertCount(0);
  }, []);

  const value = useMemo(
    () => ({ user, loading, unreadAlertCount, refreshAlertCount, login, register, logout }),
    [user, loading, unreadAlertCount, refreshAlertCount, login, register, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
