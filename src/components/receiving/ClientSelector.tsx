'use client';

import { Package } from 'lucide-react';
import { ClientDisplay } from '@/types';

interface ClientSelectorProps {
  clients: ClientDisplay[];
  onSelectClient: (client: ClientDisplay) => void;
}

export default function ClientSelector({ clients, onSelectClient }: ClientSelectorProps) {
  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
          <Package className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Start Receiving Session</h3>
        <p className="text-slate-500">Select a client to begin receiving inventory</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {clients.map(client => (
          <button
            key={client.id}
            onClick={() => onSelectClient(client)}
            className="bg-white rounded-xl border-2 border-slate-200 hover:shadow-lg p-6 text-left transition-all group"
            style={{ borderLeftColor: client.color || '#999', borderLeftWidth: '4px' }}
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
        ))}
      </div>
    </div>
  );
}
