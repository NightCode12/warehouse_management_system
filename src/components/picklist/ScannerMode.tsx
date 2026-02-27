'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, CheckCircle, MapPin, Camera, Keyboard, AlertTriangle, Volume2, VolumeX, SwitchCamera, SkipForward, ChevronRight, Bluetooth, ScanLine } from 'lucide-react';
import { PickableOrder, OrderItemDisplay } from '@/types';
import ProductImage from '@/components/ui/ProductImage';
import { getAllBarcodeAliases } from '@/lib/supabase/queries';

interface ScannerModeProps {
  order: PickableOrder;
  onClose: () => void;
  onComplete: (orderId: string) => void;
}

interface ScannedItem {
  index: number;
  scannedAt: Date;
}

// Generate beep sounds using Web Audio API
function playSound(type: 'success' | 'error') {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      oscillator.frequency.setValueAtTime(600, ctx.currentTime);
      oscillator.frequency.setValueAtTime(900, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.25);
    } else {
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // Audio not available
  }
}

// Inline camera scanner component — fills its container
function CameraScanner({ onScan }: { onScan: (value: string) => void }) {
  const [error, setError] = useState('');
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);
  const scannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null);
  const cooldownRef = useRef(false);

  useEffect(() => {
    const scannerId = 'pick-scanner-region';
    let mounted = true;

    const startScanner = async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
        const devices = await Html5Qrcode.getCameras();
        if (!mounted) return;

        if (devices.length === 0) {
          setError('No camera found on this device.');
          return;
        }

        setCameras(devices);
        const scanner = new Html5Qrcode(scannerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,  // most warehouse/shipping barcodes
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.EAN_13,    // retail product barcodes
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
          ],
          verbose: false,
        });
        scannerRef.current = scanner;

        const cameraId = devices[activeCameraIndex]?.id || devices[0].id;

        await scanner.start(
          cameraId,
          { fps: 10, qrbox: { width: 280, height: 180 } },
          (decodedText) => {
            if (cooldownRef.current) return;
            cooldownRef.current = true;
            onScan(decodedText);
            setTimeout(() => { cooldownRef.current = false; }, 1500);
          },
          () => {}
        );
      } catch {
        if (!mounted) return;
        setError('Could not access camera. Please allow camera permissions and try again.');
      }
    };

    startScanner();

    return () => {
      mounted = false;
      const scanner = scannerRef.current;
      if (scanner) {
        try {
          const state = scanner.getState();
          if (state === 2 || state === 3) {
            scanner.stop().then(() => scanner.clear()).catch(() => {
              try { scanner.clear(); } catch { /* ignore */ }
            });
          } else {
            scanner.clear();
          }
        } catch {
          try { scanner.clear(); } catch { /* ignore */ }
        }
        scannerRef.current = null;
      }
    };
  }, [activeCameraIndex, onScan]);

  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        const state = scanner.getState();
        if (state === 2 || state === 3) await scanner.stop();
        scanner.clear();
      } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setActiveCameraIndex((prev) => (prev + 1) % cameras.length);
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-300 max-w-sm text-center">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div id="pick-scanner-region" className="w-full max-w-lg rounded-xl overflow-hidden" style={{ minHeight: '300px' }} />
      <div className="flex items-center justify-between mt-3 w-full max-w-lg">
        <p className="text-xs text-slate-400">Point camera at barcode or QR code</p>
        {cameras.length > 1 && (
          <button
            onClick={switchCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:bg-white/10 rounded-lg transition-colors"
          >
            <SwitchCamera className="w-3.5 h-3.5" />
            Switch Camera
          </button>
        )}
      </div>
    </div>
  );
}

// Item checklist sidebar
function ItemChecklist({ items, scannedItems, currentItemIndex }: {
  items: OrderItemDisplay[];
  scannedItems: Map<number, ScannedItem>;
  currentItemIndex: number;
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      {items.map((item, index) => {
        const isScanned = scannedItems.has(index);
        const isCurrent = index === currentItemIndex;
        return (
          <div
            key={item.id}
            className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 transition-colors ${
              isCurrent ? 'bg-blue-500/10 border-l-2 border-l-blue-400' : isScanned ? 'bg-emerald-500/5' : ''
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              isScanned ? 'bg-emerald-500 border-emerald-500' : isCurrent ? 'border-blue-400' : 'border-slate-600'
            }`}>
              {isScanned && <CheckCircle className="w-3 h-3 text-white" />}
              {isCurrent && !isScanned && <ChevronRight className="w-3 h-3 text-blue-400" />}
            </div>

            <div className={`flex-1 min-w-0 ${isScanned ? 'opacity-50' : ''}`}>
              <div className={`font-medium text-sm ${isScanned ? 'line-through text-slate-500' : 'text-white'}`}>
                {item.product_name}
              </div>
              <div className="text-xs text-slate-500">{item.variant || ''}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-slate-500">
                  <MapPin className="w-2.5 h-2.5" />
                  <span className="font-mono">{item.location_code || '—'}</span>
                </div>
                <span className="text-[10px] text-slate-600 font-mono">{item.sku}</span>
              </div>
            </div>

            <div className={`text-lg font-bold shrink-0 ${isScanned ? 'text-emerald-500' : 'text-slate-400'}`}>
              &times;{item.quantity}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ScannerMode({ order, onClose, onComplete }: ScannerModeProps) {
  const [scannedItems, setScannedItems] = useState<Map<number, ScannedItem>>(new Map());
  const [manualInput, setManualInput] = useState('');
  const [inputMode, setInputMode] = useState<'camera' | 'manual' | 'bluetooth'>('bluetooth');
  const [lastScanResult, setLastScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [flashColor, setFlashColor] = useState<'green' | 'red' | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [barcodeAliases, setBarcodeAliases] = useState<Map<string, string>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);
  const scannedItemsRef = useRef(scannedItems);
  scannedItemsRef.current = scannedItems;

  // Load barcode aliases from Supabase on mount
  useEffect(() => {
    getAllBarcodeAliases().then(aliases => {
      const map = new Map<string, string>();
      for (const alias of aliases) {
        map.set(alias.external_barcode, alias.sku);
        map.set(alias.external_barcode.toUpperCase(), alias.sku);
      }
      setBarcodeAliases(map);
    });
  }, []);

  const totalItems = order.items.length;
  const scannedCount = scannedItems.size;
  const allScanned = scannedCount === totalItems;

  // Find the current (next un-scanned) item
  const currentItemIndex = order.items.findIndex((_, idx) => !scannedItems.has(idx));
  const currentItem = currentItemIndex >= 0 ? order.items[currentItemIndex] : null;

  // Keep input focused in manual and bluetooth modes (Bluetooth scanner needs a focused input to type into)
  useEffect(() => {
    if (inputMode !== 'manual' && inputMode !== 'bluetooth') return;
    const interval = setInterval(() => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    }, 500);
    return () => clearInterval(interval);
  }, [inputMode]);

  // Clear flash
  useEffect(() => {
    if (flashColor) {
      const timer = setTimeout(() => setFlashColor(null), 500);
      return () => clearTimeout(timer);
    }
  }, [flashColor]);

  const triggerFeedback = useCallback((success: boolean) => {
    setFlashColor(success ? 'green' : 'red');
    if (soundEnabled) {
      playSound(success ? 'success' : 'error');
    }
  }, [soundEnabled]);

  const findItemByBarcode = useCallback((barcode: string): { item: OrderItemDisplay; index: number } | null => {
    const trimmed = barcode.trim();
    const upper = trimmed.toUpperCase();

    for (let i = 0; i < order.items.length; i++) {
      if (order.items[i].sku.toUpperCase() === upper) {
        return { item: order.items[i], index: i };
      }
    }

    const mappedSku = barcodeAliases.get(trimmed) || barcodeAliases.get(upper);
    if (mappedSku) {
      for (let i = 0; i < order.items.length; i++) {
        if (order.items[i].sku.toUpperCase() === mappedSku.toUpperCase()) {
          return { item: order.items[i], index: i };
        }
      }
    }

    if (upper.length >= 3) {
      for (let i = 0; i < order.items.length; i++) {
        if (order.items[i].sku.toUpperCase().includes(upper) || upper.includes(order.items[i].sku.toUpperCase())) {
          return { item: order.items[i], index: i };
        }
      }
    }

    return null;
  }, [order.items, barcodeAliases]);

  const handleScan = useCallback((barcode: string) => {
    if (!barcode.trim()) return;

    const result = findItemByBarcode(barcode);

    if (!result) {
      setLastScanResult({ success: false, message: `No match for: ${barcode}` });
      triggerFeedback(false);
      setManualInput('');
      return;
    }

    if (scannedItemsRef.current.has(result.index)) {
      setLastScanResult({ success: false, message: `${result.item.product_name} already scanned` });
      triggerFeedback(false);
      setManualInput('');
      return;
    }

    setScannedItems(prev => {
      const next = new Map(prev);
      next.set(result.index, { index: result.index, scannedAt: new Date() });
      return next;
    });
    setLastScanResult({ success: true, message: `${result.item.product_name} — ${result.item.variant || ''}` });
    triggerFeedback(true);
    setManualInput('');
  }, [findItemByBarcode, triggerFeedback]);

  // Manual override: skip current item without scanning
  const handleManualOverride = useCallback(() => {
    if (currentItemIndex < 0) return;
    const item = order.items[currentItemIndex];
    setScannedItems(prev => {
      const next = new Map(prev);
      next.set(currentItemIndex, { index: currentItemIndex, scannedAt: new Date() });
      return next;
    });
    setLastScanResult({ success: true, message: `${item.product_name} — manually overridden` });
    triggerFeedback(true);
  }, [currentItemIndex, order.items, triggerFeedback]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(manualInput);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Flash overlay */}
      {flashColor && (
        <div
          className={`absolute inset-0 z-60 pointer-events-none ${
            flashColor === 'green' ? 'bg-emerald-500/30' : 'bg-red-500/30'
          }`}
          style={{ animation: 'flashFade 0.5s ease-out forwards' }}
        />
      )}

      <style>{`
        @keyframes flashFade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>

      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-6 py-3 border-b border-white/10 shrink-0">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2 flex-wrap">
            SCANNER MODE
            <span className="text-sm font-medium text-slate-400">— {order.order_number}</span>
          </h2>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-sm text-slate-400 truncate max-w-[120px] sm:max-w-none">{order.customer_name}</span>
            <div
              className="px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
              style={{ backgroundColor: order.store_color + '40', color: '#fff' }}
            >
              {order.store_name}
            </div>
            {order.priority !== 'normal' && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                order.priority === 'same-day' ? 'bg-red-500' : 'bg-orange-500'
              }`}>
                {order.priority === 'same-day' ? 'SAME DAY' : 'RUSH'}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled ? 'text-emerald-400 hover:bg-white/10' : 'text-slate-500 hover:bg-white/10'
            }`}
            title={soundEnabled ? 'Sound on' : 'Sound off'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-0.5 sm:gap-1 bg-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setInputMode('bluetooth')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                inputMode === 'bluetooth' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bluetooth</span>
            </button>
            <button
              onClick={() => setInputMode('camera')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                inputMode === 'camera' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Camera</span>
            </button>
            <button
              onClick={() => setInputMode('manual')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                inputMode === 'manual' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Manual</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-2 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-slate-400 font-medium text-xs">
            {scannedCount} of {totalItems} items scanned
            {allScanned && <span className="ml-2 text-emerald-400 font-bold">All done!</span>}
          </span>
          <span className="text-slate-500 text-xs font-mono">
            {totalItems > 0 ? Math.round((scannedCount / totalItems) * 100) : 0}%
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-emerald-500 to-emerald-400 transition-all duration-300 rounded-full"
            style={{ width: `${totalItems > 0 ? (scannedCount / totalItems) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Scan result feedback banner */}
      {lastScanResult && (
        <div className={`px-6 py-2 flex items-center gap-2 text-sm font-semibold shrink-0 ${
          lastScanResult.success
            ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30'
            : 'bg-red-500/20 text-red-300 border-b border-red-500/30'
        }`}>
          {lastScanResult.success
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <AlertTriangle className="w-4 h-4 shrink-0" />
          }
          {lastScanResult.message}
        </div>
      )}

      {/* Main Content — different layout per mode */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

        {inputMode === 'bluetooth' ? (
          <>
            {/* Left: Bluetooth ready panel */}
            <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-white/10 min-h-0">
              {currentItem ? (
                <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start md:justify-center p-3 md:p-6 gap-4 md:gap-6">

                  {/* Ready indicator — row on mobile, column on tablet+ */}
                  <div className="flex flex-row md:flex-col items-center gap-3 md:gap-3 w-full md:w-auto">
                    <div
                      className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center shrink-0"
                      style={{ animation: 'pulse-ring 2s ease-in-out infinite' }}
                    >
                      <ScanLine className="w-6 h-6 md:w-9 md:h-9 text-blue-400" />
                    </div>
                    <div className="text-left md:text-center">
                      <p className="text-blue-300 font-bold text-sm uppercase tracking-widest">Ready to Scan</p>
                      <p className="text-slate-500 text-xs mt-0.5">Point your Bluetooth scanner at the barcode</p>
                    </div>
                  </div>

                  {/* Current item card */}
                  <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/15 border-b border-blue-500/20">
                      <MapPin className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                      <span className="text-xl md:text-2xl font-mono font-black text-blue-300">{currentItem.location_code || '—'}</span>
                    </div>
                    <div className="px-4 py-4 md:px-5 md:py-5">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">
                          <ProductImage sku={currentItem.sku} name={currentItem.product_name} size="lg" editable={false} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base md:text-lg font-bold text-white leading-tight">{currentItem.product_name}</h3>
                          <p className="text-sm text-slate-400 mt-0.5">{currentItem.variant || ''}</p>
                          <p className="text-xs font-mono text-slate-500 mt-1">{currentItem.sku}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-xs text-slate-400 uppercase tracking-wider">Pick</div>
                          <div className="text-4xl md:text-5xl font-black text-emerald-400">{currentItem.quantity}</div>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-white/10 px-4 py-2">
                      <button
                        onClick={handleManualOverride}
                        className="flex items-center gap-2 mx-auto px-4 py-1.5 text-xs text-slate-500 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        Manual Override (skip scan)
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">All Items Scanned</h3>
                    <p className="text-slate-400">Click Complete Pick to finish.</p>
                  </div>
                </div>
              )}

              {/* Input — stays focused so Bluetooth scanner can type into it */}
              <div className="px-4 py-3 border-t border-white/10 shrink-0">
                <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    autoFocus
                    aria-label="Bluetooth scanner input"
                    className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm font-mono text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white/15 transition-all text-center"
                    placeholder="Waiting for scanner input..."
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors shrink-0"
                  >
                    Enter
                  </button>
                </form>
                <p className="text-center text-xs text-slate-500 mt-1.5">
                  Works with Eyoyo, Tera, Inateck, and any Bluetooth HID barcode scanner
                </p>
              </div>
            </div>

            {/* Right: Item checklist */}
            <div className="w-full md:w-72 flex flex-col bg-slate-900/50 max-h-44 md:max-h-none">
              <div className="px-4 py-2.5 border-b border-white/10 shrink-0">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Items to Pick ({scannedCount}/{totalItems})
                </h4>
              </div>
              <ItemChecklist items={order.items} scannedItems={scannedItems} currentItemIndex={currentItemIndex} />
            </div>
          </>
        ) : inputMode === 'camera' ? (
          <>
            {/* Left: Camera feed (large) */}
            <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-white/10">
              <CameraScanner onScan={handleScan} />

              {/* Current item compact info below camera */}
              {currentItem && (
                <div className="px-4 py-3 border-t border-white/10 shrink-0 flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg shrink-0">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="text-lg font-mono font-black text-blue-300">{currentItem.location_code || '—'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate">{currentItem.product_name}</div>
                    <div className="text-xs text-slate-400">{currentItem.variant || ''} &bull; {currentItem.sku}</div>
                  </div>
                  <div className="text-2xl font-black text-emerald-400 shrink-0">&times;{currentItem.quantity}</div>
                  <button
                    onClick={handleManualOverride}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors shrink-0"
                    title="Skip this item"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Item checklist */}
            <div className="w-full md:w-72 flex flex-col bg-slate-900/50 max-h-44 md:max-h-none">
              <div className="px-4 py-2.5 border-b border-white/10 shrink-0">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Items to Pick ({scannedCount}/{totalItems})
                </h4>
              </div>
              <ItemChecklist items={order.items} scannedItems={scannedItems} currentItemIndex={currentItemIndex} />
            </div>
          </>
        ) : (
          <>
            {/* Left: Current item focus + manual input */}
            <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-white/10">
              {currentItem ? (
                <div className="flex-1 flex items-start md:items-center justify-center p-3 md:p-6 overflow-y-auto">
                  <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    {/* Location header */}
                    <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/15 border-b border-blue-500/20">
                      <MapPin className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                      <span className="text-xl md:text-2xl font-mono font-black text-blue-300">{currentItem.location_code || '—'}</span>
                    </div>

                    {/* Product details */}
                    <div className="px-4 py-4 md:px-5 md:py-5">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">
                          <ProductImage sku={currentItem.sku} name={currentItem.product_name} size="lg" editable={false} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base md:text-lg font-bold text-white leading-tight">{currentItem.product_name}</h3>
                          <p className="text-sm text-slate-400 mt-0.5">{currentItem.variant || ''}</p>
                          <p className="text-xs font-mono text-slate-500 mt-1">{currentItem.sku}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-xs text-slate-400 uppercase tracking-wider">Pick</div>
                          <div className="text-4xl md:text-5xl font-black text-emerald-400">{currentItem.quantity}</div>
                        </div>
                      </div>
                    </div>

                    {/* Manual override footer */}
                    <div className="border-t border-white/10 px-4 py-2">
                      <button
                        onClick={handleManualOverride}
                        className="flex items-center gap-2 mx-auto px-4 py-1.5 text-xs text-slate-500 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        Manual Override (skip scan)
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">All Items Scanned</h3>
                    <p className="text-slate-400">Click Complete Pick to finish.</p>
                  </div>
                </div>
              )}

              {/* Manual input at bottom */}
              <div className="px-4 py-3 border-t border-white/10 shrink-0">
                <form onSubmit={handleManualSubmit} className="flex items-center gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Scan barcode or type SKU..."
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    autoFocus
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    Scan
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Item checklist */}
            <div className="w-full md:w-72 flex flex-col bg-slate-900/50 max-h-44 md:max-h-none">
              <div className="px-4 py-2.5 border-b border-white/10 shrink-0">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Items to Pick ({scannedCount}/{totalItems})
                </h4>
              </div>
              <ItemChecklist items={order.items} scannedItems={scannedItems} currentItemIndex={currentItemIndex} />
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between shrink-0">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-slate-500 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onComplete(order.id)}
          disabled={!allScanned}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          style={allScanned ? { animation: 'pulse-ring 2s ease-in-out infinite' } : undefined}
        >
          <CheckCircle className="w-4 h-4" />
          Complete Pick
        </button>
      </div>
    </div>
  );
}
