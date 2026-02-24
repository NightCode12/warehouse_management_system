'use client';

import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';
import { generateOrders } from '@/lib/mock-data';

interface PickCountContextType {
  pendingPickCount: number;
  markPicked: (orderId: number) => void;
}

const PickCountContext = createContext<PickCountContextType>({
  pendingPickCount: 0,
  markPicked: () => {},
});

export function PickCountProvider({ children }: { children: ReactNode }) {
  const totalPickable = useMemo(() => {
    const orders = generateOrders();
    return orders.filter(o => o.status === 'pending' || o.status === 'picking').length;
  }, []);

  const [pickedCount, setPickedCount] = useState(0);

  const markPicked = useCallback((orderId: number) => {
    setPickedCount(prev => prev + 1);
  }, []);

  const pendingPickCount = totalPickable - pickedCount;

  return (
    <PickCountContext.Provider value={{ pendingPickCount, markPicked }}>
      {children}
    </PickCountContext.Provider>
  );
}

export function usePickCount() {
  return useContext(PickCountContext);
}
