'use client';

import { QRCodeSVG } from 'qrcode.react';
import { BARCODE_ALIASES } from '@/lib/constants';

const TEST_CODES = [
  // Existing inventory SKUs with location (format: SKU|LOCATION)
  { label: 'Federal Donuts Tee (Black / Large)', value: 'FD-TEE-BLK-L|A-01-03', type: 'SKU + Location' },
  { label: 'Federal Donuts Tee (Black / Medium)', value: 'FD-TEE-BLK-M|A-01-02', type: 'SKU + Location' },
  { label: 'Federal Donuts Cap (White)', value: 'FD-HAT-WHT|A-01-05', type: 'SKU + Location' },
  { label: 'Underdog Hoodie (Gray / Medium)', value: 'UD-HOOD-GRY-M|B-02-01', type: 'SKU + Location' },
  { label: 'Underdog Hoodie (Gray / Large)', value: 'UD-HOOD-GRY-L|B-02-02', type: 'SKU + Location' },
  { label: 'Zahav Chef Apron (Blue)', value: 'ZH-APRON-BLU|C-01-02', type: 'SKU + Location' },
  { label: 'Laser Wolf Tank (Black / Small)', value: 'LW-TANK-BLK-S|A-03-04', type: 'SKU + Location' },
  { label: 'Goldie Tote Bag (Tan)', value: 'GL-BAG-TAN|D-01-01', type: 'SKU + Location' },
  { label: 'K\'Far Coffee Mug (White)', value: 'KF-MUG-WHT|B-04-02', type: 'SKU + Location' },
  { label: 'Dizengoff Vintage Tee (Olive / XL)', value: 'DZ-TEE-OLV-XL|C-02-03', type: 'SKU + Location' },
  { label: 'Metro Scrubs (Blue / Medium)', value: 'MA-SCRUBS-BLU-M|E-01-01', type: 'SKU + Location' },
  { label: 'Metro Scrubs (Blue / Large)', value: 'MA-SCRUBS-BLU-L|E-01-02', type: 'SKU + Location' },
  // Same SKUs with alternate locations (overflow / restocking bins)
  { label: 'FD Tee Overflow (Black / Large)', value: 'FD-TEE-BLK-L|A-02-01', type: 'SKU + Location' },
  { label: 'FD Cap Overflow (White)', value: 'FD-HAT-WHT|A-02-02', type: 'SKU + Location' },
  { label: 'Underdog Hoodie Overflow (Gray / M)', value: 'UD-HOOD-GRY-M|B-01-01', type: 'SKU + Location' },
  { label: 'Zahav Apron Overflow (Blue)', value: 'ZH-APRON-BLU|C-01-01', type: 'SKU + Location' },
  { label: 'Goldie Tote Overflow (Tan)', value: 'GL-BAG-TAN|A-03-01', type: 'SKU + Location' },
  { label: 'K\'Far Mug Overflow (White)', value: 'KF-MUG-WHT|B-04-01', type: 'SKU + Location' },
  { label: 'Metro Scrubs Overflow (Blue / M)', value: 'MA-SCRUBS-BLU-M|A-01-01', type: 'SKU + Location' },
  { label: 'Dizengoff Tee Overflow (Olive / XL)', value: 'DZ-TEE-OLV-XL|C-02-01', type: 'SKU + Location' },
  // Barcode aliases (manufacturer barcodes — no location embedded)
  ...Object.entries(BARCODE_ALIASES).map(([barcode, sku]) => ({
    label: `Barcode alias for ${sku}`,
    value: barcode,
    type: 'Barcode',
  })),
];

export default function TestQRCodesPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 mb-2">Test QR Codes</h1>
          <p className="text-slate-500">
            Print this page or scan these codes from your screen to test the Receiving Module scanner.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {TEST_CODES.map((code) => (
            <div
              key={code.value}
              className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center"
            >
              <QRCodeSVG
                value={code.value}
                size={150}
                level="M"
                includeMargin
              />
              <div className="mt-3 text-center">
                <div className="font-mono text-sm font-bold text-slate-800">
                  {code.value.split('|')[0]}
                </div>
                {code.value.includes('|') && (
                  <div className="font-mono text-xs text-emerald-600 font-semibold mt-0.5">
                    {code.value.split('|')[1]}
                  </div>
                )}
                <div className="text-xs text-slate-500 mt-1">{code.label}</div>
                <span
                  className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                    code.type === 'SKU + Location'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {code.type}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <strong>How to test:</strong> Go to <strong>Receiving</strong> &rarr; select a client &rarr; click the
          camera icon next to the barcode field &rarr; point your camera at one of these QR codes.
          The scanned value will auto-populate the barcode field, resolve the item, and fill in the location.
        </div>
      </div>
    </div>
  );
}
