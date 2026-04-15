// ============================================================
// ORDER SERVICE
// Responsibility: Place orders, track order status
// Port: 3003
// ============================================================

require('dotenv').config();
const express = require('express');
const Database = require('better-sqlite3');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3003;

// The order service calls the product service to check stock
// In Kubernetes, services talk to each other by service name
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database Setup ---
const db = new Database(path.join(__dirname, '../data/orders.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    total REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );
`);

// --- Routes ---

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'order-service' });
});

// GET /orders - Get all orders (admin) or filter by user
app.get('/orders', (req, res) => {
  const { userId } = req.query;
  let query = 'SELECT * FROM orders';
  const params = [];
  if (userId) {
    query += ' WHERE user_id = ?';
    params.push(userId);
  }
  query += ' ORDER BY created_at DESC';
  const orders = db.prepare(query).all(...params);

  // Attach line items to each order
  const withItems = orders.map(order => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    return { ...order, items };
  });

  res.json(withItems);
});

// GET /orders/:id - Get a single order with its items
app.get('/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items });
});

// POST /orders - Place a new order
// Body: { userId, items: [{ productId, productName, quantity, unitPrice }] }
app.post('/orders', async (req, res) => {
  const { userId, items } = req.body;

  if (!userId || !items || items.length === 0) {
    return res.status(400).json({ error: 'userId and at least one item are required' });
  }

  // Calculate total
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  // Try to reserve stock for each item by calling the product service
  try {
    for (const item of items) {
      await axios.patch(`${PRODUCT_SERVICE_URL}/products/${item.productId}/stock`, {
        quantity: item.quantity,
      });
    }
  } catch (err) {
    const msg = err.response?.data?.error || 'Stock reservation failed';
    return res.status(409).json({ error: msg });
  }

  // All stock reserved — create the order in a transaction
  const createOrder = db.transaction(() => {
    const orderResult = db
      .prepare('INSERT INTO orders (user_id, status, total) VALUES (?, ?, ?)')
      .run(userId, 'confirmed', total);

    const orderId = orderResult.lastInsertRowid;
    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)'
    );

    for (const item of items) {
      insertItem.run(orderId, item.productId, item.productName, item.quantity, item.unitPrice);
    }

    return orderId;
  });

  const orderId = createOrder();
  res.status(201).json({ message: 'Order placed', orderId, total });
});

// PATCH /orders/:id/status - Update order status (e.g., shipped, delivered, cancelled)
app.patch('/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
  }
  const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Order not found' });
  res.json({ message: 'Order status updated', status });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});
