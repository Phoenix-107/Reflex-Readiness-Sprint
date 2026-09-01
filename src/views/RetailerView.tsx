import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useOrdersPolling, createOrder } from '../api/ordersClient';
import { CreateOrderPayload, CreateOrderResponse, Order } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AuditTrailModal } from '../components/AuditTrailModal';
import {
  Store,
  PlusCircle,
  QrCode,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Copy,
  Check,
  Clock,
  MapPin,
  Phone,
  User,
  Package,
} from 'lucide-react';

interface RetailerViewProps {
  onNavigate: (path: string) => void;
}

export const RetailerView: React.FC<RetailerViewProps> = ({ onNavigate }) => {
  // Polling hook (every 6 seconds)
  const { orders, loading, isSyncing, lastSync, refresh } = useOrdersPolling(
    { retailer_id: 'ret_northstar_01' },
    6000
  );

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active created order QR modal or banner
  const [lastCreatedOrder, setLastCreatedOrder] = useState<CreateOrderResponse | null>(null);
  const [selectedQrOrder, setSelectedQrOrder] = useState<Order | null>(null);
  const [inspectAuditOrder, setInspectAuditOrder] = useState<Order | null>(null);

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !deliveryAddress || !itemDescription) {
      setErrorMsg('Please complete all order fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const payload: CreateOrderPayload = {
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      delivery_address: deliveryAddress.trim(),
      item_description: itemDescription.trim(),
      retailer_id: 'ret_northstar_01',
    };

    try {
      const response = await createOrder(payload);
      setLastCreatedOrder(response);
      setSelectedQrOrder(response.order);

      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setItemDescription('');
      refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch =
      o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.item_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.delivery_address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-stone-900">Retailer Hub</h1>
                  <span className="text-xs font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
                    ID: ret_northstar_01
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Issue delivery manifests, generate proof QR tokens, and monitor order lifecycle.
                </p>
              </div>
            </div>

            {/* Sync & Actions */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-mono text-stone-500 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200">
                <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                <span>{isSyncing ? 'Syncing...' : 'Live Polling 6s'}</span>
              </div>

              <button
                onClick={() => refresh()}
                className="p-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg text-stone-600 transition-colors"
                title="Refresh now"
              >
                <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Create Order Form (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6">
            <div className="flex items-center gap-2 mb-4">
              <PlusCircle className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-stone-900">New Delivery Manifest</h2>
            </div>
            <p className="text-xs text-stone-500 mb-5">
              Submitting an order appends to the immutable status ledger and creates a signed QR capability token.
            </p>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Customer Recipient <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Maya Lin"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Customer Phone <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 438-9210"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Delivery Destination Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. 452 Pinecrest Ave, Apt 3B"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Item / Parcel Description <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Package className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <textarea
                    required
                    rows={3}
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="e.g. 2x Cold Brew Concentrate + Ethiopian Roast"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all mt-2"
              >
                {isSubmitting ? (
                  <span>Generating Order & QR Token...</span>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 text-amber-400" />
                    <span>Create Order & Generate QR</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Order History & Active QR Code Card (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Newly Generated QR Banner (if just created) */}
          {selectedQrOrder && (
            <div className="bg-white rounded-2xl border-2 border-amber-400/80 p-6 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Package QR Verification Label</h3>
                    <p className="text-xs text-stone-500 font-mono">Order: {selectedQrOrder.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedQrOrder(null)}
                  className="text-xs font-semibold text-stone-500 hover:text-stone-800"
                >
                  Dismiss Label
                </button>
              </div>

              <div className="pt-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                {/* QR Canvas */}
                <div className="sm:col-span-5 flex flex-col items-center p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-xs">
                    {/* The QR contains the signed qr_token (or JSON payload {order_id, qr_token}) */}
                    <QRCodeSVG
                      value={JSON.stringify({
                        order_id: selectedQrOrder.id,
                        qr_token: selectedQrOrder.qr_token,
                      })}
                      size={160}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <span className="text-[11px] text-stone-500 mt-2 font-mono text-center">
                    Print or attach to parcel for Rider Scan
                  </span>
                </div>

                {/* Details */}
                <div className="sm:col-span-7 space-y-3 text-xs">
                  <div>
                    <span className="text-stone-500 block text-[11px]">Recipient & Address</span>
                    <span className="font-bold text-stone-900 text-sm">{selectedQrOrder.customer_name}</span>
                    <p className="text-stone-600 mt-0.5">{selectedQrOrder.delivery_address}</p>
                  </div>

                  <div>
                    <span className="text-stone-500 block text-[11px]">HMAC QR Token (Proof Key)</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200 text-[11px] break-all flex-1">
                        {selectedQrOrder.qr_token}
                      </span>
                      <button
                        onClick={() => handleCopy(selectedQrOrder.qr_token, 'qr_tok')}
                        className="p-1.5 bg-stone-100 hover:bg-stone-200 rounded border border-stone-200 text-stone-700"
                        title="Copy Token"
                      >
                        {copiedId === 'qr_tok' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        onNavigate(`track/${selectedQrOrder.id}?token=${selectedQrOrder.qr_token}`)
                      }
                      className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                      <span>Open Customer Tracking View</span>
                    </button>
                    <button
                      onClick={() => setInspectAuditOrder(selectedQrOrder)}
                      className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Audit Trail</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Table & Filtering */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-stone-900">Retailer Orders Ledger</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Synchronizing with shared order state across Dispatcher and Riders
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search orders..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs font-medium">
                  {['all', 'requested', 'assigned', 'picked_up', 'delivered'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                        statusFilter === st
                          ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      {st === 'picked_up' ? 'in transit' : st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List */}
            {loading && orders.length === 0 ? (
              <div className="p-12 text-center text-xs text-stone-400">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Package className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-sm font-medium text-stone-600">No orders matching filter</p>
                <p className="text-xs text-stone-400">Create a new delivery request using the form on the left.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-stone-50/80 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-stone-900">{order.id}</span>
                        <StatusBadge status={order.status} size="sm" />
                      </div>

                      <div className="text-xs font-semibold text-stone-800">
                        {order.customer_name} • <span className="font-normal text-stone-500">{order.delivery_address}</span>
                      </div>

                      <p className="text-xs text-stone-600 line-clamp-1">{order.item_description}</p>

                      <div className="flex items-center gap-4 text-[11px] text-stone-400 font-mono pt-0.5">
                        <span>Created {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {order.assigned_rider_id && (
                          <span className="text-indigo-600 font-medium">
                            Rider: {order.assigned_rider_id}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedQrOrder(order)}
                        className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                        title="View / Print QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR Code</span>
                      </button>

                      <button
                        onClick={() => setInspectAuditOrder(order)}
                        className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                        title="View Audit Trail"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Audit ({order.status_history?.length || 0})</span>
                      </button>

                      <button
                        onClick={() => handleCopy(`${window.location.origin}/track/${order.id}?token=${order.qr_token}`, order.id)}
                        className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                        title="Copy Customer Tracking Link"
                      >
                        {copiedId === order.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Trail Modal */}
      {inspectAuditOrder && (
        <AuditTrailModal order={inspectAuditOrder} onClose={() => setInspectAuditOrder(null)} />
      )}
    </div>
  );
};
