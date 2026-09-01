import React, { useState, useEffect } from 'react';
import { fetchCatalog, createOrder } from '../api/ordersClient';
import { CatalogItem, CreateOrderPayload, CreateOrderResponse } from '../types';
import {
  ShoppingBag,
  ArrowRight,
  Clock,
  CheckCircle,
  Truck,
  Sparkles,
  ShieldCheck,
  Phone,
  MapPin,
  User,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface LandingViewProps {
  onNavigate: (path: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  // Identity / Deferred Auth Gate Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdOrderResult, setCreatedOrderResult] = useState<CreateOrderResponse | null>(null);

  useEffect(() => {
    fetchCatalog()
      .then((data) => {
        setCatalog(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Catalog fetch error:', err);
        setLoading(false);
      });
  }, []);

  const handleOpenOrderModal = (item: CatalogItem) => {
    setSelectedItem(item);
    setErrorMsg(null);
    setCreatedOrderResult(null);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setErrorMsg(null);
    setCreatedOrderResult(null);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      setErrorMsg('Please complete all required fields (Name, Phone, and Delivery Address).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const payload: CreateOrderPayload = {
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      delivery_address: deliveryAddress.trim(),
      item_description: `${selectedItem.name} (${selectedItem.price})`,
      retailer_id: 'ret_northstar_01',
    };

    try {
      const response = await createOrder(payload);
      setCreatedOrderResult(response);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      {/* Hero Header Section */}
      <section className="bg-stone-900 text-stone-100 py-16 px-4 sm:px-6 lg:px-8 border-b border-stone-800 relative overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold font-mono text-lg shadow-lg">
                NR
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold block">
                  Public Storefront
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-white">Northstar Provisions</h1>
              </div>
            </div>

            {/* Role switch navigation banner */}
            <div className="flex items-center gap-2 bg-stone-800/90 border border-stone-700/80 rounded-xl p-1.5 text-xs font-medium">
              <span className="px-2.5 py-1 text-stone-400">Internal Hubs:</span>
              <button
                onClick={() => onNavigate('retailer')}
                className="px-3 py-1.5 rounded-lg bg-stone-700/60 hover:bg-stone-700 text-stone-200 hover:text-white transition-colors"
              >
                Retailer Hub
              </button>
              <button
                onClick={() => onNavigate('dispatcher')}
                className="px-3 py-1.5 rounded-lg bg-stone-700/60 hover:bg-stone-700 text-stone-200 hover:text-white transition-colors"
              >
                Dispatcher Queue
              </button>
              <button
                onClick={() => onNavigate('rider')}
                className="px-3 py-1.5 rounded-lg bg-stone-700/60 hover:bg-stone-700 text-stone-200 hover:text-white transition-colors"
              >
                Rider Mobile App
              </button>
            </div>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800 text-amber-300 text-xs font-mono mb-4 border border-stone-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Zero Account Sign-Up Needed • Direct QR Token Tracking</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Artisan goods delivered with <span className="text-amber-400">cryptographic proof</span>.
            </h2>
            <p className="mt-4 text-lg text-stone-300 leading-relaxed">
              Explore our curated selection of fresh roasts, bakery treats, and gourmet kits. Place an order anonymously and receive a capability tracking token to watch your delivery in real time.
            </p>
          </div>

          {/* Quick value props */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-stone-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-800 text-amber-400 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Direct Local Courier</h4>
                <p className="text-xs text-stone-400 mt-0.5">Dispatched to vetted eco-riders across the city</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-800 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">QR Verified Delivery</h4>
                <p className="text-xs text-stone-400 mt-0.5">Physical scan at dropoff seals the order state</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-800 text-sky-400 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Live State Sync</h4>
                <p className="text-xs text-stone-400 mt-0.5">Short-interval polling keeps your order status fresh</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Grid Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-stone-900 tracking-tight">Available For Delivery Today</h3>
            <p className="text-sm text-stone-500 mt-1">Browse items freely without logging in. Identity is requested only at checkout.</p>
          </div>
          <span className="text-xs font-mono bg-stone-200/80 text-stone-700 px-3 py-1 rounded-full font-medium">
            {catalog.length} items ready
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-stone-200 h-80 p-4 flex flex-col justify-between">
                <div className="bg-stone-200 h-40 rounded-xl w-full" />
                <div className="space-y-2">
                  <div className="bg-stone-200 h-4 rounded w-3/4" />
                  <div className="bg-stone-200 h-3 rounded w-full" />
                </div>
                <div className="bg-stone-200 h-9 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {catalog.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md hover:border-stone-300 transition-all overflow-hidden flex flex-col group"
              >
                {/* Product Image */}
                <div className="h-44 w-full bg-stone-100 relative overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
                    {item.category}
                  </span>
                  <span className="absolute bottom-3 right-3 bg-white/95 text-stone-900 text-xs font-mono font-bold px-2.5 py-1 rounded-lg shadow-xs">
                    {item.price}
                  </span>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-stone-900 text-base leading-snug group-hover:text-amber-700 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{item.estimated_prep_minutes}</span>
                    </div>

                    <button
                      onClick={() => handleOpenOrderModal(item)}
                      className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <span>Order Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Informational banner about capability tokens */}
        <div className="mt-16 bg-amber-50/80 border border-amber-200/90 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-900 font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-amber-700" />
              <span>How Northstar Reflex Authentication Works</span>
            </div>
            <p className="text-xs text-amber-800/90 max-w-2xl leading-relaxed">
              Browsing is completely anonymous. When you place an order, our backend issues a unique HMAC-signed capability token. This token gives you instant access to your live order tracker without requiring passwords or account creation.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('retailer')}
              className="px-4 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-amber-100 text-xs font-semibold transition-colors"
            >
              Retailer Management View →
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-8 px-4 border-t border-stone-800 text-xs font-mono text-center">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-stone-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Northstar Reflex Prototype Engine • Live Polling Sync</span>
          </div>
          <div className="flex gap-4 text-stone-400">
            <button onClick={() => onNavigate('retailer')} className="hover:text-white underline">
              Retailer
            </button>
            <button onClick={() => onNavigate('dispatcher')} className="hover:text-white underline">
              Dispatcher
            </button>
            <button onClick={() => onNavigate('rider')} className="hover:text-white underline">
              Rider App
            </button>
          </div>
        </div>
      </footer>

      {/* DEFERRED AUTHENTICATION & ORDER CREATION MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 font-bold block">
                  {createdOrderResult ? 'Order Confirmed' : 'Identity & Delivery Gate'}
                </span>
                <h3 className="text-lg font-bold text-stone-900 mt-0.5">
                  {createdOrderResult ? 'Delivery Tracking Ready' : 'Complete Your Delivery Request'}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-stone-400 hover:text-stone-700 text-sm font-semibold px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {createdOrderResult ? (
                /* SUCCESS STATE - TRACKING LINK READY */
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">Order Placed Successfully!</h4>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Your delivery request has been queued for the dispatcher. Your capability tracking token has been generated.
                      </p>
                    </div>
                  </div>

                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-stone-200 font-mono">
                      <span className="text-stone-500">Order ID</span>
                      <span className="font-bold text-stone-900">{createdOrderResult.order.id}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-200">
                      <span className="text-stone-500">Item</span>
                      <span className="font-semibold text-stone-900">{createdOrderResult.order.item_description}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-200">
                      <span className="text-stone-500">Recipient</span>
                      <span className="font-medium text-stone-800">{createdOrderResult.order.customer_name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-200">
                      <span className="text-stone-500">Delivery To</span>
                      <span className="font-medium text-stone-800">{createdOrderResult.order.delivery_address}</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-stone-500 block mb-1 font-semibold">Capability Tracking Token</span>
                      <span className="font-mono bg-amber-50 text-amber-900 px-2 py-1 rounded border border-amber-200 block break-all text-[11px]">
                        {createdOrderResult.customer_tracking_token}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => {
                        handleCloseModal();
                        onNavigate(
                          `track/${createdOrderResult.order.id}?token=${createdOrderResult.customer_tracking_token}`
                        );
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <Truck className="w-4 h-4 text-amber-400" />
                      <span>Open Live Customer Tracker</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleCloseModal}
                      className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
                    >
                      Back to Catalog
                    </button>
                  </div>
                </div>
              ) : (
                /* DEFERRED AUTHENTICATION FORM */
                <form onSubmit={handleSubmitOrder} className="space-y-4">
                  {/* Selected Item Summary */}
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-stone-500 block font-medium">Selected Item</span>
                      <span className="text-sm font-bold text-stone-900">{selectedItem.name}</span>
                    </div>
                    <span className="text-sm font-bold font-mono text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      {selectedItem.price}
                    </span>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                      {errorMsg}
                    </div>
                  )}

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                        Your Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Jordan Rivera"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                        Contact Phone Number <span className="text-rose-500">*</span>
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
                          placeholder="e.g. 742 Evergreen Terrace, Apt 4B"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-500 italic pt-1 leading-normal">
                    * No password or credit card required for this prototype. Identity is strictly scoped to this delivery request.
                  </p>

                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-95 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
                    >
                      {isSubmitting ? (
                        <span>Generating Capability Token...</span>
                      ) : (
                        <>
                          <span>Submit Delivery Request</span>
                          <ArrowRight className="w-4 h-4 text-amber-400" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
