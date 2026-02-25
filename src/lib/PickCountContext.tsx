'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { getPendingPickCount } from '@/lib/supabase/queries';

interface PickCountContextType {
  pendingPickCount: number;
  markPicked: (orderId: string) => void;
  refreshCount: () => void;
}

const PickCountContext = createContext<PickCountContextType>({
  pendingPickCount: 0,
  markPicked: () => {},
  refreshCount: () => {},
});

export function PickCountProvider({ children }: { children: ReactNode }) {
  const [pendingPickCount, setPendingPickCount] = useState(0);

  const refreshCount = useCallback(async () => {
    const count = await getPendingPickCount();
    setPendingPickCount(count);
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  const markPicked = useCallback((_orderId: string) => {
    setPendingPickCount(prev => Math.max(0, prev - 1));
  }, []);

  return (
    <PickCountContext.Provider value={{ pendingPickCount, markPicked, refreshCount }}>
      {children}
    </PickCountContext.Provider>
  );
}

export function usePickCount() {
  return useContext(PickCountContext);
}
