const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Wallet = require('../models/Wallet');

// Get wallet balance
router.get('/balance', protect, async (req, res) => {
  try {
    const balance = await Wallet.getBalance(req.user.id);
    res.json({ success: true, balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;