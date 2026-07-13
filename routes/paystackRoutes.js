const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;

// Initialize payment
router.post('/initialize', protect, async (req, res) => {
    try {
        const { email, amount } = req.body;
        
        if (!email || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Email and amount are required'
            });
        }
        
        if (amount < 100) {
            return res.status(400).json({
                success: false,
                message: 'Minimum amount is ₦100'
            });
        }
        
        const reference = 'PAY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8);
        
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email: email,
                amount: amount * 100,
                reference: reference
            },
            {
                headers: {
                    'Authorization': 'Bearer ' + PAYSTACK_SECRET_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.data.status) {
            res.json({
                success: true,
                message: 'Payment initialized',
                data: {
                    authorization_url: response.data.data.authorization_url,
                    reference: reference
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: response.data.message || 'Payment initialization failed'
            });
        }
        
    } catch (error) {
        console.error('❌ Paystack error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Payment initialization failed'
        });
    }
});

// Verify payment
router.get('/verify/:reference', protect, async (req, res) => {
    try {
        const { reference } = req.params;
        
        const response = await axios.get(
            'https://api.paystack.co/transaction/verify/' + reference,
            {
                headers: {
                    'Authorization': 'Bearer ' + PAYSTACK_SECRET_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.data.status && response.data.data.status === 'success') {
            res.json({
                success: true,
                message: 'Payment verified',
                data: {
                    reference: response.data.data.reference,
                    amount: response.data.data.amount / 100,
                    status: response.data.data.status
                }
            });
        } else {
            res.json({
                success: false,
                message: 'Payment not successful'
            });
        }
        
    } catch (error) {
        console.error('❌ Verify error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Verification failed'
        });
    }
});

module.exports = router;
