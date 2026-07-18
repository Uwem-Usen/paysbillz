const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL Connection
const pool = new Pool({
  user: 'postgres',
  password: 'postgres123',
  host: 'localhost',
  port: 5432,
  database: 'postgres',
});

pool.connect((err) => {
  if (err) {
    console.error('DB error:', err.message);
  } else {
    console.log('✅ Database connected');
  }
});

// ============================================
// USER AUTHENTICATION
// ============================================

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Registration:', req.body);
    const { fullName, email, phone, password } = req.body;
    
    // Validate required fields
    if (!fullName || !phone || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Full name, phone, and password are required' 
      });
    }
    
    // Check if phone exists
    const check = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (check.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone already registered' 
      });
    }
    
    // Check if email exists (if provided)
    if (email) {
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already registered' 
        });
      }
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user with all required fields
    const result = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, is_active, is_verified) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, full_name, email, phone, is_active, is_verified`,
      [fullName, email || 'no-email@example.com', phone, hashedPassword, true, false]
    );
    
    const user = result.rows[0];
    
    // Create wallet for user
    await pool.query('INSERT INTO wallets (user_id, balance) VALUES ($1, $2)', [user.id, 0]);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, phone: user.phone }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '30d' }
    );
    
    res.json({ 
      success: true, 
      token, 
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        isActive: user.is_active,
        isVerified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed: ' + error.message 
    });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login:', req.body);
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone and password are required' 
      });
    }
    
    // Find user by phone
    const result = await pool.query(
      'SELECT id, full_name, email, phone, password_hash, is_active, is_verified FROM users WHERE phone = $1',
      [phone]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid phone or password' 
      });
    }
    
    const user = result.rows[0];
    
    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is deactivated. Please contact support.' 
      });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid phone or password' 
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, phone: user.phone }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '30d' }
    );
    
    res.json({ 
      success: true, 
      token, 
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        isActive: user.is_active,
        isVerified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed: ' + error.message 
    });
  }
});

// ============================================
// MIDDLEWARE: Verify Token
// ============================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.userId = decoded.id;
    next();
  });
};

// ============================================
// PROTECTED ROUTES (Require Authentication)
// ============================================

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, phone, is_active, is_verified, created_at 
       FROM users WHERE id = $1`,
      [req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get wallet balance
app.get('/api/wallet/balance', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, user_id, balance FROM wallets WHERE user_id = $1',
      [req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Wallet not found' 
      });
    }
    
    res.json({ 
      success: true, 
      balance: result.rows[0].balance 
    });
  } catch (error) {
    console.error('Wallet error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ============================================
// DATABASE SETUP (Run this once)
// ============================================
async function setupDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table ready');
    
    // Create wallets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        balance DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Wallets table ready');
    
    // Create transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        description TEXT,
        reference VARCHAR(100) UNIQUE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Transactions table ready');
  } catch (error) {
    console.error('Setup error:', error.message);
  }
}

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Paysbillz API is running',
    time: new Date().toISOString()
  });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await setupDatabase();
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});