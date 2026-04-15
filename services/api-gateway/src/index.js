// ============================================================
// API GATEWAY
// Responsibility:
//   - Single public entry point for ALL requests
//   - Routes /users/* → user-service
//   - Routes /products/* → product-service
//   - Routes /orders/* → order-service (protected, requires JWT)
//   - Logs every incoming request
// Port: 3000
// ============================================================

require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_change_in_production';

// Service URLs — in Kubernetes these will be internal service names
const USER_SERVICE    = process.env.USER_SERVICE_URL    || 'http://localhost:3001';
const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
const ORDER_SERVICE   = process.env.ORDER_SERVICE_URL   || 'http://localhost:3003';

// --- Middleware ---
app.use(cors());
app.use(morgan('combined'));   // Logs: method, path, status, response time

// -------------------------------------------------------
// JWT Authentication Middleware
// Used on protected routes (orders).
// It reads the "Authorization: Bearer <token>" header,
// verifies the token, and attaches the user info to req.
// -------------------------------------------------------
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });

  const token = authHeader.split(' ')[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ error: 'Token missing' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.headers['x-user-id'] = decoded.userId;  // Pass user info to downstream service
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// --- Health Check ---
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    routes: {
      users:    USER_SERVICE,
      products: PRODUCT_SERVICE,
      orders:   ORDER_SERVICE,
    },
  });
});

// --- Proxy Routes ---

// Public: /users/** → user-service (register and login are public)
app.use('/users', createProxyMiddleware({
  target: USER_SERVICE,
  changeOrigin: true,
  on: {
    error: (err, req, res) => res.status(502).json({ error: 'User service unavailable' }),
  },
}));

// Public: /products/** → product-service (browsing products is public)
app.use('/products', createProxyMiddleware({
  target: PRODUCT_SERVICE,
  changeOrigin: true,
  on: {
    error: (err, req, res) => res.status(502).json({ error: 'Product service unavailable' }),
  },
}));

// Protected: /orders/** → order-service (must be logged in)
app.use('/orders', authenticate, createProxyMiddleware({
  target: ORDER_SERVICE,
  changeOrigin: true,
  on: {
    error: (err, req, res) => res.status(502).json({ error: 'Order service unavailable' }),
  },
}));

// Catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`  /users    → ${USER_SERVICE}`);
  console.log(`  /products → ${PRODUCT_SERVICE}`);
  console.log(`  /orders   → ${ORDER_SERVICE} (JWT protected)`);
});
