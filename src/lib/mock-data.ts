import { MockOrder, MockInventoryItem, OrderStatus, OrderPriority } from '@/types';
import { STORES, STORAGE_CLIENTS } from './constants';

export const generateOrders = (): MockOrder[] => {
  const statuses: OrderStatus[] = ['pending', 'picking', 'packed', 'shipped'];
  const priorities: OrderPriority[] = ['normal', 'normal', 'normal', 'rush', 'same-day'];
  const products = [
    { sku: 'FD-TEE-BLK-L', name: 'Federal Donuts Tee', variant: 'Black / Large', location: 'A-01-03' },
    { sku: 'FD-HAT-WHT', name: 'Federal Donuts Cap', variant: 'White', location: 'A-01-05' },
    { sku: 'UD-HOOD-GRY-M', name: 'Underdog Hoodie', variant: 'Gray / Medium', location: 'B-02-01' },
    { sku: 'ZH-APRON-BLU', name: 'Zahav Chef Apron', variant: 'Blue', location: 'C-01-02' },
    { sku: 'LW-TANK-BLK-S', name: 'Laser Wolf Tank', variant: 'Black / Small', location: 'A-03-04' },
    { sku: 'GL-BAG-TAN', name: 'Goldie Tote Bag', variant: 'Tan', location: 'D-01-01' },
    { sku: 'KF-MUG-WHT', name: 'K\'Far Coffee Mug', variant: 'White', location: 'B-04-02' },
    { sku: 'DZ-TEE-OLV-XL', name: 'Dizengoff Vintage Tee', variant: 'Olive / XL', location: 'C-02-03' },
  ];
  const names = ['Sarah Chen', 'Mike Johnson', 'Emily Davis', 'James Wilson', 'Ana Martinez', 'Chris Lee', 'Jessica Brown', 'David Kim', 'Rachel Green', 'Tom Anderson'];

  return Array.from({ length: 24 }, (_, i) => {
    const store = STORES[Math.floor(Math.random() * STORES.length)];
    const status: OrderStatus = i < 4 ? 'pending' : i < 12 ? 'picking' : i < 18 ? 'packed' : 'shipped';
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const orderProducts = Array.from({ length: itemCount }, () => ({
      ...products[Math.floor(Math.random() * products.length)],
      quantity: Math.floor(Math.random() * 3) + 1,
      picked: status !== 'pending' && status !== 'picking'
    }));

    return {
      id: 1000 + i,
      orderNumber: `#${store.name.substring(0, 2).toUpperCase()}${10000 + Math.floor(Math.random() * 90000)}`,
      store,
      customer: names[Math.floor(Math.random() * names.length)],
      items: orderProducts,
      status,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      createdAt: new Date(Date.now() - Math.random() * 172800000),
      isCarryover: Math.random() > 0.85
    };
  }).sort((a, b) => {
    const priorityOrder: Record<OrderPriority, number> = { 'same-day': 0, 'rush': 1, 'normal': 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

export const generateInventory = (): MockInventoryItem[] => {
  const items = [
    { sku: 'FD-TEE-BLK-L', name: 'Federal Donuts Tee', variant: 'Black / Large', location: 'A-01-03', quantity: 45, threshold: 10 },
    { sku: 'FD-TEE-BLK-M', name: 'Federal Donuts Tee', variant: 'Black / Medium', location: 'A-01-02', quantity: 8, threshold: 10 },
    { sku: 'FD-HAT-WHT', name: 'Federal Donuts Cap', variant: 'White', location: 'A-01-05', quantity: 23, threshold: 15 },
    { sku: 'UD-HOOD-GRY-M', name: 'Underdog Hoodie', variant: 'Gray / Medium', location: 'B-02-01', quantity: 34, threshold: 10 },
    { sku: 'UD-HOOD-GRY-L', name: 'Underdog Hoodie', variant: 'Gray / Large', location: 'B-02-02', quantity: 5, threshold: 10 },
    { sku: 'ZH-APRON-BLU', name: 'Zahav Chef Apron', variant: 'Blue', location: 'C-01-02', quantity: 67, threshold: 20 },
    { sku: 'LW-TANK-BLK-S', name: 'Laser Wolf Tank', variant: 'Black / Small', location: 'A-03-04', quantity: 12, threshold: 10 },
    { sku: 'GL-BAG-TAN', name: 'Goldie Tote Bag', variant: 'Tan', location: 'D-01-01', quantity: 89, threshold: 25 },
    { sku: 'KF-MUG-WHT', name: 'K\'Far Coffee Mug', variant: 'White', location: 'B-04-02', quantity: 156, threshold: 30 },
    { sku: 'DZ-TEE-OLV-XL', name: 'Dizengoff Vintage Tee', variant: 'Olive / XL', location: 'C-02-03', quantity: 3, threshold: 10 },
    { sku: 'MA-SCRUBS-BLU-M', name: 'Metro Anesthesia Scrubs', variant: 'Blue / Medium', location: 'E-01-01', quantity: 200, threshold: 50 },
    { sku: 'MA-SCRUBS-BLU-L', name: 'Metro Anesthesia Scrubs', variant: 'Blue / Large', location: 'E-01-02', quantity: 175, threshold: 50 },
  ];

  return items.map((item, i) => ({
    ...item,
    id: i + 1,
    client: i >= 10 ? STORAGE_CLIENTS[2] : i >= 4 && i < 6 ? STORAGE_CLIENTS[1] : STORAGE_CLIENTS[0],
    lastUpdated: new Date(Date.now() - Math.random() * 86400000 * 7)
  }));
};