import { MockStore, MockClient } from '@/types';

export const STORES: MockStore[] = [
  { id: 1, name: 'Federal Donuts', color: '#E63946', domain: 'federaldonuts.com' },
  { id: 2, name: 'Underdog', color: '#457B9D', domain: 'underdogphilly.com' },
  { id: 3, name: 'Zahav', color: '#2A9D8F', domain: 'zahavrestaurant.com' },
  { id: 4, name: 'Laser Wolf', color: '#E9C46A', domain: 'laserwolfphilly.com' },
  { id: 5, name: 'Goldie', color: '#F4A261', domain: 'goldiefalafel.com' },
  { id: 6, name: 'K\'Far', color: '#9B2335', domain: 'kfarcafe.com' },
  { id: 7, name: 'Dizengoff', color: '#264653', domain: 'dizengoffhummus.com' },
];

export const STORAGE_CLIENTS: MockClient[] = [
  { id: 1, name: 'A-Best Swag', color: '#1a1a2e' },
  { id: 2, name: 'Underdog Athletics', color: '#457B9D' },
  { id: 3, name: 'Metro Anesthesiology', color: '#6B7280' },
];

// Manufacturer barcode → SKU mapping (simulates barcode_aliases table)
export const BARCODE_ALIASES: Record<string, string> = {
  '0123456789012': 'FD-TEE-BLK-L',
  '0123456789013': 'FD-TEE-BLK-M',
  '0123456789014': 'FD-HAT-WHT',
  '9876543210001': 'UD-HOOD-GRY-M',
  '9876543210002': 'UD-HOOD-GRY-L',
  '5555555550001': 'MA-SCRUBS-BLU-M',
  '5555555550002': 'MA-SCRUBS-BLU-L',
};

// Product images by SKU prefix — set URL string to use real images, null for placeholder
export const PRODUCT_IMAGES: Record<string, string | null> = {
  'FD-TEE': null,
  'FD-HAT': null,
  'UD-HOOD': null,
  'ZH-APRON': null,
  'LW-TANK': null,
  'GL-BAG': null,
  'KF-MUG': null,
  'DZ-TEE': null,
  'MA-SCRUBS': null,
};

export const WAREHOUSE_LOCATIONS: string[] = [
  'A-01-01', 'A-01-02', 'A-01-03', 'A-01-04', 'A-01-05',
  'A-02-01', 'A-02-02', 'A-02-03', 'A-02-04',
  'A-03-01', 'A-03-02', 'A-03-03', 'A-03-04',
  'B-01-01', 'B-01-02',
  'B-02-01', 'B-02-02',
  'B-04-01', 'B-04-02',
  'C-01-01', 'C-01-02',
  'C-02-01', 'C-02-02', 'C-02-03',
  'D-01-01',
  'E-01-01', 'E-01-02',
];