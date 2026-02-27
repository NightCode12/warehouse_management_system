'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Plus, Trash2, Send, Package, CalendarDays, User, AlertTriangle, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getStores, getInventoryProducts, getClients } from '@/lib/supabase/queries';
import { OrderPriority } from '@/types';

interface InventoryProduct {
  sku: string;
  product_name: string;
  variant: string | null;
  client_id: string | null;
}

interface LineItem {
  id: number;
  clientId: string;
  sku: string;
  productName: string;
  variant: string;
  quantity: number;
}

interface ManualEntryFormProps {
  onSubmitted: () => void;
}

let lineCounter = 1;

export default function ManualEntryForm({ onSubmitted }: ManualEntryFormProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [storeId, setStoreId] = useState('');
  const [priority, setPriority] = useState<OrderPriority>('normal');
  const [inHandsDate, setInHandsDate] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });
  const [source, setSource] = useState<'inksoft' | 'manual'>('manual');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: lineCounter++, clientId: '', sku: '', productName: '', variant: '', quantity: 1 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);

  useEffect(() => {
    getStores().then(data => setStores(data.map(s => ({ id: s.id, name: s.name }))));
    getClients().then(data => setClients(data.map(c => ({ id: c.id, name: c.name }))));
    getInventoryProducts().then(setInventoryProducts);
  }, []);

  // Get product names filtered by client
  const getProductNamesForClient = (clientId: string) => {
    const products = inventoryProducts.filter(p => p.client_id === clientId);
    return [...new Set(products.map(p => p.product_name))];
  };

  // Get variants for a given product name within a client
  const getVariantsForProduct = (clientId: string, productName: string) => {
    const variants = inventoryProducts
      .filter(p => p.client_id === clientId && p.product_name === productName && p.variant)
      .map(p => p.variant as string);
    return [...new Set(variants)];
  };

  // Find SKU by client + product name + variant
  const findSku = (clientId: string, productName: string, variant: string) => {
    const match = inventoryProducts.find(
      p => p.client_id === clientId && p.product_name === productName && (p.variant || '') === variant
    );
    return match?.sku || '';
  };

  const addLineItem = useCallback(() => {
    setLineItems(prev => [
      ...prev,
      { id: lineCounter++, clientId: '', sku: '', productName: '', variant: '', quantity: 1 },
    ]);
  }, []);

  const removeLineItem = useCallback((id: number) => {
    setLineItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev);
  }, []);

  const updateLineItem = useCallback((id: number, field: keyof LineItem, value: string | number) => {
    setLineItems(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (lineItems.some(item => !item.productName.trim())) {
      setError('All items must have a product name.');
      return;
    }

    setSubmitting(true);
    try {
      // Generate order number
      const prefix = source === 'inksoft' ? 'INK' : 'MAN';
      const seq = Math.floor(Math.random() * 90000) + 10000;
      const orderNumber = `${prefix}-${seq}`;

      // Derive order-level client_id: use common client if all items share the same client
      const itemClientIds = [...new Set(lineItems.map(i => i.clientId).filter(Boolean))];
      const orderClientId = itemClientIds.length === 1 ? itemClientIds[0] : null;

      // Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          source,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim() || null,
          store_id: storeId || null,
          client_id: orderClientId,
          priority,
          in_hands_date: inHandsDate || null,
          shipping_address: shippingAddress.address.trim()
            ? shippingAddress
            : null,
          status: 'pending',
          is_carryover: false,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const items = lineItems.map(item => ({
        order_id: order.id,
        sku: item.sku.trim() || `MANUAL-${Date.now()}`,
        product_name: item.productName.trim(),
        variant: item.variant.trim() || null,
        quantity: item.quantity,
        picked_quantity: 0,
        is_picked: false,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) throw itemsError;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSubmitted();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Order Created!</h3>
          <p className="text-slate-500">The order has been added to the queue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <p className="text-slate-500 text-sm">
            Add orders from Inksoft or other sources that don&apos;t have API access. Orders will appear in the order queue like any other order.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Source + Priority + Store Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
              <select
                value={source}
                onChange={e => setSource(e.target.value as 'inksoft' | 'manual')}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="inksoft">Inksoft</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as OrderPriority)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="rush">Rush</option>
                <option value="same-day">Same-Day</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Store (optional)</label>
              <select
                value={storeId}
                onChange={e => setStoreId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No store</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
              <User className="w-4 h-4" />
              Customer Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="John Smith"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* In-Hands Date */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
              <CalendarDays className="w-4 h-4" />
              In-Hands Date
            </h3>
            <input
              type="date"
              value={inHandsDate}
              onChange={e => setInHandsDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">When does the customer need this order?</p>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
              <MapPin className="w-4 h-4" />
              Shipping Address (optional)
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Address</label>
                <input
                  type="text"
                  value={shippingAddress.address || ''}
                  onChange={e => setShippingAddress(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St, Suite 100"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">City</label>
                  <input
                    type="text"
                    value={shippingAddress.city || ''}
                    onChange={e => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="New York"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">State</label>
                  <input
                    type="text"
                    value={shippingAddress.state || ''}
                    onChange={e => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="NY"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">ZIP Code</label>
                  <input
                    type="text"
                    value={shippingAddress.zip || ''}
                    onChange={e => setShippingAddress(prev => ({ ...prev, zip: e.target.value }))}
                    placeholder="10001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Country</label>
                <input
                  type="text"
                  value={shippingAddress.country || ''}
                  onChange={e => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="US"
                  className="w-full max-w-50 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Package className="w-4 h-4" />
                Order Items
              </h3>
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, idx) => {
                const hasClient = !!item.clientId;
                const productNames = hasClient ? getProductNamesForClient(item.clientId) : [];
                const variants = hasClient ? getVariantsForProduct(item.clientId, item.productName) : [];

                return (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs font-bold text-slate-400 mt-2.5 w-5 text-center shrink-0">{idx + 1}</span>
                    <div className="flex-1 space-y-2">
                      {/* Row 1: Client + SKU + Qty */}
                      <div className="grid grid-cols-12 gap-2">
                        <select
                          value={item.clientId}
                          onChange={e => {
                            const newClientId = e.target.value;
                            setLineItems(prev =>
                              prev.map(li =>
                                li.id === item.id
                                  ? { ...li, clientId: newClientId, sku: '', productName: '', variant: '' }
                                  : li
                              )
                            );
                          }}
                          className="col-span-5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Choose a client...</option>
                          {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="SKU (auto)"
                          value={item.sku}
                          onChange={e => updateLineItem(item.id, 'sku', e.target.value)}
                          readOnly={hasClient}
                          className={`col-span-4 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasClient ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                        />
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={e => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="col-span-3 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Row 2: Product + Variant */}
                      <div className="grid grid-cols-12 gap-2">
                        {hasClient ? (
                          <select
                            value={item.productName}
                            onChange={e => {
                              const name = e.target.value;
                              updateLineItem(item.id, 'productName', name);
                              const prodVariants = getVariantsForProduct(item.clientId, name);
                              if (prodVariants.length > 0) {
                                updateLineItem(item.id, 'variant', prodVariants[0]);
                                updateLineItem(item.id, 'sku', findSku(item.clientId, name, prodVariants[0]));
                              } else {
                                updateLineItem(item.id, 'variant', '');
                                updateLineItem(item.id, 'sku', findSku(item.clientId, name, ''));
                              }
                            }}
                            className="col-span-7 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select product...</option>
                            {productNames.map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="Product name *"
                            value={item.productName}
                            onChange={e => updateLineItem(item.id, 'productName', e.target.value)}
                            required
                            className="col-span-7 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}

                        {hasClient ? (
                          <select
                            value={item.variant}
                            onChange={e => {
                              const v = e.target.value;
                              updateLineItem(item.id, 'variant', v);
                              updateLineItem(item.id, 'sku', findSku(item.clientId, item.productName, v));
                            }}
                            disabled={!item.productName || variants.length === 0}
                            className={`col-span-5 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${!item.productName || variants.length === 0 ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                          >
                            {variants.length === 0 ? (
                              <option value="">No variants</option>
                            ) : (
                              <>
                                <option value="">Select variant...</option>
                                {variants.map(v => (
                                  <option key={v} value={v}>{v}</option>
                                ))}
                              </>
                            )}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="Variant"
                            value={item.variant}
                            onChange={e => updateLineItem(item.id, 'variant', e.target.value)}
                            className="col-span-5 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors shrink-0 mt-0.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
