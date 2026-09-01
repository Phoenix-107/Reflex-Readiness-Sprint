import { useState } from 'react';
import { useOrdersPolling, assignOrder } from '../api/ordersClient';
import { Order, SEEDED_RIDERS, RiderProfile } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AuditTrailModal } from '../components/AuditTrailModal';
import {
  Compass,
  RotateCw,
  UserCheck,
  Clock,
  MapPin,
  Package,
  ShieldCheck,
  AlertCircle,
  Truck,
  CheckCircle2,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface DispatcherViewProps {
  onNavigate: (path: string) => void;
}

export const DispatcherView: React.FC<DispatcherViewProps> = ({ onNavigate }) => {
  // Poll requested orders queue (every 5 seconds)
  const { orders: requestedOrders, loading, isSyncing, refresh } = useOrdersPolling(
    { status: 'requested' },
    5000
  );

  // Poll all orders for dispatch oversight
  const { orders: allOrders, refresh: refreshAll } = useOrdersPolling({}, 6000);

  const [activeTab, setActiveTab] = useState<'queue' | 'fleet'>('queue');
  const [selectedRiderMap, setSelectedRiderMap] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [inspectAuditOrder, setInspectAuditOrder] = useState<Order | null>(null);

  const handleSelectRider = (orderId: string, riderId: string) => {
    setSelectedRiderMap((prev) => ({ ...prev, [orderId]: riderId }));
  };

  const handleAssign = async (order: Order) => {
    const chosenRiderId = selectedRiderMap[order.id] || SEEDED_RIDERS[0].id;
    setAssigningId(order.id);

    try {
      await assignOrder(order.id, chosenRiderId);
      const riderName = SEEDED_RIDERS.find((r) => r.id === chosenRiderId)?.name || chosenRiderId;
      setSuccessToast(`Order ${order.id.slice(0, 8)} successfully assigned to ${riderName}!`);
      setTimeout(() => setSuccessToast(null), 3500);
      refresh();
      refreshAll();
    } catch (err: any) {
      alert(`Assignment failed: ${err.message}`);
    } finally {
      setAssigningId(null);
    }
  };

  // Fleet stats
  const activeFleetOrders = allOrders.filter((o) => o.status === 'assigned' || o.status === 'picked_up');
  const deliveredOrders = allOrders.filter((o) => o.status === 'delivered');

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-stone-900">Dispatcher Control Center</h1>
                  <span className="text-xs font-mono bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-200">
                    Queue: GET /orders?status=requested
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Route incoming merchant manifests to available couriers in real time.
                </p>
              </div>
            </div>

            {/* Sync & Stats */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-mono text-stone-500 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200">
                <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                <span>{isSyncing ? 'Polling...' : 'Live 5s Sync'}</span>
              </div>

              <button
                onClick={() => {
                  refresh();
                  refreshAll();
                }}
                className="p-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg text-stone-600 transition-colors"
                title="Refresh dispatch queue"
              >
                <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-6 pt-5 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                Unassigned Queue
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-amber-950 font-mono">
                  {requestedOrders.length}
                </span>
                <span className="text-[11px] text-amber-700">awaiting rider</span>
              </div>
            </div>

            <div className="bg-indigo-50/80 border border-indigo-200/90 rounded-xl p-3">
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block">
                In Transit (Field)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-indigo-950 font-mono">
                  {activeFleetOrders.length}
                </span>
                <span className="text-[11px] text-indigo-700">active dispatches</span>
              </div>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                Delivered Today
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-950 font-mono">
                  {deliveredOrders.length}
                </span>
                <span className="text-[11px] text-emerald-700">QR verified</span>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                Active Couriers
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-stone-900 font-mono">
                  {SEEDED_RIDERS.length}
                </span>
                <span className="text-[11px] text-stone-500">on roster</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Success Alert Toast */}
        {successToast && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast(null)} className="text-emerald-700 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-stone-200/80 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'queue'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Pending Assignment Queue</span>
              <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 text-[11px] font-bold flex items-center justify-center font-mono">
                {requestedOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('fleet')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'fleet'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Full Fleet Ledger</span>
              <span className="w-5 h-5 rounded-full bg-stone-300 text-stone-700 text-[11px] font-bold flex items-center justify-center font-mono">
                {allOrders.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-stone-500 hidden sm:block">
            Assigning updates order status to <span className="font-mono text-indigo-700 font-bold">assigned</span> and routes to rider app.
          </div>
        </div>

        {/* TAB 1: UNASSIGNED QUEUE */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            {loading && requestedOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-xs text-stone-400">
                Polling unassigned queue...
              </div>
            ) : requestedOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-stone-900">Queue is Clear!</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  All incoming orders have been assigned to couriers. Create a new delivery in the Retailer Hub or wait for customer checkout requests.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => onNavigate('retailer')}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Go to Retailer Hub to Create Order
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {requestedOrders.map((order) => {
                  const selectedRiderId = selectedRiderMap[order.id] || SEEDED_RIDERS[0].id;
                  const isAssigning = assigningId === order.id;

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border-2 border-amber-200/80 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between"
                    >
                      {/* Top Header */}
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-stone-900">{order.id}</span>
                            <StatusBadge status={order.status} size="sm" />
                          </div>
                          <span className="text-[11px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                            Awaiting Dispatch
                          </span>
                        </div>

                        {/* Order info */}
                        <div className="mt-4 space-y-2.5 text-xs">
                          <div>
                            <span className="text-stone-400 text-[11px] block font-medium">Customer Recipient</span>
                            <span className="font-bold text-stone-900 text-sm">{order.customer_name}</span>
                            <span className="text-stone-500 text-[11px] block font-mono">{order.customer_phone}</span>
                          </div>

                          <div className="flex items-start gap-1.5 text-stone-700">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                            <span>{order.delivery_address}</span>
                          </div>

                          <div className="flex items-start gap-1.5 text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                            <Package className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{order.item_description}</span>
                          </div>
                        </div>
                      </div>

                      {/* Assignment Control Box */}
                      <div className="mt-6 pt-4 border-t border-stone-100 space-y-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                          Assign To Active Courier
                        </label>

                        <div className="grid grid-cols-2 gap-2">
                          {SEEDED_RIDERS.map((rider) => (
                            <button
                              key={rider.id}
                              type="button"
                              onClick={() => handleSelectRider(order.id, rider.id)}
                              className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${
                                selectedRiderId === rider.id
                                  ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300/40 text-sky-950 font-semibold'
                                  : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-md ${rider.avatarBg} text-white flex items-center justify-center font-bold text-[10px] shrink-0`}
                              >
                                {rider.id.includes('alex') ? 'AV' : 'SC'}
                              </div>
                              <div className="truncate">
                                <span className="block font-bold text-[11px] truncate">{rider.name}</span>
                                <span className="text-[10px] text-stone-500 block truncate">{rider.callsign}</span>
                              </div>
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleAssign(order)}
                            disabled={isAssigning}
                            className="flex-1 py-2.5 px-4 bg-stone-900 hover:bg-stone-800 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
                          >
                            <UserCheck className="w-4 h-4 text-sky-400" />
                            <span>{isAssigning ? 'Dispatching...' : 'Confirm Assignment'}</span>
                          </button>

                          <button
                            onClick={() => setInspectAuditOrder(order)}
                            className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors"
                            title="Inspect Status History"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FULL FLEET LEDGER */}
        {activeTab === 'fleet' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">Entire Order Dispatch Ledger</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Real-time snapshot across all statuses with rider assignments
              </p>
            </div>

            <div className="divide-y divide-stone-100">
              {allOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-stone-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-900">{order.id}</span>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                    <div className="font-semibold text-stone-800">
                      {order.customer_name} • <span className="font-normal text-stone-500">{order.delivery_address}</span>
                    </div>
                    <p className="text-stone-600 line-clamp-1">{order.item_description}</p>
                    <div className="flex items-center gap-3 font-mono text-[11px] text-stone-400">
                      <span>Rider: {order.assigned_rider_id || 'Unassigned'}</span>
                      <span>•</span>
                      <span>Updated {new Date(order.updated_at).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setInspectAuditOrder(order)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Audit Trail ({order.status_history?.length || 0})</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Audit Modal */}
      {inspectAuditOrder && (
        <AuditTrailModal order={inspectAuditOrder} onClose={() => setInspectAuditOrder(null)} />
      )}
    </div>
  );
};
