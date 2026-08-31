import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Durable Store for the Node Runtime Environment
const QR_SECRET_KEY = process.env.QR_SECRET_KEY || 'northstar-reflex-secure-signing-secret-2026';

function generateQrToken(orderId: string): string {
  const nonce = crypto.randomBytes(6).toString('hex');
  const payload = `${orderId}:${nonce}`;
  const signature = crypto.createHmac('sha256', QR_SECRET_KEY).update(payload).digest('hex').slice(0, 16);
  return `ntk_${nonce}_${signature}`;
}

function verifyQrToken(orderId: string, token: string): boolean {
  if (!token || !token.startsWith('ntk_')) return false;
  const parts = token.split('_');
  if (parts.length !== 3) return false;
  const nonce = parts[1];
  const providedSig = parts[2];
  const payload = `${orderId}:${nonce}`;
  const expectedSig = crypto.createHmac('sha256', QR_SECRET_KEY).update(payload).digest('hex').slice(0, 16);
  return crypto.timingSafeEqual(Buffer.from(providedSig), Buffer.from(expectedSig));
}

export interface StatusHistoryRecord {
  id: string;
  order_id: string;
  status: string;
  changed_by: string;
  timestamp: string;
}

export interface OrderRecord {
  id: string;
  retailer_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  item_description: string;
  status: 'requested' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';
  assigned_rider_id: string | null;
  qr_token: string;
  created_at: string;
  updated_at: string;
  status_history: StatusHistoryRecord[];
}

export interface CatalogItemRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  image_url: string;
  estimated_prep_minutes: string;
}

let catalogStore: CatalogItemRecord[] = [];
let ordersStore: OrderRecord[] = [];

function initSeedData() {
  catalogStore = [
    {
      id: 'cat_item_01',
      name: 'Cold Brew Reserve & Single-Origin Beans',
      description: 'Nitro-infused Ethiopian Yirgacheffe concentrate with 250g whole roasted beans.',
      category: 'Beverages & Coffee',
      price: '$24.50',
      image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
      estimated_prep_minutes: '10-15 min',
    },
    {
      id: 'cat_item_02',
      name: 'Artisan Sourdough & Truffle Butter Crate',
      description: 'Slow-fermented country loaf paired with cultured French butter and black truffle sea salt.',
      category: 'Bakery & Pantry',
      price: '$18.00',
      image_url: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=600&auto=format&fit=crop&q=80',
      estimated_prep_minutes: '15-20 min',
    },
    {
      id: 'cat_item_03',
      name: 'Handcrafted Ramen Dinner Kit for Two',
      description: 'Fresh alkaline noodles, 18-hour tonkotsu broth, chashu pork belly, marinated ajitsuke tamago.',
      category: 'Gourmet Meal Kits',
      price: '$38.00',
      image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
      estimated_prep_minutes: '20-25 min',
    },
    {
      id: 'cat_item_04',
      name: 'Botanical Immunity Elixirs (4-Pack)',
      description: 'Cold-pressed ginger root, yuzu, turmeric, wild mountain honey, and sparkling mineral spring water.',
      category: 'Wellness & Tonics',
      price: '$22.00',
      image_url: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&auto=format&fit=crop&q=80',
      estimated_prep_minutes: '5-10 min',
    },
  ];

  const now = new Date();
  const subMinutes = (m: number) => new Date(now.getTime() - m * 60000).toISOString();

  const id1 = 'ord-req-001-88f2';
  const token1 = generateQrToken(id1);

  const id2 = 'ord-asg-002-39c1';
  const token2 = generateQrToken(id2);

  const id3 = 'ord-pkd-003-77a9';
  const token3 = generateQrToken(id3);

  const id4 = 'ord-dlv-004-12e5';
  const token4 = generateQrToken(id4);

  ordersStore = [
    {
      id: id1,
      retailer_id: 'ret_northstar_01',
      customer_name: 'Maya Lin',
      customer_phone: '+1 (555) 438-9210',
      delivery_address: '452 Pinecrest Ave, Apt 3B, Downtown',
      item_description: 'Cold Brew Reserve & Single-Origin Beans (Qty: 2)',
      status: 'requested',
      assigned_rider_id: null,
      qr_token: token1,
      created_at: subMinutes(14),
      updated_at: subMinutes(14),
      status_history: [
        {
          id: 'hist-1',
          order_id: id1,
          status: 'requested',
          changed_by: 'ret_northstar_01',
          timestamp: subMinutes(14),
        },
      ],
    },
    {
      id: id2,
      retailer_id: 'ret_northstar_01',
      customer_name: 'Leo Sterling',
      customer_phone: '+1 (555) 892-1144',
      delivery_address: '1208 Harbor View Blvd, Suite 400',
      item_description: 'Artisan Sourdough & Truffle Butter Crate (Qty: 1)',
      status: 'assigned',
      assigned_rider_id: 'rider_alex_01',
      qr_token: token2,
      created_at: subMinutes(28),
      updated_at: subMinutes(19),
      status_history: [
        {
          id: 'hist-2-1',
          order_id: id2,
          status: 'requested',
          changed_by: 'ret_northstar_01',
          timestamp: subMinutes(28),
        },
        {
          id: 'hist-2-2',
          order_id: id2,
          status: 'assigned',
          changed_by: 'dispatcher (dispatcher_hq) -> rider_alex_01',
          timestamp: subMinutes(19),
        },
      ],
    },
    {
      id: id3,
      retailer_id: 'ret_northstar_01',
      customer_name: 'Elena Rostova',
      customer_phone: '+1 (555) 762-3301',
      delivery_address: '88 Willowbrook Road, Floor 2',
      item_description: 'Handcrafted Ramen Dinner Kit for Two (Qty: 1)',
      status: 'picked_up',
      assigned_rider_id: 'rider_sam_02',
      qr_token: token3,
      created_at: subMinutes(45),
      updated_at: subMinutes(12),
      status_history: [
        {
          id: 'hist-3-1',
          order_id: id3,
          status: 'requested',
          changed_by: 'ret_northstar_01',
          timestamp: subMinutes(45),
        },
        {
          id: 'hist-3-2',
          order_id: id3,
          status: 'assigned',
          changed_by: 'dispatcher (dispatcher_hq) -> rider_sam_02',
          timestamp: subMinutes(36),
        },
        {
          id: 'hist-3-3',
          order_id: id3,
          status: 'picked_up',
          changed_by: 'rider_sam_02',
          timestamp: subMinutes(12),
        },
      ],
    },
    {
      id: id4,
      retailer_id: 'ret_northstar_01',
      customer_name: 'Marcus Aurelius Thorne',
      customer_phone: '+1 (555) 901-4472',
      delivery_address: '300 Grand Avenue, Penthouse B',
      item_description: 'Botanical Immunity Elixirs (4-Pack)',
      status: 'delivered',
      assigned_rider_id: 'rider_alex_01',
      qr_token: token4,
      created_at: subMinutes(130),
      updated_at: subMinutes(52),
      status_history: [
        {
          id: 'hist-4-1',
          order_id: id4,
          status: 'requested',
          changed_by: 'ret_northstar_01',
          timestamp: subMinutes(130),
        },
        {
          id: 'hist-4-2',
          order_id: id4,
          status: 'assigned',
          changed_by: 'dispatcher (dispatcher_hq) -> rider_alex_01',
          timestamp: subMinutes(105),
        },
        {
          id: 'hist-4-3',
          order_id: id4,
          status: 'picked_up',
          changed_by: 'rider_alex_01',
          timestamp: subMinutes(80),
        },
        {
          id: 'hist-4-4',
          order_id: id4,
          status: 'delivered',
          changed_by: 'rider (rider_alex_01) [QR Scan Verified]',
          timestamp: subMinutes(52),
        },
      ],
    },
  ];
}

initSeedData();

// API Router Handlers
const handleGetCatalog = (req: express.Request, res: express.Response) => {
  res.json(catalogStore);
};

const handleGetOrders = (req: express.Request, res: express.Response) => {
  const { status, assigned_rider_id, retailer_id } = req.query;
  let results = [...ordersStore];

  if (status && typeof status === 'string') {
    results = results.filter((o) => o.status === status);
  }

  if (assigned_rider_id && typeof assigned_rider_id === 'string') {
    if (assigned_rider_id === 'me') {
      results = results.filter((o) => o.assigned_rider_id !== null);
    } else {
      results = results.filter((o) => o.assigned_rider_id === assigned_rider_id);
    }
  }

  if (retailer_id && typeof retailer_id === 'string') {
    results = results.filter((o) => o.retailer_id === retailer_id);
  }

  // sort newest first
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json(results);
};

const handleCreateOrder = (req: express.Request, res: express.Response) => {
  const { customer_name, customer_phone, delivery_address, item_description, retailer_id } = req.body;

  if (!customer_name || !customer_phone || !delivery_address || !item_description) {
    return res.status(400).json({ error: 'Missing required order fields' });
  }

  const orderId = `ord-${crypto.randomBytes(4).toString('hex')}-${crypto.randomBytes(2).toString('hex')}`;
  const qrToken = generateQrToken(orderId);
  const nowStr = new Date().toISOString();

  const newOrder: OrderRecord = {
    id: orderId,
    retailer_id: retailer_id || 'ret_northstar_01',
    customer_name,
    customer_phone,
    delivery_address,
    item_description,
    status: 'requested',
    assigned_rider_id: null,
    qr_token: qrToken,
    created_at: nowStr,
    updated_at: nowStr,
    status_history: [
      {
        id: `hist-${Date.now()}`,
        order_id: orderId,
        status: 'requested',
        changed_by: retailer_id || 'ret_northstar_01',
        timestamp: nowStr,
      },
    ],
  };

  ordersStore.unshift(newOrder);

  res.status(201).json({
    order: newOrder,
    customer_tracking_token: qrToken,
    tracking_url: `/track/${orderId}?token=${qrToken}`,
  });
};

const handleAssignOrder = (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { rider_id } = req.body;

  if (!rider_id) {
    return res.status(400).json({ error: 'rider_id is required' });
  }

  const order = ordersStore.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: `Order ${id} not found` });
  }

  if (order.status !== 'requested') {
    return res.status(400).json({
      error: `Cannot assign order with current status '${order.status}'. Must be 'requested'.`,
    });
  }

  const nowStr = new Date().toISOString();
  order.assigned_rider_id = rider_id;
  order.status = 'assigned';
  order.updated_at = nowStr;
  order.status_history.push({
    id: `hist-${Date.now()}`,
    order_id: order.id,
    status: 'assigned',
    changed_by: `dispatcher (dispatcher_hq) -> ${rider_id}`,
    timestamp: nowStr,
  });

  res.json(order);
};

const handleUpdateStatus = (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { status, changed_by } = req.body;

  const order = ordersStore.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: `Order ${id} not found` });
  }

  const legalTransitions: Record<string, string[]> = {
    requested: ['assigned', 'cancelled'],
    assigned: ['picked_up', 'cancelled'],
    picked_up: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
  };

  const allowed = legalTransitions[order.status] || [];
  if (!allowed.includes(status)) {
    return res.status(400).json({
      error: `Illegal state transition from '${order.status}' to '${status}'. Allowed: ${allowed.join(', ')}`,
    });
  }

  if (status === 'delivered') {
    return res.status(400).json({
      error: "Closing an order as 'delivered' requires QR scan confirmation via POST /orders/:id/confirm-scan",
    });
  }

  const nowStr = new Date().toISOString();
  order.status = status;
  order.updated_at = nowStr;
  order.status_history.push({
    id: `hist-${Date.now()}`,
    order_id: order.id,
    status,
    changed_by: changed_by || 'rider',
    timestamp: nowStr,
  });

  res.json(order);
};

const handleConfirmScan = (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { qr_token, rider_id } = req.body;

  const order = ordersStore.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: `Order ${id} not found` });
  }

  if (order.status === 'delivered') {
    return res.status(400).json({ error: 'Order has already been confirmed and delivered.' });
  }

  if (order.status !== 'picked_up' && order.status !== 'assigned') {
    return res.status(400).json({
      error: `Cannot confirm delivery for order in '${order.status}' state. Must be 'picked_up'.`,
    });
  }

  const isValidToken = verifyQrToken(id, qr_token) || order.qr_token === qr_token;
  if (!isValidToken) {
    return res.status(403).json({
      error: 'QR Token validation failed: token does not match order capability key or has been tampered with.',
    });
  }

  const nowStr = new Date().toISOString();
  order.status = 'delivered';
  order.updated_at = nowStr;
  order.status_history.push({
    id: `hist-${Date.now()}`,
    order_id: order.id,
    status: 'delivered',
    changed_by: `rider (${rider_id || order.assigned_rider_id || 'rider_on_duty'}) [QR Scan Verified]`,
    timestamp: nowStr,
  });

  res.json(order);
};

const handleTrackOrder = (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { token } = req.query;

  const order = ordersStore.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (!token || order.qr_token !== token) {
    return res.status(403).json({ error: 'Invalid or missing tracking token for this order' });
  }

  res.json({
    id: order.id,
    customer_name: order.customer_name,
    delivery_address: order.delivery_address,
    item_description: order.item_description,
    status: order.status,
    assigned_rider_id: order.assigned_rider_id,
    created_at: order.created_at,
    updated_at: order.updated_at,
    status_history: order.status_history,
  });
};

const handleGetSingleOrder = (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const order = ordersStore.find((o) => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
};

const handleResetDemo = (req: express.Request, res: express.Response) => {
  initSeedData();
  res.json({ status: 'ok', message: 'Demo data reseeded successfully', order_count: ordersStore.length });
};

// Register routes both with and without /api prefix for maximum compatibility
const registerRoutes = (prefix = '') => {
  app.get(`${prefix}/catalog`, handleGetCatalog);
  app.get(`${prefix}/products`, handleGetCatalog);
  app.get(`${prefix}/orders`, handleGetOrders);
  app.post(`${prefix}/orders`, handleCreateOrder);
  app.get(`${prefix}/orders/:id/track`, handleTrackOrder);
  app.get(`${prefix}/orders/:id`, handleGetSingleOrder);
  app.patch(`${prefix}/orders/:id/assign`, handleAssignOrder);
  app.patch(`${prefix}/orders/:id/status`, handleUpdateStatus);
  app.post(`${prefix}/orders/:id/confirm-scan`, handleConfirmScan);
  app.post(`${prefix}/reset-demo`, handleResetDemo);
  app.get(`${prefix}/health`, (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
};

registerRoutes('/api');
registerRoutes('');

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Northstar Reflex server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
