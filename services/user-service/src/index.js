// ============================================================
// USER SERVICE
// Responsibility: Register users, log them in, return a token
// Port: 3001
// ============================================================

require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_change_in_production';

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database Setup ---
// SQLite is used here for simplicity. In production, use Azure SQL or Cosmos DB.
const db = new Database(path.join(__dirname, '../data/users.db'));

// Create the users table if it does not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// --- Routes ---

// Health check - used by Kubernetes to verify the service is alive
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

// POST /users/register - Create a new user account
app.post('/users/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }

  // Hash the password so we never store it in plain text
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(name, email, hashedPassword);
    res.status(201).json({ message: 'User created', userId: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /users/login - Authenticate and get a JWT token
app.post('/users/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Sign a JWT token - the frontend will send this token with every request
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, userId: user.id, name: user.name });
});

// GET /users/:id - Get a user's public profile
app.get('/users/:id', (req, res) => {
  const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
