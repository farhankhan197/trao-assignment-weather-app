'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { UnitSystem } from '@/lib/units';

const STORAGE_KEY = 'mausam_units';

interface UnitContextType {
  units: UnitSystem;
  toggleUnits: () => void;
}

const UnitContext = createContext<UnitContextType | null>(null);

function getInitialUnits(): UnitSystem {
  if (typeof window === 'undefined') return 'metric';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'imperial') return 'imperial';
  return 'metric';
}

export const UnitProvider = ({ children }: { children: ReactNode }) => {
  const [units, setUnits] = useState<UnitSystem>(getInitialUnits);

  const toggleUnits = useCallback(() => {
    setUnits((prev) => {
      const next = prev === 'metric' ? 'imperial' : 'metric';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ units, toggleUnits }), [units, toggleUnits]);

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
};

export const useUnits = () => {
  const ctx = useContext(UnitContext);
  if (!ctx) throw new Error('useUnits must be used inside UnitProvider');
  return ctx;
};
