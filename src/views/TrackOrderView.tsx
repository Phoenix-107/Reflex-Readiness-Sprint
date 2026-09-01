import React, { useState } from 'react';
import { useTrackOrderPolling } from '../api/ordersClient';
import { StatusBadge } from '../components/StatusBadge';
import { AuditTrailModal } from '../components/AuditTrailModal';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MapPin,
  User,
  ArrowLeft,
  RotateCw,
  AlertTriangle,
  Phone,
  Store,
} from 'lucide-react';

interface TrackOrderViewProps {
  orderId: string;
  token: string;
  onNavigate: (path: string) => void;
}

export const TrackOrderView: React.FC<TrackOrderViewProps> = ({ orderId, token, onNavigate }) => {
  const { order, loading, error, lastSync, refresh } = useTrackOrderPolling(orderId, token, 5000);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'requested':
        return 0;
      case 'assigned':
        return 1;
      case 'picked_up':
        return 2;
      case 'delivered':
        return 3;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const steps = [
    {
      title: 'Order Placed',
      desc: 'Received by retailer & logged to ledger',
      icon: Store,
    },
    {
      title: 'Courier Assigned',
      desc: 'Dispatcher matched order to active rider',
      icon: Package,
    },
    {
      title: 'Collected & In Transit',
      desc: 'Rider picked up package and is en route',
      icon: Truck,
    },
    {
      title: 'Delivered (QR Verified)',
      desc: 'Proof-of-delivery sealed by physical scan',
      icon: CheckCircle2,
    },
  ];

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-stone-300 border-t-amber-600 rounded-full animate-spin mx-auto" />
          <h3 className="text-base font-semibold text-stone-800">Validating Capability Token...</h3>
          <p className="text-xs text-stone-500 font-mono">Order: {orderId}</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 p-6 shadow-lg text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">Tracking Token Error</h3>
            <p className="text-xs text-stone-600 mt-1">
              {error || 'The requested order could not be tracked with the provided access token.'}
            </p>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-left text-xs font-mono text-stone-600 break-all">
            <div><strong className="text-stone-700">Order ID:</strong> {orderId || 'None'}</div>
            <div><strong className="text-stone-700">Token:</strong> {token || 'None'}</div>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => onNavigate('')}
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Return to Public Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-2xs hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </button>

          <div className="flex items-center gap-3 text-xs font-mono text-stone-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live 5s Sync</span>
            </span>
            <button
              onClick={() => refresh()}
              className="p-1.5 hover:bg-stone-200/70 rounded-md transition-colors"
              title="Refresh status now"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Tracking Card */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-md overflow-hidden">
          {/* Header Banner */}
          <div className="px-6 py-5 bg-stone-900 text-stone-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-semibold border border-amber-400/30">
                  Live Capability Tracking
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  {lastSync ? `Updated ${lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ''}
                </span>
              </div>
              <h1 className="text-xl font-bold mt-1 text-white flex items-center gap-2">
                Delivery #{order.id.slice(0, 12)}
              </h1>
            </div>

            <div>
              <StatusBadge status={order.status} size="lg" />
            </div>
          </div>

          {/* Stepper Lifecycle */}
          <div className="p-6 border-b border-stone-200 bg-stone-50/50">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-6 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Delivery Lifecycle Progress
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = currentStep > idx;
                const isCurrent = currentStep === idx;
                const isPending = currentStep < idx;

                return (
                  <div
                    key={step.title}
                    className={`relative p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isCurrent
                        ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30 shadow-xs'
                        : isPassed
                        ? 'bg-emerald-50/60 border-emerald-200 text-stone-800'
                        : 'bg-stone-50 border-stone-200 text-stone-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isCurrent
                            ? 'bg-amber-500 text-stone-950 font-bold'
                            : isPassed
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-stone-200 text-stone-500'
                        }`}
                      >
                        {isPassed ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                        Step {idx + 1}
                      </span>
                    </div>

                    <div>
                      <h4
                        className={`text-xs font-bold ${
                          isCurrent ? 'text-amber-950' : isPassed ? 'text-emerald-950' : 'text-stone-600'
                        }`}
                      >
                        {step.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-1 leading-snug">{step.desc}</p>
                    </div>

                    {isCurrent && (
                      <div className="mt-3 pt-2 border-t border-amber-200/80 flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <span>Active Phase</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Specifics */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Col: Order info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">Order Information</h3>
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3 text-xs">
                <div>
                  <span className="text-stone-500 text-[11px] block">Item Description</span>
                  <span className="font-semibold text-stone-900 text-sm">{order.item_description}</span>
                </div>
                <div className="pt-2 border-t border-stone-200">
                  <span className="text-stone-500 text-[11px] block">Customer Name</span>
                  <div className="flex items-center gap-1.5 font-medium text-stone-800 mt-0.5">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>{order.customer_name}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-stone-200">
                  <span className="text-stone-500 text-[11px] block">Destination</span>
                  <div className="flex items-center gap-1.5 font-medium text-stone-800 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{order.delivery_address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Assigned courier & audit */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">Assigned Logistics</h3>
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3 text-xs">
                <div>
                  <span className="text-stone-500 text-[11px] block">Assigned Courier</span>
                  {order.assigned_rider_id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        {order.assigned_rider_id.includes('alex') ? 'AV' : 'SC'}
                      </div>
                      <div>
                        <span className="font-bold text-stone-900 block">
                          {order.assigned_rider_id.includes('alex') ? 'Alex Vance (Swift-1)' : 'Sam Chen (Apex-2)'}
                        </span>
                        <span className="text-[11px] text-stone-500 font-mono">{order.assigned_rider_id}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-amber-800 bg-amber-50 px-2 py-1 rounded text-xs inline-block mt-1 font-medium border border-amber-200">
                      Pending Dispatcher Assignment
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-stone-200">
                  <span className="text-stone-500 text-[11px] block">Proof of Delivery Security</span>
                  <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-medium mt-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Sealed via QR Token at Destination</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200">
                  <button
                    onClick={() => setShowAuditModal(true)}
                    className="w-full py-2 px-3 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-stone-700" />
                    <span>Inspect Append-Only Audit Trail ({order.status_history?.length || 0})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Notice Footer */}
          <div className="px-6 py-4 bg-amber-50/60 border-t border-amber-200/70 text-xs text-amber-900 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Your courier will scan the retailer's QR code at your doorstep to conclude the delivery.
              </span>
            </div>
            <span className="font-mono text-[11px] text-amber-700 shrink-0">Auto-refresh active</span>
          </div>
        </div>
      </div>

      {/* Audit Trail Modal */}
      {showAuditModal && <AuditTrailModal order={order} onClose={() => setShowAuditModal(false)} />}
    </div>
  );
};
