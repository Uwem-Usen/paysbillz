// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'paysbillz-secret-key-2024';

// Simple user database (replace with real database in production)
const users = {
    '08012345678': {
        phone: '08012345678',
        password: 'password123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin'
    },
    '08098765432': {
        phone: '08098765432',
        password: 'customer123',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'customer'
    }
};

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { phone: user.phone, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Verify JWT token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Middleware: Protect routes
const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token'
        });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, invalid token'
        });
    }
    
    req.user = decoded;
    next();
};

// Middleware: Only admin
const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }
    next();
};

// Get user by phone
const getUserByPhone = (phone) => {
    return users[phone] || null;
};

// Create or update user
const createUser = (phone, password, name, email) => {
    if (users[phone]) {
        return null;
    }
    users[phone] = {
        phone,
        password,
        name: name || 'User',
        email: email || '',
        role: 'customer'
    };
    return users[phone];
};

module.exports = {
    generateToken,
    verifyToken,
    protect,
    adminOnly,
    getUserByPhone,
    createUser,
    users
};
