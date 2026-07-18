// server.js - Paysbillz Backend
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

// Load business details
const BUSINESS_NAME = process.env.BUSINESS_NAME || 'Bulk Affairs Global Services LTD';
const BUSINESS_RC = process.env.BUSINESS_RC || '7630867';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'bulkaffairsglobal@gmail.com';

console.log(`🏢 ${BUSINESS_NAME}`);
console.log(`📧 Admin: ${ADMIN_EMAIL}`);

// Import services
const strongmbService = require('./services/strongmb');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ============================================
// SIMPLE IN-MEMORY DATABASE
// ============================================
const users = [];
const wallets = [];
const transactions = [];
let userIdCounter = 1;
let walletIdCounter = 1;
let transactionIdCounter = 1;

// Create default user
const defaultUser = {
  id: userIdCounter++,
  full_name: 'John Doe',
  email: 'john@example.com',
  phone: '08012345678',
  password_hash: bcrypt.hashSync('password123', 10),
  is_active: true,
  is_verified: true,
  referral_code: 'REF123456',
  created_at: new Date().toISOString()
};
users.push(defaultUser);

const defaultWallet = {
  id: walletIdCounter++,
  user_id: defaultUser.id,
  balance: 1000,
  created_at: new Date().toISOString()
};
wallets.push(defaultWallet);

console.log('✅ Using in-memory database');
console.log('📝 Default user created: 08012345678 / password123');

// ============================================
// MIDDLEWARE: Authenticate Token
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
    req.userId = decoded.userId;
    next();
  });
};

// ============================================
// ROOT ROUTE
// ============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, phone, and password are required'
      });
    }

    const existingUser = users.find(u => u.phone === phone);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Phone already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: userIdCounter++,
      full_name: fullName,
      email: email || null,
      phone: phone,
      password_hash: hashedPassword,
      is_active: true,
      is_verified: true,
      referral_code: 'REF' + Date.now().toString(36).toUpperCase(),
      created_at: new Date().toISOString()
    };
    users.push(newUser);

    const newWallet = {
      id: walletIdCounter++,
      user_id: newUser.id,
      balance: 0,
      created_at: new Date().toISOString()
    };
    wallets.push(newWallet);

    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone,
        referralCode: newUser.referral_code
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone and password are required'
      });
    }

    const user = users.find(u => u.phone === phone);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone or password'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone or password'
      });
    }

    const token = jwt.sign(
      { userId: user.id },
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
        referralCode: user.referral_code
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// USER PROFILE
// ============================================
app.get('/api/user/profile', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        isActive: user.is_active,
        isVerified: user.is_verified,
        referralCode: user.referral_code,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('❌ Profile error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// WALLET BALANCE
// ============================================
app.get('/api/wallet/balance', authenticateToken, (req, res) => {
  try {
    const wallet = wallets.find(w => w.user_id === req.userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    res.json({
      success: true,
      balance: wallet.balance,
      walletId: wallet.id
    });
  } catch (error) {
    console.error('❌ Wallet balance error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// TRANSACTIONS
// ============================================
app.get('/api/transactions', authenticateToken, (req, res) => {
  try {
    const userTransactions = transactions.filter(t => t.user_id === req.userId);
    
    res.json({
      success: true,
      transactions: userTransactions.slice(0, 50),
      total: userTransactions.length,
      limit: 50,
      offset: 0
    });
  } catch (error) {
    console.error('❌ Transactions error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// FUND WALLET (Direct - Test Mode)
// ============================================
app.post('/api/wallet/direct-fund', authenticateToken, (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.userId;

    console.log(`💰 Funding wallet for user ${userId}: ₦${amount}`);

    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least ₦100'
      });
    }

    const wallet = wallets.find(w => w.user_id === userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    wallet.balance += amount;

    const transaction = {
      id: transactionIdCounter++,
      user_id: userId,
      wallet_id: wallet.id,
      type: 'funding',
      amount: amount,
      description: 'Wallet funding (Test Mode)',
      reference: 'FUND_' + Date.now(),
      status: 'success',
      service_type: 'funding',
      created_at: new Date().toISOString()
    };
    transactions.push(transaction);

    console.log(`✅ Wallet funded successfully. New balance: ₦${wallet.balance}`);

    res.json({
      success: true,
      message: `✅ ₦${amount} added to wallet`,
      data: {
        amount: amount,
        reference: transaction.reference,
        newBalance: wallet.balance
      }
    });
  } catch (error) {
    console.error('❌ Fund wallet error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add money'
    });
  }
});

// ============================================
// DATA PLANS - MOCK DATA
// ============================================
app.get('/api/data/plans', authenticateToken, (req, res) => {
  try {
    const mockData = {
      'MTN': [
        { serviceID: 'MTN_500MB', name: '500MB', price: 220, validity: '2 Days', type: 'SME' },
        { serviceID: 'MTN_1GB', name: '1GB', price: 260, validity: '1 Day', type: 'SME' },
        { serviceID: 'MTN_2.5GB', name: '2.5GB', price: 590, validity: '1 Day', type: 'SME' },
        { serviceID: 'MTN_5GB', name: '5GB', price: 1150, validity: '14 Days', type: 'SME' },
        { serviceID: 'MTN_10GB', name: '10GB', price: 3500, validity: '30 Days', type: 'SME' },
      ],
      'GLO': [
        { serviceID: 'GLO_500MB', name: '500MB', price: 205, validity: '30 Days', type: 'CORPORATE GIFTING' },
        { serviceID: 'GLO_1GB', name: '1GB', price: 410, validity: '30 Days', type: 'CORPORATE GIFTING' },
        { serviceID: 'GLO_2GB', name: '2GB', price: 820, validity: '30 Days', type: 'CORPORATE GIFTING' },
      ],
      'AIRTEL': [
        { serviceID: 'AIRTEL_500MB', name: '500MB', price: 210, validity: '2 Days', type: 'SME' },
        { serviceID: 'AIRTEL_1GB', name: '1GB', price: 240, validity: '1 Day', type: 'SME' },
        { serviceID: 'AIRTEL_3GB', name: '3GB', price: 580, validity: '7 Days', type: 'SME' },
      ],
      '9MOBILE': [
        { serviceID: '9MOBILE_500MB', name: '500MB', price: 190, validity: '3 Days', type: 'SME' },
        { serviceID: '9MOBILE_1GB', name: '1GB', price: 230, validity: '1 Day', type: 'SME' },
      ]
    };

    res.json({
      success: true,
      data: mockData,
      cached: false,
      total: Object.values(mockData).reduce((acc, plans) => acc + plans.length, 0)
    });
  } catch (error) {
    console.error('❌ Data plans error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// BUY DATA
// ============================================
app.post('/api/data/buy', authenticateToken, (req, res) => {
  try {
    const { serviceID, phoneNumber } = req.body;

    if (!serviceID || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'serviceID and phoneNumber are required'
      });
    }

    const wallet = wallets.find(w => w.user_id === req.userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    const allPlans = {
      'MTN': [
        { serviceID: 'MTN_500MB', name: '500MB', price: 220 },
        { serviceID: 'MTN_1GB', name: '1GB', price: 260 },
        { serviceID: 'MTN_2.5GB', name: '2.5GB', price: 590 },
        { serviceID: 'MTN_5GB', name: '5GB', price: 1150 },
        { serviceID: 'MTN_10GB', name: '10GB', price: 3500 },
      ],
      'GLO': [
        { serviceID: 'GLO_500MB', name: '500MB', price: 205 },
        { serviceID: 'GLO_1GB', name: '1GB', price: 410 },
        { serviceID: 'GLO_2GB', name: '2GB', price: 820 },
      ],
      'AIRTEL': [
        { serviceID: 'AIRTEL_500MB', name: '500MB', price: 210 },
        { serviceID: 'AIRTEL_1GB', name: '1GB', price: 240 },
        { serviceID: 'AIRTEL_3GB', name: '3GB', price: 580 },
      ],
      '9MOBILE': [
        { serviceID: '9MOBILE_500MB', name: '500MB', price: 190 },
        { serviceID: '9MOBILE_1GB', name: '1GB', price: 230 },
      ]
    };

    let planPrice = 0;
    let planName = '';
    for (const network in allPlans) {
      const plan = allPlans[network].find(p => p.serviceID === serviceID);
      if (plan) {
        planPrice = plan.price;
        planName = plan.name;
        break;
      }
    }

    if (!planPrice) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    if (wallet.balance < planPrice) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Need ₦${planPrice}. You have ₦${wallet.balance}`
      });
    }

    wallet.balance -= planPrice;

    const transaction = {
      id: transactionIdCounter++,
      user_id: req.userId,
      wallet_id: wallet.id,
      type: 'purchase',
      amount: planPrice,
      description: `${planName} data for ${phoneNumber}`,
      reference: 'DATA_' + Date.now(),
      status: 'success',
      service_type: 'data',
      created_at: new Date().toISOString()
    };
    transactions.push(transaction);

    res.json({
      success: true,
      message: `✅ ${planName} data sent to ${phoneNumber}`,
      data: {
        reference: transaction.reference,
        amount: planPrice,
        plan: planName,
        phoneNumber,
        newBalance: wallet.balance
      }
    });
  } catch (error) {
    console.error('❌ Data purchase error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// AIRTIME
// ============================================
app.post('/api/airtime/buy', authenticateToken, (req, res) => {
  try {
    const { phoneNumber, amount } = req.body;

    if (!phoneNumber || !amount) {
      return res.status(400).json({
        success: false,
        message: 'phoneNumber and amount are required'
      });
    }

    const amountNum = parseFloat(amount);
    const wallet = wallets.find(w => w.user_id === req.userId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    if (wallet.balance < amountNum) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Need ₦${amountNum}. You have ₦${wallet.balance}`
      });
    }

    wallet.balance -= amountNum;

    const transaction = {
      id: transactionIdCounter++,
      user_id: req.userId,
      wallet_id: wallet.id,
      type: 'purchase',
      amount: amountNum,
      description: `Airtime purchase for ${phoneNumber}`,
      reference: 'AIR_' + Date.now(),
      status: 'success',
      service_type: 'airtime',
      created_at: new Date().toISOString()
    };
    transactions.push(transaction);

    res.json({
      success: true,
      message: `✅ Airtime of ₦${amountNum} sent to ${phoneNumber}`,
      data: {
        reference: transaction.reference,
        amount: amountNum,
        phoneNumber,
        newBalance: wallet.balance
      }
    });
  } catch (error) {
    console.error('❌ Airtime purchase error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// ELECTRICITY
// ============================================
app.post('/api/electricity/pay', authenticateToken, (req, res) => {
  try {
    const { meterNumber, amount, disco } = req.body;

    if (!meterNumber || !amount || !disco) {
      return res.status(400).json({
        success: false,
        message: 'meterNumber, amount, and disco are required'
      });
    }

    const amountNum = parseFloat(amount);
    const wallet = wallets.find(w => w.user_id === req.userId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    if (wallet.balance < amountNum) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Need ₦${amountNum}. You have ₦${wallet.balance}`
      });
    }

    wallet.balance -= amountNum;

    const transaction = {
      id: transactionIdCounter++,
      user_id: req.userId,
      wallet_id: wallet.id,
      type: 'purchase',
      amount: amountNum,
      description: `Electricity payment for ${meterNumber} (${disco})`,
      reference: 'ELEC_' + Date.now(),
      status: 'success',
      service_type: 'electricity',
      created_at: new Date().toISOString()
    };
    transactions.push(transaction);

    res.json({
      success: true,
      message: `✅ Electricity bill of ₦${amountNum} paid for meter ${meterNumber}`,
      data: {
        reference: transaction.reference,
        amount: amountNum,
        meterNumber,
        disco,
        newBalance: wallet.balance
      }
    });
  } catch (error) {
    console.error('❌ Electricity payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// CABLE TV
// ============================================
app.post('/api/cable/subscribe', authenticateToken, (req, res) => {
  try {
    const { smartCardNumber, packageName, amount } = req.body;

    if (!smartCardNumber || !packageName || !amount) {
      return res.status(400).json({
        success: false,
        message: 'smartCardNumber, packageName, and amount are required'
      });
    }

    const amountNum = parseFloat(amount);
    const wallet = wallets.find(w => w.user_id === req.userId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    if (wallet.balance < amountNum) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Need ₦${amountNum}. You have ₦${wallet.balance}`
      });
    }

    wallet.balance -= amountNum;

    const transaction = {
      id: transactionIdCounter++,
      user_id: req.userId,
      wallet_id: wallet.id,
      type: 'purchase',
      amount: amountNum,
      description: `Cable subscription for ${smartCardNumber} (${packageName})`,
      reference: 'CABLE_' + Date.now(),
      status: 'success',
      service_type: 'cable',
      created_at: new Date().toISOString()
    };
    transactions.push(transaction);

    res.json({
      success: true,
      message: `✅ ${packageName} subscription for ${smartCardNumber}`,
      data: {
        reference: transaction.reference,
        amount: amountNum,
        package: packageName,
        smartCardNumber,
        newBalance: wallet.balance
      }
    });
  } catch (error) {
    console.error('❌ Cable subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// EDUCATION (WAEC)
// ============================================
app.post('/api/education/waec', authenticateToken, (req, res) => {
  try {
    const { quantity } = req.body;
    const amountPerPin = 1500;
    const amount = (quantity || 1) * amountPerPin;
    const wallet = wallets.find(w => w.user_id === req.userId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Need ₦${amount}. You have ₦${wallet.balance}`
      });
    }

    wallet.balance -= amount;

    const transaction = {
      id: transactionIdCounter++,
      user_id: req.userId,
      wallet_id: wallet.id,
      type: 'purchase',
      amount: amount,
      description: `${quantity || 1} WAEC PIN(s)`,
      reference: 'WAEC_' + Date.now(),
      status: 'success',
      service_type: 'education',
      created_at: new Date().toISOString()
    };
    transactions.push(transaction);

    res.json({
      success: true,
      message: `✅ ${quantity || 1} WAEC PIN(s) purchased successfully!`,
      data: {
        quantity: quantity || 1,
        amount: amount,
        reference: transaction.reference,
        pins: Array.from({ length: quantity || 1 }, (_, i) => ({
          pin: `WAEC${Date.now()}${i}`,
          serial: `SER${Date.now()}${i}`
        })),
        newBalance: wallet.balance
      }
    });
  } catch (error) {
    console.error('❌ WAEC purchase error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// BETTING
// ============================================
app.post('/api/betting/deposit', authenticateToken, (req, res) => {
  try {
    const { platform, amount, customerId } = req.body;

    if (!platform || !amount || !customerId) {
      return res.status(400).json({
        success: false,
        message: 'Platform, amount, and customerId are required'
      });
    }

    const amountNum = parseFloat(amount);
    const wallet = wallets.find(w => w.user_id === req.userId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    if (wallet.balance < amountNum) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Need ₦${amountNum}. You have ₦${wallet.balance}`
      });
    }

    wallet.balance -= amountNum;

    const transaction = {
      id: transactionIdCounter++,
      user_id: req.userId,
      wallet_id: wallet.id,
      type: 'purchase',
      amount: amountNum,
      description: `Betting deposit to ${platform} (${customerId})`,
      reference: 'BET_' + Date.now(),
      status: 'success',
      service_type: 'betting',
      created_at: new Date().toISOString()
    };
    transactions.push(transaction);

    res.json({
      success: true,
      message: `✅ ₦${amountNum} deposited to ${platform}`,
      data: {
        platform: platform,
        amount: amountNum,
        customerId: customerId,
        reference: transaction.reference,
        newBalance: wallet.balance
      }
    });
  } catch (error) {
    console.error('❌ Betting deposit error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// P2P TRANSFER
// ============================================
app.post('/api/transfer/p2p', authenticateToken, (req, res) => {
  try {
    const { recipient, amount, narration } = req.body;

    if (!recipient || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Recipient and amount are required'
      });
    }

    const amountNum = parseFloat(amount);
    const senderWallet = wallets.find(w => w.user_id === req.userId);

    if (!senderWallet) {
      return res.status(404).json({
        success: false,
        message: 'Sender wallet not found'
      });
    }

    if (senderWallet.balance < amountNum) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Need ₦${amountNum}. You have ₦${senderWallet.balance}`
      });
    }

    const recipientUser = users.find(u => u.phone === recipient || u.email === recipient);
    if (!recipientUser) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    const recipientWallet = wallets.find(w => w.user_id === recipientUser.id);
    if (!recipientWallet) {
      return res.status(404).json({
        success: false,
        message: 'Recipient wallet not found'
      });
    }

    senderWallet.balance -= amountNum;
    recipientWallet.balance += amountNum;

    const reference = 'P2P_' + Date.now();

    const senderTransaction = {
      id: transactionIdCounter++,
      user_id: req.userId,
      wallet_id: senderWallet.id,
      type: 'withdrawal',
      amount: amountNum,
      description: narration ? `P2P Transfer: ${narration}` : `P2P Transfer to ${recipient}`,
      reference: reference,
      status: 'success',
      service_type: 'transfer',
      created_at: new Date().toISOString()
    };
    transactions.push(senderTransaction);

    const recipientTransaction = {
      id: transactionIdCounter++,
      user_id: recipientUser.id,
      wallet_id: recipientWallet.id,
      type: 'payment',
      amount: amountNum,
      description: narration ? `P2P Transfer: ${narration}` : `P2P Transfer from ${req.userId}`,
      reference: reference,
      status: 'success',
      service_type: 'transfer',
      created_at: new Date().toISOString()
    };
    transactions.push(recipientTransaction);

    res.json({
      success: true,
      message: `✅ ₦${amountNum} sent to ${recipient}`,
      data: {
        amount: amountNum,
        recipient: recipient,
        reference: reference,
        newBalance: senderWallet.balance
      }
    });
  } catch (error) {
    console.error('❌ P2P Transfer error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// STRONGMB ROUTES
// ============================================

// Get Strongmb Wallet Balance
app.get('/api/strongmb/balance', authenticateToken, async (req, res) => {
    try {
        const result = await strongmbService.getWalletBalance();
        
        if (result.success) {
            res.json({
                success: true,
                balance: result.balance,
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message || 'Failed to fetch balance'
            });
        }
    } catch (error) {
        console.error('❌ Strongmb balance error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get Strongmb Data Plans (including SME)
app.get('/api/strongmb/plans', authenticateToken, async (req, res) => {
    try {
        const result = await strongmbService.getDataPlans();
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                message: 'Data plans fetched successfully',
                fallback: result.fallback || false
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message || 'Failed to fetch plans'
            });
        }
    } catch (error) {
        console.error('❌ Strongmb plans error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Buy Data via Strongmb
app.post('/api/strongmb/buy-data', authenticateToken, async (req, res) => {
    try {
        const { phoneNumber, productCode } = req.body;
        const userId = req.userId;

        if (!phoneNumber || !productCode) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and product code are required'
            });
        }

        // Get plan details
        const plansResult = await strongmbService.getDataPlans();
        let planPrice = 0;
        let planName = '';
        let validProductCode = productCode;
        
        if (plansResult.success) {
            const allPlans = plansResult.data.all || [];
            const plan = allPlans.find(p => 
                p.productCode === productCode || 
                p.code === productCode ||
                p.productCode?.toLowerCase() === productCode.toLowerCase()
            );
            if (plan) {
                planPrice = plan.price || plan.amount || 0;
                planName = plan.name || plan.productCode || productCode;
                validProductCode = plan.productCode || plan.code || productCode;
            }
        }

        if (!planPrice) {
            return res.status(404).json({
                success: false,
                message: `Plan not found for code: "${productCode}". Please check available plans.`
            });
        }

        // Check wallet balance
        const wallet = wallets.find(w => w.user_id === userId);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        if (wallet.balance < planPrice) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Need ₦${planPrice}. You have ₦${wallet.balance}`
            });
        }

        // Deduct from wallet
        wallet.balance -= planPrice;

        // Call Strongmb API
        const reference = `STRONG-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const result = await strongmbService.buyData(phoneNumber, validProductCode, reference);

        if (result.success) {
            const transaction = {
                id: transactionIdCounter++,
                user_id: userId,
                wallet_id: wallet.id,
                type: 'purchase',
                amount: planPrice,
                description: `${planName} data for ${phoneNumber} (Strongmb)`,
                reference: reference,
                status: 'success',
                service_type: 'data',
                created_at: new Date().toISOString(),
                provider: 'Strongmb'
            };
            transactions.push(transaction);

            res.json({
                success: true,
                message: `✅ ${planName} data sent to ${phoneNumber}`,
                data: {
                    reference: reference,
                    amount: planPrice,
                    plan: planName,
                    phoneNumber,
                    newBalance: wallet.balance,
                    provider: 'Strongmb'
                }
            });
        } else {
            // Refund if failed
            wallet.balance += planPrice;
            res.status(400).json({
                success: false,
                message: result.message || 'Data purchase failed'
            });
        }
    } catch (error) {
        console.error('❌ Strongmb buy data error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Buy Airtime via Strongmb
app.post('/api/strongmb/buy-airtime', authenticateToken, async (req, res) => {
    try {
        const { phoneNumber, amount } = req.body;
        const userId = req.userId;

        if (!phoneNumber || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and amount are required'
            });
        }

        const amountNum = parseFloat(amount);
        const wallet = wallets.find(w => w.user_id === userId);

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        if (wallet.balance < amountNum) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Need ₦${amountNum}. You have ₦${wallet.balance}`
            });
        }

        wallet.balance -= amountNum;

        const result = await strongmbService.buyAirtime(phoneNumber, amountNum);

        if (result.success) {
            const reference = `STRONG-AIR-${Date.now()}`;
            const transaction = {
                id: transactionIdCounter++,
                user_id: userId,
                wallet_id: wallet.id,
                type: 'purchase',
                amount: amountNum,
                description: `Airtime for ${phoneNumber} (Strongmb)`,
                reference: reference,
                status: 'success',
                service_type: 'airtime',
                created_at: new Date().toISOString(),
                provider: 'Strongmb'
            };
            transactions.push(transaction);

            res.json({
                success: true,
                message: `✅ Airtime of ₦${amountNum} sent to ${phoneNumber}`,
                data: {
                    reference: reference,
                    amount: amountNum,
                    phoneNumber,
                    newBalance: wallet.balance,
                    provider: 'Strongmb'
                }
            });
        } else {
            wallet.balance += amountNum;
            res.status(400).json({
                success: false,
                message: result.message || 'Airtime purchase failed'
            });
        }
    } catch (error) {
        console.error('❌ Strongmb buy airtime error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Check Transaction Status
app.post('/api/strongmb/status', authenticateToken, async (req, res) => {
    try {
        const { reference } = req.body;

        if (!reference) {
            return res.status(400).json({
                success: false,
                message: 'Reference is required'
            });
        }

        const result = await strongmbService.checkTransactionStatus(reference);
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('❌ Strongmb status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Paysbillz API is running',
    version: '2.0.0',
    time: new Date().toISOString(),
    users: users.length,
    wallets: wallets.length,
    transactions: transactions.length,
    services: {
      strongmb: '✅ Configured'
    }
  });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('📡 Services:');
  console.log(`   - In-Memory Database: ✅ Active`);
  console.log(`   - Wallet: ✅ Active`);
  console.log(`   - Transactions: ✅ Active`);
  console.log(`   - Airtime: ✅ Active`);
  console.log(`   - Electricity: ✅ Active`);
  console.log(`   - Cable TV: ✅ Active`);
  console.log(`   - Education: ✅ Active`);
  console.log(`   - Betting: ✅ Active`);
  console.log(`   - P2P Transfer: ✅ Active`);
  console.log(`   - Strongmb API: ✅ Configured`);
  console.log(`📝 Default User: 08012345678 / password123`);
  console.log('✅ All services are ready!');
});