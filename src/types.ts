export type OrderStatus = 'requested' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';

export interface StatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus | string;
  changed_by: string;
  timestamp: string;
}

export interface Order {
  id: string;
  retailer_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  item_description: string;
  status: OrderStatus;
  assigned_rider_id: string | null;
  qr_token: string;
  created_at: string;
  updated_at: string;
  status_history: StatusHistory[];
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  image_url?: string;
  estimated_prep_minutes?: string;
}

export interface CreateOrderPayload {
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  item_description: string;
  retailer_id?: string;
}

export interface CreateOrderResponse {
  order: Order;
  customer_tracking_token: string;
  tracking_url: string;
}

export interface RiderProfile {
  id: string;
  name: string;
  callsign: string;
  vehicle: string;
  rating: string;
  avatarBg: string;
}

export const SEEDED_RIDERS: RiderProfile[] = [
  {
    id: 'rider_alex_01',
    name: 'Alex Vance',
    callsign: 'Swift-1',
    vehicle: 'Electric Cargo Bike #12',
    rating: '4.98 ★',
    avatarBg: 'bg-emerald-600',
  },
  {
    id: 'rider_sam_02',
    name: 'Sam Chen',
    callsign: 'Apex-2',
    vehicle: 'Zero-Emission Scooter #07',
    rating: '4.95 ★',
    avatarBg: 'bg-indigo-600',
  },
];
