'use client';

import { useState, useRef, useCallback } from 'react';
import { ScanLine, Plus, MapPin, AlertCircle, CheckCircle, Camera } from 'lucide-react';
import { MockInventoryItem, ReceivingItem, MockClient } from '@/types';
import { BARCODE_ALIASES } from '@/lib/constants';
import BarcodeScanner from './BarcodeScanner';

interface ItemEntryFormProps {
  inventory: MockInventoryItem[];
  client: MockClient;
  onAddItem: (item: Omit<ReceivingItem, 'id' | 'receivedAt'>) => void;
}

interface ResolvedItem {
  sku: string;
  name: string;
  variant: string;
}

const LOCATION_REGEX = /^[A-Z]-\d{2}-\d{2}$/;

export default function ItemEntryForm({ inventory, client, onAddItem }: ItemEntryFormProps) {
  const [barcode, setBarcode] = useState('');
  const [resolvedItem, setResolvedItem] = useState<ResolvedItem | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualVariant, setManualVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState('');
  const [locationError, setLocationError] = useState('');
  const [barcodeSearched, setBarcodeSearched] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const barcodeRef = useRef<HTMLInputElement>(null);

  const resolveBarcode = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setResolvedItem(null);
      setIsNewItem(false);
      setBarcodeSearched(false);
      return;
    }

    const upper = trimmed.toUpperCase();
    setBarcodeSearched(true);

    // Direct SKU match in inventory
    const directMatch = inventory.find(i => i.sku.toUpperCase() === upper);
    if (directMatch) {
      setResolvedItem({ sku: directMatch.sku, name: directMatch.name, variant: directMatch.variant });
      setIsNewItem(false);
      return;
    }

    // Check barcode aliases
    const aliasedSku = BARCODE_ALIASES[trimmed] || BARCODE_ALIASES[upper];
    if (aliasedSku) {
      const aliasMatch = inventory.find(i => i.sku === aliasedSku);
      if (aliasMatch) {
        setResolvedItem({ sku: aliasMatch.sku, name: aliasMatch.name, variant: aliasMatch.variant });
        setIsNewItem(false);
        return;
      }
    }

    // Not found — new item
    setResolvedItem(null);
    setIsNewItem(true);
  }, [inventory]);

  const validateLocation = (value: string) => {
    const upper = value.toUpperCase();
    if (upper && !LOCATION_REGEX.test(upper)) {
      setLocationError('Format: A-01-03');
    } else {
      setLocationError('');
    }
  };

  const canAdd = () => {
    const hasBarcode = barcode.trim() !== '';
    const hasItem = resolvedItem !== null || (isNewItem && manualName.trim() !== '');
    const hasLocation = location.trim() !== '' && !locationError;
    return hasBarcode && hasItem && hasLocation && quantity >= 1;
  };

  const handleAdd = () => {
    if (!canAdd()) return;

    const item: Omit<ReceivingItem, 'id' | 'receivedAt'> = {
      sku: resolvedItem?.sku || barcode.trim().toUpperCase(),
      name: resolvedItem?.name || manualName.trim(),
      variant: resolvedItem?.variant || manualVariant.trim(),
      quantity,
      location: location.trim().toUpperCase(),
      scannedBarcode: barcode.trim(),
    };

    onAddItem(item);

    // Reset all fields for next scan
    setBarcode('');
    setResolvedItem(null);
    setIsNewItem(false);
    setManualName('');
    setManualVariant('');
    setQuantity(1);
    setLocation('');
    setLocationError('');
    setBarcodeSearched(false);

    // Auto-focus barcode field for rapid scanning
    setTimeout(() => barcodeRef.current?.focus(), 50);
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      resolveBarcode(barcode);
    }
  };

  const handleCameraScan = useCallback((value: string) => {
    setScannerOpen(false);

    // Parse SKU|LOCATION format from QR codes
    let sku = value;
    if (value.includes('|')) {
      const [skuPart, locationPart] = value.split('|');
      sku = skuPart;
      if (locationPart && LOCATION_REGEX.test(locationPart.toUpperCase())) {
        setLocation(locationPart.toUpperCase());
        setLocationError('');
      }
    }

    setBarcode(sku);
    resolveBarcode(sku);
  }, [resolveBarcode]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: client.color }}
        />
        <span className="font-semibold text-slate-800 text-sm">{client.name}</span>
      </div>

      {/* Barcode / SKU Input */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
          Scan / Enter Barcode or SKU
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={barcodeRef}
              type="text"
              value={barcode}
              onChange={e => {
                setBarcode(e.target.value);
                setBarcodeSearched(false);
                setResolvedItem(null);
                setIsNewItem(false);
              }}
              onBlur={() => resolveBarcode(barcode)}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="Scan barcode or type SKU..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              autoFocus
            />
          </div>
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="flex items-center justify-center w-11 h-11 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shrink-0"
            title="Scan with camera"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {scannerOpen && (
          <BarcodeScanner
            onScan={handleCameraScan}
            onClose={() => setScannerOpen(false)}
          />
        )}

        {/* Resolution feedback */}
        {barcodeSearched && resolvedItem && (
          <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">Item found</span>
            </div>
            <div className="text-sm font-semibold text-slate-800">{resolvedItem.name}</div>
            <div className="text-xs text-slate-500">{resolvedItem.variant} &bull; {resolvedItem.sku}</div>
          </div>
        )}

        {barcodeSearched && isNewItem && (
          <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">New item — enter details</span>
            </div>
            <input
              type="text"
              value={manualName}
              onChange={e => setManualName(e.target.value)}
              placeholder="Item name"
              className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded text-sm text-slate-800 placeholder:text-slate-400 mb-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <input
              type="text"
              value={manualVariant}
              onChange={e => setManualVariant(e.target.value)}
              placeholder="Variant (e.g. Black / Large)"
              className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        )}
      </div>

      {/* Quantity & Location */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
            Quantity
          </label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={location}
              onChange={e => {
                setLocation(e.target.value);
                validateLocation(e.target.value);
              }}
              placeholder="A-01-03"
              className={`w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:bg-white ${
                locationError ? 'border-red-300 focus:ring-red-400' : 'border-slate-200 focus:ring-emerald-500'
              }`}
            />
          </div>
          {locationError && (
            <p className="text-xs text-red-500 mt-1">{locationError}</p>
          )}
        </div>
      </div>

      {/* Add Item Button */}
      <button
        onClick={handleAdd}
        disabled={!canAdd()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" />
        Add Item
      </button>
    </div>
  );
}
