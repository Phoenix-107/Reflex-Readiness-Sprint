import React, { useState, useEffect } from 'react';
import { LandingView } from './views/LandingView';
import { RetailerView } from './views/RetailerView';
import { DispatcherView } from './views/DispatcherView';
import { RiderView } from './views/RiderView';
import { TrackOrderView } from './views/TrackOrderView';
import { resetDemo } from './api/ordersClient';
import {
  Compass,
  Store,
  Bike,
  Sparkles,
  RotateCcw,
  ShoppingBag,
  Truck,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [resetting, setResetting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state with browser hash/pathname
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.replace(/^\/+/, '') || window.location.hash.replace(/^#\/?/, '');
      setCurrentPath(path);
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const navigateTo = (path: string) => {
    const cleanPath = path.replace(/^\/+/, '');
    setCurrentPath(cleanPath);
    if (window.history.pushState) {
      window.history.pushState({}, '', `/${cleanPath}`);
    } else {
      window.location.hash = cleanPath;
    }
  };

  const handleResetDemoData = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      await resetDemo();
      setToastMessage('Demo dataset restored to initial seed state.');
      setTimeout(() => setToastMessage(null), 3000);
      // Reload current view state
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  // Route matching
  const renderCurrentView = () => {
    // Check if tracking route: e.g. "track/ord-req-001?token=xyz" or "track?id=...&token=..."
    if (currentPath.startsWith('track')) {
      let orderId = '';
      let token = '';

      // Try URL search params first
      const searchParams = new URLSearchParams(window.location.search);
      token = searchParams.get('token') || '';

      if (currentPath.includes('?')) {
        const parts = currentPath.split('?');
        const pathPart = parts[0];
        const queryPart = parts[1];
        const qParams = new URLSearchParams(queryPart);
        token = token || qParams.get('token') || '';
        orderId = pathPart.replace(/^track\/?/, '');
      } else {
        orderId = currentPath.replace(/^track\/?/, '');
      }

      // Default fallback if orderId not parsed
      if (!orderId && searchParams.get('id')) {
        orderId = searchParams.get('id') || '';
      }

      return (
        <TrackOrderView
          orderId={orderId || 'ord-pkd-003-77a9'}
          token={token}
          onNavigate={navigateTo}
        />
      );
    }

    if (currentPath === 'retailer') {
      return <RetailerView onNavigate={navigateTo} />;
    }

    if (currentPath === 'dispatcher') {
      return <DispatcherView onNavigate={navigateTo} />;
    }

    if (currentPath === 'rider') {
      return <RiderView onNavigate={navigateTo} />;
    }

    // Default route "/" is LandingView with deferred authentication
    return <LandingView onNavigate={navigateTo} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-stone-900 selection:bg-amber-100 selection:text-amber-900">
      {/* Global Prototype Navigation Bar */}
      <header className="bg-stone-900 border-b border-stone-800 text-stone-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateTo('')}
                className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold font-mono text-xs shadow-xs">
                  NR
                </div>
                <span className="font-bold text-white tracking-tight text-sm font-sans">
                  Northstar Reflex
                </span>
              </button>

              <span className="hidden sm:inline-block text-[11px] font-mono bg-stone-800 text-amber-300 px-2 py-0.5 rounded border border-stone-700">
                4-Day Prototype
              </span>
            </div>

            {/* Role Navigation Links */}
            <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
              <button
                onClick={() => navigateTo('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  currentPath === ''
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Storefront (/)</span>
              </button>

              <button
                onClick={() => navigateTo('retailer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  currentPath === 'retailer'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Retailer</span>
              </button>

              <button
                onClick={() => navigateTo('dispatcher')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  currentPath === 'dispatcher'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Dispatcher</span>
              </button>

              <button
                onClick={() => navigateTo('rider')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  currentPath === 'rider'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Rider App</span>
              </button>
            </nav>

            {/* Quick Demo Reseed Trigger */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetDemoData}
                disabled={resetting}
                className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors border border-stone-700 shrink-0"
                title="Reset demo orders dataset"
              >
                <RotateCcw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">Reseed Demo</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Global Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-xl border border-stone-700 shadow-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col">{renderCurrentView()}</div>
    </div>
  );
}
