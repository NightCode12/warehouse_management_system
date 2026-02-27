'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, SwitchCamera } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

async function stopAndClear(scanner: Html5Qrcode) {
  try {
    const state = scanner.getState();
    // 2 = SCANNING, 3 = PAUSED
    if (state === 2 || state === 3) {
      await scanner.stop();
    }
    scanner.clear();
  } catch {
    // scanner may already be stopped
    try { scanner.clear(); } catch { /* ignore */ }
  }
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState('');
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScanned = useRef(false);
  const stoppingRef = useRef(false);

  const handleScan = useCallback((decodedText: string) => {
    if (hasScanned.current || stoppingRef.current) return;
    hasScanned.current = true;
    stoppingRef.current = true;

    const scanner = scannerRef.current;
    if (scanner) {
      stopAndClear(scanner).finally(() => {
        scannerRef.current = null;
        onScan(decodedText);
      });
    } else {
      onScan(decodedText);
    }
  }, [onScan]);

  useEffect(() => {
    const scannerId = 'barcode-scanner-region';
    let mounted = true;

    const startScanner = async () => {
      try {
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
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.EAN_13,
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
          {
            fps: 10,
            qrbox: { width: 280, height: 160 },
          },
          (decodedText) => {
            handleScan(decodedText);
          },
          () => {
            // ignore scan failures (no QR in frame)
          }
        );
      } catch {
        if (!mounted) return;
        setError(
          'Could not access camera. Please allow camera permissions and try again.'
        );
      }
    };

    startScanner();

    return () => {
      mounted = false;
      const scanner = scannerRef.current;
      if (scanner) {
        stoppingRef.current = true;
        stopAndClear(scanner).finally(() => {
          scannerRef.current = null;
        });
      }
    };
  }, [activeCameraIndex, handleScan]);

  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    const scanner = scannerRef.current;
    if (scanner) {
      await stopAndClear(scanner);
      scannerRef.current = null;
    }
    setActiveCameraIndex((prev) => (prev + 1) % cameras.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-800">Scan Barcode / QR Code</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-5">
          {error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          ) : (
            <div className="relative">
              <div
                id="barcode-scanner-region"
                className="rounded-lg overflow-hidden"
              />
              <p className="text-center text-sm text-slate-500 mt-3">
                Point your camera at a barcode or QR code
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 bg-slate-50">
          {cameras.length > 1 ? (
            <button
              onClick={switchCamera}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <SwitchCamera className="w-4 h-4" />
              Switch Camera
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
