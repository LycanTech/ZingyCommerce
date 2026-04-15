// ============================================================
// PRODUCT SERVICE
// Responsibility: List, create, update and delete products
// Port: 3002
// ============================================================

require('dotenv').config();
const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database Setup ---
const db = new Database(path.join(__dirname, '../data/products.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed some sample products on first run
const count = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (count.count === 0) {
  const insert = db.prepare(
    'INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insert.run('Wireless Headphones', 'Premium noise-cancelling headphones', 99.99, 50, 'Electronics', 'https://picsum.photos/seed/headphones/300/200');
  insert.run('Running Shoes', 'Lightweight trail running shoes', 59.99, 100, 'Footwear', 'https://picsum.photos/seed/shoes/300/200');
  insert.run('Coffee Maker', '12-cup programmable coffee maker', 49.99, 30, 'Kitchen', 'https://picsum.photos/seed/coffee/300/200');
  insert.run('Yoga Mat', 'Non-slip eco-friendly yoga mat', 29.99, 75, 'Sports', 'https://picsum.photos/seed/yoga/300/200');
  insert.run('Backpack', '30L waterproof hiking backpack', 79.99, 40, 'Outdoor', 'https://picsum.photos/seed/backpack/300/200');
}

// --- Routes ---

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'product-service' });
});

// GET /products - Get all products (supports ?category= and ?search= filters)
app.get('/products', (req, res) => {
  const { category, search } = req.query;
  let query = 'SELECT * FROM products';
  const params = [];

  if (category && search) {
    query += ' WHERE category = ? AND name LIKE ?';
    params.push(category, `%${search}%`);
  } else if (category) {
    query += ' WHERE category = ?';
    params.push(category);
  } else if (search) {
    query += ' WHERE name LIKE ?';
    params.push(`%${search}%`);
  }

  const products = db.prepare(query).all(...params);
  res.json(products);
});

// GET /products/:id - Get a single product by ID
app.get('/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST /products - Create a new product
app.post('/products', (req, res) => {
  const { name, description, price, stock, category, image_url } = req.body;
  if (!name || price === undefined || stock === undefined) {
    return res.status(400).json({ error: 'name, price, and stock are required' });
  }
  const stmt = db.prepare(
    'INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(name, description, price, stock, category, image_url);
  res.status(201).json({ message: 'Product created', productId: result.lastInsertRowid });
});

// PUT /products/:id - Update a product
app.put('/products/:id', (req, res) => {
  const { name, description, price, stock, category, image_url } = req.body;
  const stmt = db.prepare(
    'UPDATE products SET name=?, description=?, price=?, stock=?, category=?, image_url=? WHERE id=?'
  );
  const result = stmt.run(name, description, price, stock, category, image_url, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
  res.json({ message: 'Product updated' });
});

// DELETE /products/:id - Remove a product
app.delete('/products/:id', (req, res) => {
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
  res.json({ message: 'Product deleted' });
});

// PATCH /products/:id/stock - Reduce stock when an order is placed
app.patch('/products/:id/stock', (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'quantity must be >= 1' });

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.stock < quantity) return res.status(409).json({ error: 'Insufficient stock' });

  db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(quantity, req.params.id);
  res.json({ message: 'Stock updated', remaining: product.stock - quantity });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
});
