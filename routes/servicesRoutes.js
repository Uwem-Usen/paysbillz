const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// ============ AIRTIME ============
router.post('/airtime/buy', protect, (req, res) => {
    try {
        const { phone, network, amount } = req.body;
        
        if (!phone || !network || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Phone number, network, and amount are required'
            });
        }
        
        if (amount < 50 || amount > 500000) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be between ₦50 and ₦500,000'
            });
        }
        
        const cost = amount * 0.95;
        const profit = amount * 0.05;
        const reference = 'AIR_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        
        res.json({
            success: true,
            message: '✅ Airtime purchased successfully!',
            reference: reference,
            data: {
                phone: phone,
                network: network,
                amount: amount,
                cost: Math.round(cost),
                profit: Math.round(profit),
                status: 'completed'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Airtime purchase failed: ' + error.message
        });
    }
});

// ============ TV SUBSCRIPTION ============
router.post('/tv/subscribe', protect, (req, res) => {
    try {
        const { provider, smartCardNumber, package: pkg, amount } = req.body;
        
        if (!provider || !smartCardNumber || !pkg) {
            return res.status(400).json({
                success: false,
                message: 'Provider, smart card number, and package are required'
            });
        }
        
        const cost = amount * 0.90;
        const profit = amount * 0.10;
        const reference = 'TV_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        
        res.json({
            success: true,
            message: '✅ TV subscription purchased successfully!',
            reference: reference,
            data: {
                provider: provider,
                smartCardNumber: smartCardNumber,
                package: pkg,
                amount: amount,
                cost: Math.round(cost),
                profit: Math.round(profit),
                status: 'completed'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'TV subscription failed: ' + error.message
        });
    }
});

// ============ ELECTRICITY ============
router.post('/electricity/pay', protect, (req, res) => {
    try {
        const { provider, meterNumber, amount, meterType } = req.body;
        
        if (!provider || !meterNumber || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Provider, meter number, and amount are required'
            });
        }
        
        const cost = amount * 0.95;
        const profit = amount * 0.05;
        const reference = 'ELEC_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        
        res.json({
            success: true,
            message: '✅ Electricity payment successful!',
            reference: reference,
            data: {
                provider: provider,
                meterNumber: meterNumber,
                meterType: meterType || 'prepaid',
                amount: amount,
                cost: Math.round(cost),
                profit: Math.round(profit),
                status: 'completed'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Electricity payment failed: ' + error.message
        });
    }
});

// ============ EDUCATION ============
router.post('/education/buy-pin', protect, (req, res) => {
    try {
        const { exam, quantity, amount } = req.body;
        
        if (!exam || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Exam type and quantity are required'
            });
        }
        
        const cost = amount * 0.85;
        const profit = amount * 0.15;
        const reference = 'EDU_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        
        const pins = [];
        for (let i = 0; i < quantity; i++) {
            pins.push({
                pin: 'PIN-' + Math.random().toString(36).substr(2, 10).toUpperCase(),
                serial: 'SER-' + Math.random().toString(36).substr(2, 8).toUpperCase()
            });
        }
        
        res.json({
            success: true,
            message: '✅ Education pins purchased successfully!',
            reference: reference,
            data: {
                exam: exam,
                quantity: quantity,
                amount: amount,
                cost: Math.round(cost),
                profit: Math.round(profit),
                pins: pins,
                status: 'completed'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Education pin purchase failed: ' + error.message
        });
    }
});

// ============ BETTING ============
router.post('/betting/fund', protect, (req, res) => {
    try {
        const { provider, username, amount } = req.body;
        
        if (!provider || !username || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Provider, username, and amount are required'
            });
        }
        
        const cost = amount * 0.97;
        const profit = amount * 0.03;
        const reference = 'BET_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        
        res.json({
            success: true,
            message: '✅ Betting wallet funded successfully!',
            reference: reference,
            data: {
                provider: provider,
                username: username,
                amount: amount,
                cost: Math.round(cost),
                profit: Math.round(profit),
                status: 'completed'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Betting funding failed: ' + error.message
        });
    }
});

module.exports = router;
