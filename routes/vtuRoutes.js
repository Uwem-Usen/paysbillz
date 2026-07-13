const express = require('express');
const router = express.Router();

// ============ TEST ROUTE ============
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: '✅ VTU routes are working!',
        timestamp: new Date().toISOString()
    });
});

// ============ PROVIDER STATUS ============
router.get('/provider-status', (req, res) => {
    res.json({
        success: true,
        data: {
            inlomax: { available: true, balance: 1500 },
            strongmb: { available: true, balance: 2500 }
        }
    });
});

// ============ DATA PLANS ============
router.get('/data-plans', (req, res) => {
    const allPlans = {
        MTN: [
            { serviceID: 'MTN_SME_500MB', name: '500MB SME', size: '500MB', price: 220, validity: '2 Days', type: 'SME', provider: 'Inlomax' },
            { serviceID: 'MTN_SME_1GB', name: '1GB SME', size: '1GB', price: 260, validity: '30 Days', type: 'SME', provider: 'StrongMB' },
            { serviceID: 'MTN_SME_2GB', name: '2GB SME', size: '2GB', price: 590, validity: '30 Days', type: 'SME', provider: 'Inlomax' },
            { serviceID: 'MTN_SME_5GB', name: '5GB SME', size: '5GB', price: 1150, validity: '14 Days', type: 'SME', provider: 'StrongMB' }
        ],
        GLO: [
            { serviceID: 'GLO_SME_500MB', name: '500MB SME', size: '500MB', price: 205, validity: '30 Days', type: 'SME', provider: 'Inlomax' },
            { serviceID: 'GLO_SME_1GB', name: '1GB SME', size: '1GB', price: 410, validity: '30 Days', type: 'SME', provider: 'StrongMB' }
        ],
        AIRTEL: [
            { serviceID: 'AIRTEL_SME_500MB', name: '500MB SME', size: '500MB', price: 210, validity: '2 Days', type: 'SME', provider: 'Inlomax' },
            { serviceID: 'AIRTEL_SME_1GB', name: '1GB SME', size: '1GB', price: 240, validity: '30 Days', type: 'SME', provider: 'StrongMB' }
        ],
        '9MOBILE': [
            { serviceID: '9MOBILE_SME_500MB', name: '500MB SME', size: '500MB', price: 190, validity: '30 Days', type: 'SME', provider: 'Inlomax' }
        ]
    };
    
    res.json({
        success: true,
        data: allPlans,
        total: 7,
        providers: {
            inlomax: { count: 4, available: true },
            strongmb: { count: 3, available: true }
        }
    });
});

// ============ BUY DATA ============
router.post('/buy-data', (req, res) => {
    const { serviceID, phoneNumber, provider, network } = req.body;
    
    if (!serviceID || !phoneNumber) {
        return res.status(400).json({
            success: false,
            message: 'Service ID and phone number are required'
        });
    }
    
    const reference = 'DATA_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    
    res.json({
        success: true,
        message: '✅ Data bundle purchased successfully!',
        reference: reference,
        plan: {
            serviceID: serviceID,
            provider: provider || 'Inlomax',
            network: network || 'MTN'
        },
        phoneNumber: phoneNumber,
        balance: 1000
    });
});

// ============ TRANSACTIONS ============
router.get('/transactions', (req, res) => {
    res.json({
        success: true,
        transactions: [
            {
                id: 1,
                type: 'data_purchase',
                description: 'MTN 500MB SME Data Bundle',
                amount: -220,
                created_at: new Date().toISOString()
            }
        ]
    });
});

module.exports = router;
