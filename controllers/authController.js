const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const register = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;
    
    console.log('Registration:', { fullName, email, phone });
    
    // Check if phone exists
    const existing = await query('SELECT id FROM users WHERE phone = ', [phone]);
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Phone already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user
    const result = await query(
      'INSERT INTO users (full_name, email, phone, password_hash) VALUES (, , , ) RETURNING id, full_name, email, phone',
      [fullName, email || null, phone, hashedPassword]
    );
    
    const user = result.rows[0];
    
    // Create wallet
    await query('INSERT INTO wallets (user_id, balance) VALUES (, 0)', [user.id]);
    
    // Generate token
    const token = generateToken(user.id);
    
    res.status(201).json({
      success: true,
      token: token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    
    let user;
    if (email) {
      const result = await query('SELECT * FROM users WHERE email = ', [email]);
      user = result.rows[0];
    }
    if (!user && phone) {
      const result = await query('SELECT * FROM users WHERE phone = ', [phone]);
      user = result.rows[0];
    }
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const token = generateToken(user.id);
    
    res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await query('SELECT id, full_name, email, phone FROM users WHERE id = ', [req.user.id]);
    const wallet = await query('SELECT balance FROM wallets WHERE user_id = ', [req.user.id]);
    res.json({ 
      success: true, 
      user: user.rows[0], 
      balance: wallet.rows[0]?.balance || 0 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { register, login, getMe };
