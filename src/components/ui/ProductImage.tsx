'use client';

import { useRef } from 'react';
import { Shirt, ShoppingBag, Coffee, Scissors, Crown, Camera } from 'lucide-react';
import { PRODUCT_IMAGES } from '@/lib/constants';
import { useProductImages } from '@/lib/ProductImageContext';
import type { LucideIcon } from 'lucide-react';

interface ProductImageProps {
  sku: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  TEE: Shirt,
  TANK: Shirt,
  HOOD: Shirt,
  SCRUBS: Shirt,
  HAT: Crown,
  CAP: Crown,
  BAG: ShoppingBag,
  MUG: Coffee,
  APRON: Scissors,
};

const CATEGORY_COLORS: Record<string, string> = {
  TEE: 'bg-blue-100 text-blue-600',
  TANK: 'bg-indigo-100 text-indigo-600',
  HOOD: 'bg-violet-100 text-violet-600',
  SCRUBS: 'bg-cyan-100 text-cyan-600',
  HAT: 'bg-amber-100 text-amber-600',
  CAP: 'bg-amber-100 text-amber-600',
  BAG: 'bg-orange-100 text-orange-600',
  MUG: 'bg-rose-100 text-rose-600',
  APRON: 'bg-emerald-100 text-emerald-600',
};

function getSkuPrefix(sku: string): string {
  const parts = sku.split('-');
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : sku;
}

function getCategory(sku: string): string {
  const parts = sku.split('-');
  return parts.length >= 2 ? parts[1] : 'TEE';
}

export default function ProductImage({ sku, name, size = 'sm', editable = true }: ProductImageProps) {
  const prefix = getSkuPrefix(sku);
  const { customImages, setCustomImage } = useProductImages();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageUrl = customImages[prefix] || PRODUCT_IMAGES[prefix] || null;
  const category = getCategory(sku);
  const Icon = CATEGORY_ICONS[category] || Shirt;
  const colorClass = CATEGORY_COLORS[category] || 'bg-slate-100 text-slate-500';

  const sizeClass = size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-14 h-14' : 'w-10 h-10';
  const iconSize = size === 'lg' ? 'w-8 h-8' : size === 'md' ? 'w-6 h-6' : 'w-5 h-5';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomImage(prefix, reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!editable) return;
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const content = imageUrl ? (
    <img
      src={imageUrl}
      alt={name}
      className={`${sizeClass} rounded-lg object-cover`}
    />
  ) : (
    <div className={`${sizeClass} ${colorClass} rounded-lg flex items-center justify-center`}>
      <Icon className={iconSize} />
    </div>
  );

  if (!editable) {
    return <div className="shrink-0">{content}</div>;
  }

  return (
    <div className="relative shrink-0 group" onClick={handleClick}>
      {content}
      <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
        <Camera className="w-4 h-4 text-white" />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
