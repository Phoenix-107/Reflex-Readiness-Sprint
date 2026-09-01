import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Html5Qrcode } from 'html5-qrcode';
import { useOrdersPolling, updateOrderStatus, confirmScan } from '../api/ordersClient';
import { Order, SEEDED_RIDERS, RiderProfile } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AuditTrailModal } from '../components/AuditTrailModal';
import {
  Bike,
  QrCode,
  CheckCircle2,
  Package,
  Truck,
  RotateCw,
  Camera,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  X,
  Radio,
} from 'lucide-react';

interface RiderViewProps {
  onNavigate: (path: string) => void;
}

export const RiderView: React.FC<RiderViewProps> = ({ onNavigate }) => {
  // Selected active rider profile (defaults to Alex Vance)
  const [activeRider, setActiveRider] = useState<RiderProfile>(SEEDED_RIDERS[0]);

  // Polling assigned orders for this rider (every 5 seconds)
  const { orders, loading, isSyncing, refresh } = useOrdersPolling(
    { assigned_rider_id: activeRider.id },
    5000
  );

  // Status update / scanning states
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeScanOrder, setActiveScanOrder] = useState<Order | null>(null);
  const [scanInputToken, setScanInputToken] = useState<string>('');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanningActive, setIsScanningActive] = useState<boolean>(false);
  const [inspectAuditOrder, setInspectAuditOrder] = useState<Order | null>(null);
  const [deliverySuccessModal, setDeliverySuccessModal] = useState<Order | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Status advancement: Assigned -> Picked Up
  const handlePickupOrder = async (order: Order) => {
    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, 'picked_up', activeRider.id);
      refresh();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Open QR Scanner modal
  const handleOpenScanner = (order: Order) => {
    setActiveScanOrder(order);
    setScanInputToken('');
    setScannerError(null);
    setIsScanningActive(false);
  };

  // Close scanner and cleanup camera
  const handleCloseScanner = async () => {
    if (html5QrCodeRef.current && isScanningActive) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Camera stop error:', e);
      }
    }
    html5QrCodeRef.current = null;
    setIsScanningActive(false);
    setActiveScanOrder(null);
    setScannerError(null);
  };

  // Start live camera QR scanner via html5-qrcode
  const startCameraScanner = async () => {
    setScannerError(null);
    try {
      const qrCodeId = 'reader-canvas-box';
      const html5QrCode = new Html5Qrcode(qrCodeId);
      html5QrCodeRef.current = html5QrCode;

      setIsScanningActive(true);

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText) => {
          // Parse scanned payload (can be raw token or JSON {order_id, qr_token})
          let tokenToUse = decodedText.trim();
          try {
            const parsed = JSON.parse(decodedText);
            if (parsed.qr_token) tokenToUse = parsed.qr_token;
          } catch (e) {
            // raw string token
          }
          handleExecuteConfirmScan(tokenToUse);
        },
        (errorMessage) => {
          // parse scan frame
        }
      );
    } catch (err: any) {
      console.error('Camera init error:', err);
      setScannerError('Camera access unavailable. You can use the Quick Scan Simulation below.');
      setIsScanningActive(false);
    }
  };

  // Execute POST /orders/:id/confirm-scan
  const handleExecuteConfirmScan = async (tokenValue: string) => {
    if (!activeScanOrder) return;
    if (!tokenValue) {
      setScannerError('Please provide a valid QR Token.');
      return;
    }

    setUpdatingId(activeScanOrder.id);
    setScannerError(null);

    try {
      const deliveredOrder = await confirmScan(activeScanOrder.id, tokenValue, activeRider.id);

      // Stop camera if running
      if (html5QrCodeRef.current && isScanningActive) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {}
      }
      setIsScanningActive(false);
      setActiveScanOrder(null);

      // Trigger celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setDeliverySuccessModal(deliveredOrder);
      refresh();
    } catch (err: any) {
      setScannerError(err.message || 'QR Token validation failed. Check capability key.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Active / in-progress vs delivered orders
  const activeOrders = orders.filter((o) => o.status === 'assigned' || o.status === 'picked_up');
  const pastDeliveredOrders = orders.filter((o) => o.status === 'delivered');

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 pb-16">
      {/* Rider Header Bar */}
      <div className="bg-stone-900 text-stone-100 border-b border-stone-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl ${activeRider.avatarBg} text-white flex items-center justify-center font-bold text-base shadow-md`}
              >
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-white">{activeRider.name}</h1>
                  <span className="text-xs font-mono bg-stone-800 text-amber-400 px-2 py-0.5 rounded border border-stone-700 font-semibold">
                    {activeRider.callsign}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  {activeRider.vehicle} • {activeRider.rating}
                </p>
              </div>
            </div>

            {/* Switch Active Rider on Duty */}
            <div className="flex items-center gap-2 bg-stone-800 p-1.5 rounded-xl border border-stone-700">
              <span className="text-[11px] text-stone-400 font-medium px-2">Courier Profile:</span>
              {SEEDED_RIDERS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setActiveRider(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeRider.id === r.id
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'text-stone-300 hover:text-white hover:bg-stone-700/60'
                  }`}
                >
                  {r.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Quick status sync counter */}
          <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs font-mono text-stone-400">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
              <span>{isSyncing ? 'Syncing...' : 'Live Polling 5s Active'}</span>
            </div>
            <button
              onClick={() => refresh()}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Active Runs Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-stone-900">Current Assigned Deliveries</h2>
            </div>
            <span className="text-xs font-mono bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-full font-bold border border-indigo-200">
              {activeOrders.length} active dispatches
            </span>
          </div>

          {loading && orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-xs text-stone-400">
              Loading rider assignments...
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-800">No Active Deliveries Assigned</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Switch to the Dispatcher View to assign unassigned orders to {activeRider.name}.
              </p>
              <button
                onClick={() => onNavigate('dispatcher')}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Go to Dispatcher Queue →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => {
                const isAssignedState = order.status === 'assigned';
                const isPickedUpState = order.status === 'picked_up';
                const isBusy = updatingId === order.id;

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-2xl border-2 shadow-xs transition-all p-5 sm:p-6 space-y-4 ${
                      isPickedUpState
                        ? 'border-indigo-300 ring-2 ring-indigo-200/40 bg-indigo-50/20'
                        : 'border-sky-200'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-stone-900">{order.id}</span>
                        <StatusBadge status={order.status} size="sm" />
                      </div>
                      <button
                        onClick={() => setInspectAuditOrder(order)}
                        className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 font-medium"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                        <span>Audit Log ({order.status_history?.length || 0})</span>
                      </button>
                    </div>

                    {/* Order Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <div>
                          <span className="text-[11px] text-stone-400 font-medium block">Customer Recipient</span>
                          <span className="font-bold text-stone-900 text-sm">{order.customer_name}</span>
                          <div className="flex items-center gap-1.5 text-stone-600 font-mono mt-0.5">
                            <Phone className="w-3 h-3 text-stone-400" />
                            <span>{order.customer_phone}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-1.5 text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                          <Package className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                          <span className="font-medium text-stone-800">{order.item_description}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-[11px] text-stone-400 font-medium block">Delivery Destination</span>
                          <div className="flex items-start gap-1.5 text-stone-800 font-medium mt-0.5">
                            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <span className="text-xs">{order.delivery_address}</span>
                          </div>
                        </div>

                        <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/90 text-amber-900 text-[11px] space-y-0.5">
                          <span className="font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                            Proof Requirement
                          </span>
                          <p className="text-amber-800/90">
                            Delivered state can only be sealed by scanning the customer's QR label.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Step Bar */}
                    <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-stone-500 font-medium">
                        {isAssignedState && 'Step 1: Collect package from merchant'}
                        {isPickedUpState && 'Step 2: Scan QR at dropoff address to verify'}
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* Status Advancement Button 1: Assigned -> Picked Up */}
                        {isAssignedState && (
                          <button
                            onClick={() => handlePickupOrder(order)}
                            disabled={isBusy}
                            className="flex-1 sm:flex-none py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
                          >
                            <Package className="w-4 h-4" />
                            <span>{isBusy ? 'Updating...' : 'Mark Picked Up (In Transit)'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Status Advancement Button 2: Picked Up -> Delivered (QR Scanner) */}
                        {isPickedUpState && (
                          <button
                            onClick={() => handleOpenScanner(order)}
                            className="flex-1 sm:flex-none py-2.5 px-5 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all ring-2 ring-amber-400/40"
                          >
                            <QrCode className="w-4 h-4 text-amber-400" />
                            <span>Scan QR to Confirm Delivery</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed History Section */}
        {pastDeliveredOrders.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-stone-900">Completed & Verified Deliveries</h3>
              </div>
              <span className="text-xs font-mono text-stone-400 font-medium">
                {pastDeliveredOrders.length} sealed
              </span>
            </div>

            <div className="divide-y divide-stone-100">
              {pastDeliveredOrders.map((order) => (
                <div key={order.id} className="p-4 flex items-center justify-between gap-4 text-xs hover:bg-stone-50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-800">{order.id}</span>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                    <p className="text-stone-600 font-medium">
                      {order.customer_name} • {order.delivery_address}
                    </p>
                  </div>

                  <button
                    onClick={() => setInspectAuditOrder(order)}
                    className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-stone-500" />
                    <span>Proof Ledger</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* QR SCANNER MODAL */}
      {activeScanOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-stone-200 bg-stone-900 text-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">QR Proof-of-Delivery Scanner</h3>
                  <p className="text-[11px] text-stone-400 font-mono">Order: {activeScanOrder.id}</p>
                </div>
              </div>
              <button
                onClick={handleCloseScanner}
                className="p-1 text-stone-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scanner Body */}
            <div className="p-6 space-y-4">
              {scannerError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{scannerError}</span>
                </div>
              )}

              {/* Camera Scanner Viewport */}
              <div className="relative rounded-2xl overflow-hidden bg-stone-950 border-2 border-stone-800 flex flex-col items-center justify-center min-h-[220px]">
                <div id="reader-canvas-box" className="w-full h-full" />

                {!isScanningActive && (
                  <div className="p-6 text-center space-y-3">
                    <QrCode className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
                    <p className="text-xs text-stone-300">
                      Point device camera at the recipient's QR package code to trigger cryptographically verified delivery.
                    </p>
                    <button
                      onClick={startCameraScanner}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-2 mx-auto shadow-md transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Start Live Camera Scan</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Simulation / Fallback for Desktop Testing */}
              <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Quick Scan Simulation (Prototype Mode)
                  </span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Instantly validate with this order's genuine signed HMAC capability token:
                </p>

                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={() => handleExecuteConfirmScan(activeScanOrder.qr_token)}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simulate Successful QR Scan ({activeScanOrder.qr_token.slice(0, 12)}...)</span>
                  </button>
                </div>
              </div>

              {/* Manual Token Entry Option */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-medium text-stone-600 block">
                  Or Manually Validate QR Token:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scanInputToken}
                    onChange={(e) => setScanInputToken(e.target.value)}
                    placeholder="e.g. ntk_9a8b7c_..."
                    className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    onClick={() => handleExecuteConfirmScan(scanInputToken)}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Validate
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={handleCloseScanner}
                className="px-4 py-1.5 rounded-lg text-stone-600 hover:bg-stone-200 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELIVERY SUCCESS CELEBRATION MODAL */}
      {deliverySuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-700 font-bold">
                Proof-of-Delivery Sealed
              </span>
              <h3 className="text-xl font-bold text-stone-900 mt-1">Order Marked Delivered!</h3>
              <p className="text-xs text-stone-500 mt-1">
                The HMAC signature was validated and an immutable audit entry was written by {activeRider.name}.
              </p>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-stone-500">Order ID:</span>
                <span className="font-bold text-stone-900">{deliverySuccessModal.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Recipient:</span>
                <span className="text-stone-800">{deliverySuccessModal.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Courier:</span>
                <span className="text-emerald-700 font-semibold">{activeRider.name} ({activeRider.callsign})</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  const ord = deliverySuccessModal;
                  setDeliverySuccessModal(null);
                  setInspectAuditOrder(ord);
                }}
                className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>View Full Audit Ledger</span>
              </button>

              <button
                onClick={() => setDeliverySuccessModal(null)}
                className="w-full py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Modal */}
      {inspectAuditOrder && (
        <AuditTrailModal order={inspectAuditOrder} onClose={() => setInspectAuditOrder(null)} />
      )}
    </div>
  );
};
