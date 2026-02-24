'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface ProductImageContextType {
  customImages: Record<string, string>;
  setCustomImage: (skuPrefix: string, dataUrl: string) => void;
}

const ProductImageContext = createContext<ProductImageContextType>({
  customImages: {},
  setCustomImage: () => {},
});

const STORAGE_KEY = 'product-images';

export function ProductImageProvider({ children }: { children: ReactNode }) {
  const [customImages, setCustomImages] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCustomImages(JSON.parse(stored));
      }
    } catch {}
    setLoaded(true);
  }, []);

  const setCustomImage = useCallback((skuPrefix: string, dataUrl: string) => {
    setCustomImages(prev => {
      const updated = { ...prev, [skuPrefix]: dataUrl };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  if (!loaded) return null;

  return (
    <ProductImageContext.Provider value={{ customImages, setCustomImage }}>
      {children}
    </ProductImageContext.Provider>
  );
}

export function useProductImages() {
  return useContext(ProductImageContext);
}
