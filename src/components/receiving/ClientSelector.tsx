'use client';

import { useState, FormEvent } from 'react';
import { Package, Plus, X, Trash2, AlertTriangle } from 'lucide-react';
import { ClientDisplay } from '@/types';
import { createClient, deleteClient } from '@/lib/supabase/queries';

interface ClientSelectorProps {
  clients: ClientDisplay[];
  onSelectClient: (client: ClientDisplay) => void;
  onClientAdded?: (client: ClientDisplay) => void;
  onClientDeleted?: (clientId: string) => void;
  canManageClients?: boolean;
}

const PRESET_COLORS = [
  '#1e293b', '#334155', '#0ea5e9', '#6366f1', '#8b5cf6',
  '#ec4899', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#06b6d4',
];

export default function ClientSelector({ clients, onSelectClient, onClientAdded, onClientDeleted, canManageClients = true }: ClientSelectorProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClientDisplay | null>(null);

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
          <Package className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Start Receiving Session</h3>
        <p className="text-slate-500">Select a client to begin receiving inventory</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {clients.map(client => (
          <div
            key={client.id}
            className="relative bg-white rounded-xl border-2 border-slate-200 hover:shadow-lg p-6 text-left transition-all group"
            style={{ borderLeftColor: client.color || '#999', borderLeftWidth: '4px' }}
          >
            <button
              onClick={() => onSelectClient(client)}
              className="w-full text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: client.color || '#999' }}
                >
                  {client.name.charAt(0)}
                </div>
                <div className="font-semibold text-slate-800 text-lg">{client.name}</div>
              </div>
              <p className="text-sm text-slate-400 group-hover:text-slate-500 transition-colors">
                Click to start receiving
              </p>
            </button>
            {canManageClients && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(client); }}
              className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors lg:opacity-0 lg:group-hover:opacity-100"
              title="Delete client"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            )}
          </div>
        ))}

        {/* Add Client Button */}
        {canManageClients && (
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:shadow-lg p-6 text-left transition-all group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
              <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <div className="font-semibold text-slate-500 group-hover:text-blue-600 text-lg transition-colors">Add Client</div>
          </div>
          <p className="text-sm text-slate-400 group-hover:text-slate-500 transition-colors">
            Create a new client
          </p>
        </button>
        )}
      </div>

      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onCreated={(client) => {
            setShowAddModal(false);
            onClientAdded?.(client);
          }}
        />
      )}

      {deleteTarget && (
        <DeleteClientModal
          client={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(id) => {
            setDeleteTarget(null);
            onClientDeleted?.(id);
          }}
        />
      )}
    </div>
  );
}

function AddClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: (client: ClientDisplay) => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const client = await createClient({
        name,
        color,
        contact_name: contactName || undefined,
        contact_email: contactEmail || undefined,
        notes: notes || undefined,
      });
      onCreated(client);
    } catch (err) {
      setError((err as Error).message || 'Failed to create client');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Add New Client</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Client Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Brand Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? 'border-blue-500 scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this client..."
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteClientModal({ client, onClose, onDeleted }: { client: ClientDisplay; onClose: () => void; onDeleted: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setError('');
    setDeleting(true);
    try {
      await deleteClient(client.id);
      onDeleted(client.id);
    } catch (err) {
      setError((err as Error).message || 'Failed to delete client');
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Delete Client</h3>
          <p className="text-sm text-slate-500 mb-1">
            Are you sure you want to delete
          </p>
          <p className="text-sm font-semibold text-slate-800 mb-4">
            &ldquo;{client.name}&rdquo;?
          </p>
          <p className="text-xs text-slate-400 mb-5">
            This action cannot be undone. All associated data may be affected.
          </p>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              disabled={deleting}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={deleting}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
