import { useState, useEffect, useCallback, useRef } from 'react';
import { Order, CatalogItem, CreateOrderPayload, CreateOrderResponse } from '../types';

// In production (Vercel), the frontend is a static build with no backend of
// its own — VITE_API_BASE_URL must point at the deployed FastAPI service (Render).
// Locally, server.ts answers /api directly, so the fallback keeps `npm run dev` working.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchCatalog(): Promise<CatalogItem[]> {
  const res = await fetch(`${API_BASE}/catalog`);
  if (!res.ok) throw new Error(`Failed to fetch catalog: ${res.statusText}`);
  return res.json();
}

export async function fetchOrders(params?: {
  status?: string;
  assigned_rider_id?: string;
  retailer_id?: string;
}): Promise<Order[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.assigned_rider_id) query.append('assigned_rider_id', params.assigned_rider_id);
  if (params?.retailer_id) query.append('retailer_id', params.retailer_id);

  const url = `${API_BASE}/orders${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.statusText}`);
  return res.json();
}

export async function fetchOrderById(id: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${id}`);
  if (!res.ok) throw new Error(`Order ${id} not found`);
  return res.json();
}

export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || 'Failed to create order');
  }
  return res.json();
}

export async function assignOrder(orderId: string, riderId: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rider_id: riderId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || 'Failed to assign order');
  }
  return res.json();
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  changedBy?: string
): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, changed_by: changedBy }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || 'Failed to update order status');
  }
  return res.json();
}

export async function confirmScan(
  orderId: string,
  qrToken: string,
  riderId?: string
): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/confirm-scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qr_token: qrToken, rider_id: riderId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || 'Failed to confirm QR scan delivery');
  }
  return res.json();
}

export async function trackOrder(orderId: string, token: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/track?token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || 'Invalid or expired tracking token');
  }
  return res.json();
}

/**
 * Short-interval polling hook (5-10s) to keep views synced without WebSockets.
 */
export function useOrdersPolling(
  params?: { status?: string; assigned_rider_id?: string; retailer_id?: string },
  intervalMs = 6000
) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Stringify params for safe dependency comparison
  const paramsKey = JSON.stringify(params || {});
  const isMounted = useRef(true);

  const loadData = useCallback(
    async (showSyncIndicator = true) => {
      if (showSyncIndicator) setIsSyncing(true);
      try {
        const parsedParams = paramsKey ? JSON.parse(paramsKey) : undefined;
        const data = await fetchOrders(parsedParams);
        if (isMounted.current) {
          setOrders(data);
          setError(null);
          setLastSync(new Date());
        }
      } catch (err: any) {
        if (isMounted.current) {
          setError(err.message || 'Error fetching orders');
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setIsSyncing(false);
        }
      }
    },
    [paramsKey]
  );

  useEffect(() => {
    isMounted.current = true;
    setLoading(true);
    loadData(false);

    const timer = setInterval(() => {
      loadData(true);
    }, intervalMs);

    return () => {
      isMounted.current = false;
      clearInterval(timer);
    };
  }, [loadData, intervalMs]);

  return { orders, loading, error, lastSync, isSyncing, refresh: () => loadData(true), setOrders };
}

/**
 * Polling hook for tracking a specific single order by token
 */
export function useTrackOrderPolling(orderId: string, token: string, intervalMs = 5000) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const loadTrack = useCallback(async () => {
    if (!orderId || !token) return;
    try {
      const data = await trackOrder(orderId, token);
      setOrder(data);
      setError(null);
      setLastSync(new Date());
    } catch (err: any) {
      setError(err.message || 'Error tracking order');
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    loadTrack();
    const interval = setInterval(loadTrack, intervalMs);
    return () => clearInterval(interval);
  }, [loadTrack, intervalMs]);

  return { order, loading, error, lastSync, refresh: loadTrack };
}
