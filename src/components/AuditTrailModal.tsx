import React from 'react';
import { Order } from '../types';
import { StatusBadge } from './StatusBadge';
import { X, ShieldCheck, Clock, User, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AuditTrailModalProps {
  order: Order | null;
  onClose: () => void;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-stone-900">Immutable Audit Trail</h3>
                <span className="text-xs font-mono bg-stone-200 text-stone-700 px-2 py-0.5 rounded">
                  status_history
                </span>
              </div>
              <p className="text-xs text-stone-500 font-mono mt-0.5">Order ID: {order.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Order Snapshot */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-sm grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-stone-500 font-medium block">Customer</span>
              <span className="font-semibold text-stone-900">{order.customer_name}</span>
            </div>
            <div>
              <span className="text-xs text-stone-500 font-medium block">Current State</span>
              <div className="mt-1">
                <StatusBadge status={order.status} size="sm" />
              </div>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-stone-500 font-medium block">Package Items</span>
              <span className="text-stone-700 text-xs">{order.item_description}</span>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-stone-500 font-medium block">QR Capability Token</span>
              <span className="font-mono text-xs text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200 block break-all mt-0.5">
                {order.qr_token}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Append-Only State Transitions ({order.status_history?.length || 0})
            </h4>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
              {order.status_history?.map((entry, idx) => {
                const isLatest = idx === (order.status_history.length - 1);
                const isScanVerified = entry.changed_by.includes('QR Scan Verified');

                return (
                  <div key={entry.id || idx} className="relative group">
                    {/* Dot */}
                    <div
                      className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isScanVerified
                          ? 'bg-emerald-500 border-emerald-200 text-white'
                          : isLatest
                          ? 'bg-stone-900 border-stone-300 text-white'
                          : 'bg-white border-stone-300 text-stone-400'
                      }`}
                    >
                      {isScanVerified ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      )}
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs hover:border-stone-300 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <StatusBadge status={entry.status} size="sm" />
                        <span className="text-xs font-mono text-stone-400">
                          {new Date(entry.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-start gap-1.5 text-xs text-stone-600 mt-2">
                        <User className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                        <span className="font-mono bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded text-[11px]">
                          {entry.changed_by}
                        </span>
                      </div>

                      {isScanVerified && (
                        <div className="mt-2.5 pt-2 border-t border-emerald-100 bg-emerald-50/70 -mx-3.5 -mb-3.5 p-2.5 rounded-b-xl flex items-center gap-1.5 text-[11px] font-medium text-emerald-800">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Cryptographic proof-of-delivery validated against HMAC token.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span>Non-repudiable audit ledger</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-medium transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
