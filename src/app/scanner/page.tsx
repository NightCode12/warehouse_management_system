'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Wifi, WifiOff, CheckCircle, AlertTriangle, SwitchCamera, Trash2, Volume2, VolumeX, ChevronUp, ChevronDown, Send, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface ScanEntry {
  id: string;
  barcode: string;
  timestamp: Date;
  sent: boolean;
}

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

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Vibration not supported
  }
}

export default function MobileScannerPage() {
  const [scanMode, setScanMode] = useState<'bluetooth' | 'camera'>('camera');
  const [scanHistory, setScanHistory] = useState<ScanEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastScan, setLastScan] = useState<{ barcode: string; success: boolean } | null>(null);
  const [flashColor, setFlashColor] = useState<'green' | 'red' | null>(null);
  const [error, setError] = useState('');
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [stagedBarcode, setStagedBarcode] = useState<string | null>(null);
  const scannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null);
  const cooldownRef = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const connectedRef = useRef(false);

  // Keep connectedRef in sync
  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  // Try to connect to Supabase Realtime channel (graceful — works offline)
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const connect = () => {
      try {
        channel = supabase.channel('wms-scanner', {
          config: { broadcast: { self: false } },
        });

        channel
          .on('broadcast', { event: 'scanner-ack' }, () => {})
          .subscribe((status) => {
            const isConnected = status === 'SUBSCRIBED';
            setConnected(isConnected);
          });

        channelRef.current = channel;
      } catch {
        // Supabase not available — offline mode
        setConnected(false);
      }
    };

    connect();

    // Reconnect when coming back online
    const handleOnline = () => {
      if (!channelRef.current) connect();
    };
    const handleOffline = () => setConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (channel) {
        try { supabase.removeChannel(channel); } catch { /* ignore */ }
      }
    };
  }, []);

  // Clear staged barcode when switching modes
  useEffect(() => {
    setStagedBarcode(null);
  }, [scanMode]);

  // Clear flash effect
  useEffect(() => {
    if (flashColor) {
      const timer = setTimeout(() => setFlashColor(null), 500);
      return () => clearTimeout(timer);
    }
  }, [flashColor]);

  // Broadcast a single barcode to PC (returns true if sent)
  const broadcastBarcode = useCallback((barcode: string): boolean => {
    const channel = channelRef.current;
    if (channel && connectedRef.current) {
      try {
        channel.send({
          type: 'broadcast',
          event: 'barcode-scanned',
          payload: { barcode, timestamp: new Date().toISOString() },
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  // Add scan to history + send if online
  const logScan = useCallback((barcode: string) => {
    const sent = broadcastBarcode(barcode);

    setScanHistory(prev => [{
      id: crypto.randomUUID(),
      barcode,
      timestamp: new Date(),
      sent,
    }, ...prev].slice(0, 50));

    setLastScan({ barcode, success: true });
    setFlashColor('green');

    if (soundEnabled) playSound('success');
    vibrate(100);
  }, [soundEnabled, broadcastBarcode]);

  // Send all queued (unsent) scans to PC
  const sendQueuedScans = useCallback(() => {
    setScanHistory(prev => prev.map(entry => {
      if (!entry.sent) {
        const sent = broadcastBarcode(entry.barcode);
        return sent ? { ...entry, sent: true } : entry;
      }
      return entry;
    }));
    if (soundEnabled) playSound('success');
    vibrate(100);
  }, [broadcastBarcode, soundEnabled]);

  // Camera scan callback — behavior depends on mode
  const handleCameraScan = useCallback((decodedText: string) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;

    const barcode = decodedText.trim();
    if (!barcode) {
      cooldownRef.current = false;
      return;
    }

    if (scanMode === 'bluetooth') {
      // Scan & Send mode: stage the barcode, user taps "Send to PC"
      setStagedBarcode(barcode);
      if (soundEnabled) playSound('success');
      vibrate(100);
      // Stop camera while barcode is staged
      const scanner = scannerRef.current;
      if (scanner) {
        try {
          const state = scanner.getState();
          if (state === 2 || state === 3) scanner.stop().catch(() => {});
        } catch { /* ignore */ }
      }
      setTimeout(() => { cooldownRef.current = false; }, 500);
    } else {
      // Camera mode: auto-send to PC immediately (or queue if offline)
      logScan(barcode);
      setTimeout(() => { cooldownRef.current = false; }, 1500);
    }
  }, [soundEnabled, scanMode, logScan]);

  // "Send to PC" button handler for Scan & Send mode
  const handleSendToPC = useCallback(() => {
    if (!stagedBarcode) return;
    logScan(stagedBarcode);
    setStagedBarcode(null);

    // Restart camera scanner
    const restartCamera = async () => {
      const scanner = scannerRef.current;
      if (scanner) {
        try {
          const state = scanner.getState();
          if (state !== 2 && state !== 3) {
            const cameraId = cameras[activeCameraIndex]?.id || cameras[0]?.id;
            if (cameraId) {
              await scanner.start(
                cameraId,
                { fps: 10, qrbox: { width: 280, height: 180 } },
                (decodedText) => handleCameraScan(decodedText),
                () => {}
              );
            }
          }
        } catch { /* ignore */ }
      }
    };
    restartCamera();
  }, [stagedBarcode, logScan, cameras, activeCameraIndex, handleCameraScan]);

  // Start camera scanner — both modes use camera
  useEffect(() => {
    const scannerId = 'mobile-scanner-region';
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

        // Prefer back camera on mobile
        let cameraIndex = activeCameraIndex;
        if (activeCameraIndex === 0 && devices.length > 1) {
          const backIdx = devices.findIndex(d =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          if (backIdx >= 0) cameraIndex = backIdx;
        }

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

        const cameraId = devices[cameraIndex]?.id || devices[0].id;

        await scanner.start(
          cameraId,
          { fps: 10, qrbox: { width: 280, height: 180 } },
          (decodedText) => handleCameraScan(decodedText),
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
  }, [scanMode, activeCameraIndex, handleCameraScan]);

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

  const clearHistory = () => {
    setScanHistory([]);
    setLastScan(null);
  };

  const queuedCount = scanHistory.filter(e => !e.sent).length;

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-900 text-white">
      {/* Flash overlay */}
      {flashColor && (
        <div
          className={`absolute inset-0 z-50 pointer-events-none ${
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
      `}</style>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-linear-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center font-black text-xs">
            A
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">Mobile Scanner</h1>
            <p className="text-[10px] text-slate-400">A-Best Swag WMS</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled ? 'text-emerald-400 hover:bg-white/10' : 'text-slate-500 hover:bg-white/10'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            connected
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="px-4 py-2 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
          <button
            onClick={() => setScanMode('bluetooth')}
            className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
              scanMode === 'bluetooth' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Scan &amp; Send
          </button>
          <button
            onClick={() => setScanMode('camera')}
            className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
              scanMode === 'camera' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Auto Send
          </button>
        </div>
      </div>

      {/* Main Area — camera viewfinder for both modes */}
      <div className="flex-1 relative min-h-0">
        {error ? (
          <div className="flex items-center justify-center h-full p-6">
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-300 text-center max-w-sm">
              {error}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div
              id="mobile-scanner-region"
              className="flex-1 overflow-hidden"
              style={{ minHeight: '200px' }}
            />

            {/* Staged barcode overlay — Scan & Send mode */}
            {scanMode === 'bluetooth' && stagedBarcode && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 gap-5 z-10">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Scanned Barcode</p>
                <div className="w-full max-w-sm px-5 py-5 bg-white/10 border-2 border-white/20 rounded-2xl">
                  <p className="font-mono text-2xl font-bold text-white text-center break-all leading-relaxed">{stagedBarcode}</p>
                </div>
                <button
                  onClick={handleSendToPC}
                  className="w-full max-w-sm flex items-center justify-center gap-2.5 px-6 py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-2xl text-base font-bold transition-colors shadow-lg shadow-blue-600/25"
                >
                  <Send className="w-5 h-5" />
                  {connected ? 'Send to PC' : 'Save (Offline)'}
                </button>
                <button
                  onClick={() => {
                    setStagedBarcode(null);
                    // Restart camera
                    const scanner = scannerRef.current;
                    if (scanner) {
                      const cameraId = cameras[activeCameraIndex]?.id || cameras[0]?.id;
                      if (cameraId) {
                        scanner.start(
                          cameraId,
                          { fps: 10, qrbox: { width: 280, height: 180 } },
                          (decodedText) => handleCameraScan(decodedText),
                          () => {}
                        ).catch(() => {});
                      }
                    }
                  }}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Cancel &amp; Scan Again
                </button>
              </div>
            )}

            <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 shrink-0">
              <p className="text-xs text-slate-400">
                {scanMode === 'bluetooth' ? 'Scan barcode, then tap Send' : 'Point at barcode or QR code'}
              </p>
              {cameras.length > 1 && (
                <button
                  onClick={switchCamera}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <SwitchCamera className="w-3.5 h-3.5" />
                  Flip
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Last Scan Banner */}
      {lastScan && (
        <div className={`px-4 py-2.5 flex items-center gap-2 text-sm font-semibold shrink-0 ${
          lastScan.success
            ? 'bg-emerald-500/20 text-emerald-300 border-t border-emerald-500/30'
            : 'bg-red-500/20 text-red-300 border-t border-red-500/30'
        }`}>
          {lastScan.success
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <AlertTriangle className="w-4 h-4 shrink-0" />
          }
          <span className="font-mono text-xs truncate">{lastScan.barcode}</span>
          <span className="ml-auto text-xs opacity-60">
            {connected ? 'Sent to PC' : 'Saved offline'}
          </span>
        </div>
      )}

      {/* Send Queued Banner — shows when online with unsent scans */}
      {connected && queuedCount > 0 && (
        <button
          onClick={sendQueuedScans}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/20 text-amber-300 border-t border-amber-500/30 active:bg-amber-500/30 transition-colors shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span className="text-xs font-bold">Send {queuedCount} queued scan{queuedCount > 1 ? 's' : ''} to PC</span>
        </button>
      )}

      {/* Scan History — collapsible */}
      <div className="shrink-0 border-t border-white/10">
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 active:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            {historyOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Recent Scans
            </span>
            {scanHistory.length > 0 && (
              <span className="px-1.5 py-0.5 bg-white/10 text-[10px] font-bold text-slate-300 rounded-full">
                {scanHistory.length}
              </span>
            )}
            {queuedCount > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-[10px] font-bold text-amber-400 rounded-full">
                {queuedCount} queued
              </span>
            )}
          </div>
          {scanHistory.length > 0 && (
            <span
              onClick={(e) => { e.stopPropagation(); clearHistory(); }}
              className="flex items-center gap-1 text-[10px] text-slate-500 active:text-red-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </span>
          )}
        </button>

        {historyOpen && (
          <div className="max-h-[40vh] overflow-y-auto border-t border-white/5">
            {scanHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                <Camera className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs">No scans yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {scanHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 px-4 py-2">
                    {entry.sent ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className="font-mono text-xs text-white truncate flex-1">{entry.barcode}</span>
                    <span className={`text-[10px] shrink-0 ${entry.sent ? 'text-slate-500' : 'text-amber-500'}`}>
                      {entry.sent ? entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Queued'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
