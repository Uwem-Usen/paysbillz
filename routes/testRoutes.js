const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Wallet = require('../models/Wallet');
const { query } = require('../config/database');

// ONLY FOR TESTING - Add fake money to wallet
router.post('/add-money', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid amount is required' 
      });
    }
    
    const reference = `TEST_${Date.now()}`;
    const result = await Wallet.credit(req.user.id, amount, 'test_funding', reference);
    
    res.json({
      success: true,
      message: `₦${amount} added to your wallet (TEST MODE)`,
      balance: result.balance
    });
  } catch (error) {
    console.error('Test fund error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;