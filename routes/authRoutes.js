const express = require('express');
const router = express.Router();
const { generateToken, getUserByPhone, createUser, users } = require('../middleware/auth');

// ============ LOGIN ============
router.post('/login', (req, res) => {
    try {
        const { phone, password } = req.body;
        
        console.log('📡 Login attempt:', { phone });
        
        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and password are required'
            });
        }
        
        const user = getUserByPhone(phone);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid phone number or password'
            });
        }
        
        if (user.password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid phone number or password'
            });
        }
        
        const token = generateToken(user);
        
        res.json({
            success: true,
            message: 'Login successful!',
            token: token,
            user: {
                phone: user.phone,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed: ' + error.message
        });
    }
});

// ============ REGISTER ============
router.post('/register', (req, res) => {
    try {
        const { phone, password, name, email } = req.body;
        
        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and password are required'
            });
        }
        
        if (phone.length < 10 || phone.length > 11) {
            return res.status(400).json({
                success: false,
                message: 'Phone number must be 10-11 digits'
            });
        }
        
        const existingUser = getUserByPhone(phone);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this phone number'
            });
        }
        
        const newUser = createUser(phone, password, name, email);
        
        if (!newUser) {
            return res.status(400).json({
                success: false,
                message: 'Registration failed'
            });
        }
        
        const token = generateToken(newUser);
        
        res.json({
            success: true,
            message: 'Registration successful!',
            token: token,
            user: {
                phone: newUser.phone,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
        
    } catch (error) {
        console.error('❌ Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed: ' + error.message
        });
    }
});

module.exports = router;
