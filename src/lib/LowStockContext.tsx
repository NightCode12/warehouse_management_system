'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { getLowStockCount } from '@/lib/supabase/queries';

interface LowStockContextType {
  lowStockCount: number;
  refreshLowStock: () => void;
}

const LowStockContext = createContext<LowStockContextType>({
  lowStockCount: 0,
  refreshLowStock: () => {},
});

export function LowStockProvider({ children }: { children: ReactNode }) {
  const [lowStockCount, setLowStockCount] = useState(0);

  const refreshLowStock = useCallback(async () => {
    const count = await getLowStockCount();
    setLowStockCount(count);
  }, []);

  useEffect(() => {
    refreshLowStock();
  }, [refreshLowStock]);

  return (
    <LowStockContext.Provider value={{ lowStockCount, refreshLowStock }}>
      {children}
    </LowStockContext.Provider>
  );
}

export function useLowStock() {
  return useContext(LowStockContext);
}
