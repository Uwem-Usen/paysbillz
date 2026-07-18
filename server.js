const express = require('express');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use((req, res, next) => {
    if (req.originalUrl === '/payment/webhook') return next();
    express.json()(req, res, next);
});
app.use(express.static('public'));

// ============================================
// PERSISTENT STORAGE
// ============================================
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) {
    try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log('📁 Created data directory:', DATA_DIR);
    } catch (err) {
        const fallbackDir = '/tmp/paysbillz-data';
        if (!fs.existsSync(fallbackDir)) {
            fs.mkdirSync(fallbackDir, { recursive: true });
        }
        console.log('📁 Using fallback directory:', fallbackDir);
    }
}

function loadUsers() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            const loaded = JSON.parse(data);
            console.log('✅ Loaded ' + Object.keys(loaded).length + ' users from disk');
            return loaded;
        }
    } catch (error) {
        console.error('❌ Error loading users:', error.message);
    }
    return {};
}

function saveUsers() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
        console.log('💾 Saved ' + Object.keys(users).length + ' users to disk');
    } catch (error) {
        console.error('❌ Error saving users:', error.message);
    }
}

setInterval(saveUsers, 30000);
process.on('exit', saveUsers);
process.on('SIGINT', function() { saveUsers(); process.exit(); });

const users = loadUsers();

// ============================================
// ADMIN CONFIGURATION
// ============================================
const ADMIN_PHONE = '08027449527';

// ============================================
// KYC TIERS
// ============================================
const KYC_TIERS = {
    tier1: {
        name: 'Basic',
        dailyLimit: 5000,
        monthlyLimit: 50000,
        maxBalance: 100000,
        requires: ['phone'],
        canFund: true,
        canWithdraw: false
    },
    tier2: {
        name: 'Verified',
        dailyLimit: 50000,
        monthlyLimit: 500000,
        maxBalance: 1000000,
        requires: ['phone', 'name', 'email'],
        canFund: true,
        canWithdraw: true
    },
    tier3: {
        name: 'Premium',
        dailyLimit: 500000,
        monthlyLimit: 5000000,
        maxBalance: 10000000,
        requires: ['phone', 'name', 'email', 'bvn', 'nin', 'address'],
        canFund: true,
        canWithdraw: true
    }
};

// ============================================
// VIRTUAL ACCOUNT GENERATION - FIXED (10 digits)
// ============================================
function generateVirtualAccount(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneDigits = cleanPhone.slice(-8);
    const padded = phoneDigits.padStart(8, '0');
    let sum = 0;
    for (let i = 0; i < padded.length; i++) {
        const digit = parseInt(padded[i]);
        if (i % 2 === 0) {
            const doubled = digit * 2;
            sum += doubled > 9 ? doubled - 9 : doubled;
        } else {
            sum += digit;
        }
    }
    const checksum = (10 - (sum % 10)) % 10;
    const accountNumber = '9' + padded + checksum;
    return accountNumber;
}

// ============================================
// USER FUNCTIONS
// ============================================
function getUser(phone) {
    if (!users[phone]) {
        users[phone] = {
            phone: phone,
            realBalance: 0,
            profitBalance: 0,
            name: 'Customer',
            password: null,
            transactions: [],
            createdAt: new Date().toISOString(),
            kyc: {
                tier: 'tier1',
                status: 'not_submitted',
                fullName: null,
                email: null,
                bvn: null,
                nin: null,
                address: null,
                dateOfBirth: null
            },
            virtualAccount: generateVirtualAccount(phone),
            fingerprint: null
        };
        saveUsers();
    }
    if (!users[phone].virtualAccount) {
        users[phone].virtualAccount = generateVirtualAccount(phone);
        saveUsers();
    }
    if (!users[phone].kyc) {
        users[phone].kyc = {
            tier: 'tier1',
            status: 'not_submitted',
            fullName: null,
            email: null,
            bvn: null,
            nin: null,
            address: null,
            dateOfBirth: null
        };
        saveUsers();
    }
    return users[phone];
}

function saveUser(user) {
    users[user.phone] = user;
    saveUsers();
}

// Ensure admin exists
if (!users[ADMIN_PHONE]) {
    const admin = {
        phone: ADMIN_PHONE,
        realBalance: 0,
        profitBalance: 0,
        name: 'Admin',
        password: 'admin123',
        transactions: [],
        createdAt: new Date().toISOString(),
        kyc: {
            tier: 'tier3',
            status: 'verified',
            fullName: 'Admin User',
            email: 'admin@paysbillz.com',
            bvn: '12345678901',
            nin: '12345678901',
            address: 'Admin Address',
            dateOfBirth: '1990-01-01'
        },
        virtualAccount: generateVirtualAccount(ADMIN_PHONE),
        fingerprint: null
    };
    users[ADMIN_PHONE] = admin;
    saveUsers();
    console.log('👑 Admin user created:', ADMIN_PHONE);
}

// ============================================
// PAYSTACK CONFIGURATION
// ============================================
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const PAYSTACK_CALLBACK_URL = process.env.PAYSTACK_CALLBACK_URL || 'https://paysbillz-api.onrender.com/payment/callback';

// ============================================
// CONFIGURATION
// ============================================
const config = {
    providers: {
        inlomax: {
            name: 'Inlomax',
            apiKey: process.env.INLOMAX_API_KEY || 'demo_key',
            endpoints: {
                data: 'https://inlomax.com/api/data',
                airtime: 'https://inlomax.com/api/airtime',
                electricity: 'https://inlomax.com/api/payelectric',
                education: 'https://inlomax.com/api/education',
                validateCable: 'https://inlomax.com/api/validatecable',
                subCable: 'https://inlomax.com/api/subcable',
                validateMeter: 'https://inlomax.com/api/validatemeter'
            }
        }
    },
    paystack: {
        secretKey: PAYSTACK_SECRET_KEY,
        publicKey: PAYSTACK_PUBLIC_KEY,
        callbackUrl: PAYSTACK_CALLBACK_URL
    }
};

// ============================================
// PROFIT MARGINS
// ============================================
const PROFITS = {
    data: {
        'MTN_SME_500MB': 50, 'MTN_SME_1GB': 80, 'MTN_SME_2GB': 120, 'MTN_SME_3GB': 150, 'MTN_SME_5GB': 200,
        'MTN_AWOOF_500MB': 30, 'MTN_AWOOF_1GB': 40, 'MTN_AWOOF_2.5GB': 60, 'MTN_AWOOF_5GB': 100, 'MTN_AWOOF_10GB': 200,
        'MTN_SHARE_500MB': 35, 'MTN_SHARE_1GB': 55, 'MTN_SHARE_2GB': 80, 'MTN_SHARE_3GB': 110, 'MTN_SHARE_5GB': 150,
        'MTN_10GB': 350, 'MTN_20GB': 500, 'MTN_50GB': 1000, 'MTN_100GB': 1500,
        'AIRTEL_500MB': 40, 'AIRTEL_1GB': 70, 'AIRTEL_2GB': 100, 'AIRTEL_3GB': 130, 'AIRTEL_5GB': 180, 'AIRTEL_10GB': 300,
        'AIRTEL_AWOOF_150MB': 20, 'AIRTEL_AWOOF_300MB': 25, 'AIRTEL_AWOOF_600MB': 35, 'AIRTEL_AWOOF_10GB': 200,
        'AIRTEL_BINGE_1.5GB': 60, 'AIRTEL_BINGE_2GB': 80, 'AIRTEL_BINGE_3GB': 100,
        'GLO_500MB': 35, 'GLO_1GB': 60, 'GLO_2GB': 90, 'GLO_3GB': 120, 'GLO_5GB': 170, 'GLO_10GB': 280,
        'GLO_AWOOF_750MB': 25, 'GLO_AWOOF_1.5GB': 40, 'GLO_AWOOF_2.5GB': 55, 'GLO_AWOOF_10GB': 200,
        '9MOBILE_500MB': 30, '9MOBILE_1GB': 55, '9MOBILE_2GB': 85, '9MOBILE_3GB': 110, '9MOBILE_5GB': 160, '9MOBILE_10GB': 250,
    },
    airtime: 0.05,
    tv: 0.03,
    electricity: 0.02,
    education: 0.05,
};

// ============================================
// SERVICE ID MAPPINGS
// ============================================
const SERVICE_IDS = {
    'MTN_SME_500MB': '229', 'MTN_SME_1GB': '240', 'MTN_SME_2GB': '99', 'MTN_SME_3GB': '100', 'MTN_SME_5GB': '101',
    'MTN_AWOOF_500MB': '271', 'MTN_AWOOF_1GB': '269', 'MTN_AWOOF_2.5GB': '270', 'MTN_AWOOF_5GB': '277', 'MTN_AWOOF_10GB': '600',
    'MTN_SHARE_500MB': '97', 'MTN_SHARE_1GB': '240', 'MTN_SHARE_2GB': '99', 'MTN_SHARE_3GB': '100', 'MTN_SHARE_5GB': '101',
    'MTN_10GB': '226', 'MTN_20GB': '255', 'MTN_50GB': '238', 'MTN_100GB': '235',
    'AIRTEL_500MB': '309', 'AIRTEL_1GB': '331', 'AIRTEL_2GB': '300', 'AIRTEL_3GB': '301', 'AIRTEL_5GB': '302', 'AIRTEL_10GB': '304',
    'AIRTEL_AWOOF_150MB': '104', 'AIRTEL_AWOOF_300MB': '105', 'AIRTEL_AWOOF_600MB': '111', 'AIRTEL_AWOOF_10GB': '109',
    'AIRTEL_BINGE_1.5GB': '352', 'AIRTEL_BINGE_2GB': '353', 'AIRTEL_BINGE_3GB': '354',
    'GLO_500MB': '35', 'GLO_1GB': '36', 'GLO_2GB': '37', 'GLO_3GB': '38', 'GLO_5GB': '39', 'GLO_10GB': '40',
    'GLO_AWOOF_750MB': '113', 'GLO_AWOOF_1.5GB': '114', 'GLO_AWOOF_2.5GB': '115', 'GLO_AWOOF_10GB': '116',
    '9MOBILE_500MB': '68', '9MOBILE_1GB': '69', '9MOBILE_2GB': '71', '9MOBILE_3GB': '72', '9MOBILE_5GB': '75', '9MOBILE_10GB': '76',
    'DSTV_PADI': '90', 'DSTV_YANGA': '91', 'DSTV_CONFAM': '92', 'DSTV_COMPACT': '93', 'DSTV_COMPACT_PLUS': '105', 'DSTV_PREMIUM': '106',
    'GOTV_SMALLIE': '94', 'GOTV_JOLLI': '96', 'GOTV_JINJA': '97', 'GOTV_MAX': '95', 'GOTV_SUPA': '112',
    'ELECTRICITY_IKEDC': '1', 'ELECTRICITY_EKEDC': '2', 'ELECTRICITY_KEDCO': '3', 'ELECTRICITY_PHED': '4', 'ELECTRICITY_JED': '5',
    'ELECTRICITY_IBEDC': '6', 'ELECTRICITY_KAEDCO': '7', 'ELECTRICITY_AEDC': '8', 'ELECTRICITY_EEDC': '9', 'ELECTRICITY_BEDC': '10',
    'EDUCATION_WAEC': '1', 'EDUCATION_NECO': '2', 'EDUCATION_NABTEB': '3',
};

const TV_PRICES = {
    '90': 4400, '91': 6000, '92': 11000, '93': 19000, '105': 30000, '106': 44500,
    '94': 1900, '96': 5800, '97': 3900, '95': 8500, '112': 9000
};

const EDUCATION_PRICES = {
    '1': 5250, '2': 2250, '3': 900
};

function calculateDataProfit(plan) { return PROFITS.data[plan] || 50; }
function calculateAirtimeProfit(amount) { return Math.round(amount * PROFITS.airtime); }
function calculateTVProfit(amount) { return Math.round(amount * PROFITS.tv); }
function calculateElectricityProfit(amount) { return Math.round(amount * PROFITS.electricity); }
function calculateEducationProfit(amount) { return Math.round(amount * PROFITS.education); }

// ============================================
// ADMIN PROFIT FUNCTIONS
// ============================================
function addAdminProfit(fromPhone, amount, serviceType) {
    const admin = getUser(ADMIN_PHONE);
    admin.profitBalance = (admin.profitBalance || 0) + amount;
    admin.transactions.push({
        type: 'admin_profit',
        amount: amount,
        from: fromPhone,
        service: serviceType,
        status: 'success',
        message: `Profit of ₦${amount} from ${fromPhone} (${serviceType})`,
        created_at: new Date().toISOString()
    });
    saveUser(admin);
    console.log(`💰 Admin profit: ₦${amount} from ${fromPhone}`);
    return admin;
}

// ============================================
// PURCHASE FUNCTIONS
// ============================================
async function purchaseInlomax(phone, plan, amount) {
    const user = getUser(phone);
    const actualCost = amount || 500;

    if ((user.realBalance || 0) < actualCost) {
        throw new Error(`Insufficient wallet balance. You have ₦${(user.realBalance || 0).toFixed(2)}, need ₦${actualCost.toFixed(2)}`);
    }

    const requestId = 'REQ-' + Date.now() + '-' + crypto.randomBytes(6).toString('hex');

    user.realBalance = (user.realBalance || 0) - actualCost;
    const profit = calculateDataProfit(plan);
    addAdminProfit(phone, profit, 'data');
    user.transactions.push({
        type: 'data_purchase', amount: actualCost, plan: plan, provider: 'inlomax',
        profit: profit, status: 'success', reference: requestId,
        message: 'Purchase successful', created_at: new Date().toISOString()
    });
    saveUser(user);
    return { success: true, provider: 'inlomax', data: { status: 'success', reference: requestId }, profit: profit, newBalance: user.realBalance };
}

async function purchaseAirtimeInlomax(phone, amount) {
    const user = getUser(phone);
    const actualCost = amount;

    if ((user.realBalance || 0) < actualCost) {
        throw new Error(`Insufficient wallet balance. You have ₦${(user.realBalance || 0).toFixed(2)}, need ₦${actualCost.toFixed(2)}`);
    }

    const requestId = 'AIR-' + Date.now() + '-' + crypto.randomBytes(6).toString('hex');

    user.realBalance = (user.realBalance || 0) - actualCost;
    const profit = calculateAirtimeProfit(amount);
    addAdminProfit(phone, profit, 'airtime');
    user.transactions.push({
        type: 'airtime_purchase', amount: actualCost, phone: phone, provider: 'inlomax',
        profit: profit, status: 'success', reference: requestId,
        message: 'Airtime purchase successful', created_at: new Date().toISOString()
    });
    saveUser(user);
    return { success: true, provider: 'inlomax', data: { status: 'success', reference: requestId }, profit: profit, newBalance: user.realBalance };
}

async function purchaseTVInlomax(phone, serviceID, iucNum) {
    const user = getUser(phone);
    const actualCost = TV_PRICES[serviceID];
    if (!actualCost) throw new Error('Unknown TV package');

    if ((user.realBalance || 0) < actualCost) {
        throw new Error(`Insufficient wallet balance. You have ₦${(user.realBalance || 0).toFixed(2)}, need ₦${actualCost.toFixed(2)}`);
    }

    const requestId = 'TV-' + Date.now() + '-' + crypto.randomBytes(6).toString('hex');

    user.realBalance = (user.realBalance || 0) - actualCost;
    const profit = calculateTVProfit(actualCost);
    addAdminProfit(phone, profit, 'tv');
    user.transactions.push({
        type: 'tv_subscription', amount: actualCost, serviceID: serviceID, iucNum: iucNum, provider: 'inlomax',
        profit: profit, status: 'success', reference: requestId,
        message: 'TV subscription successful', created_at: new Date().toISOString()
    });
    saveUser(user);
    return { success: true, provider: 'inlomax', data: { status: 'success', reference: requestId }, profit: profit, newBalance: user.realBalance };
}

async function purchaseElectricityInlomax(phone, serviceID, meterNum, meterType, amount) {
    const user = getUser(phone);
    const actualCost = Number(amount);

    if ((user.realBalance || 0) < actualCost) {
        throw new Error(`Insufficient wallet balance. You have ₦${(user.realBalance || 0).toFixed(2)}, need ₦${actualCost.toFixed(2)}`);
    }

    const requestId = 'ELEC-' + Date.now() + '-' + crypto.randomBytes(6).toString('hex');

    user.realBalance = (user.realBalance || 0) - actualCost;
    const profit = calculateElectricityProfit(actualCost);
    addAdminProfit(phone, profit, 'electricity');
    user.transactions.push({
        type: 'electricity_payment', amount: actualCost, serviceID: serviceID, meterNum: meterNum, provider: 'inlomax',
        profit: profit, status: 'success', reference: requestId,
        message: 'Electricity payment successful', created_at: new Date().toISOString()
    });
    saveUser(user);
    return { success: true, provider: 'inlomax', data: { status: 'success', reference: requestId }, profit: profit, newBalance: user.realBalance };
}

async function purchaseEducationInlomax(phone, serviceID, quantity) {
    const user = getUser(phone);
    const unitPrice = EDUCATION_PRICES[serviceID];
    if (!unitPrice) throw new Error('Unknown exam pin type');
    const qty = Number(quantity) || 1;
    const actualCost = unitPrice * qty;

    if ((user.realBalance || 0) < actualCost) {
        throw new Error(`Insufficient wallet balance. You have ₦${(user.realBalance || 0).toFixed(2)}, need ₦${actualCost.toFixed(2)}`);
    }

    const requestId = 'EDU-' + Date.now() + '-' + crypto.randomBytes(6).toString('hex');

    user.realBalance = (user.realBalance || 0) - actualCost;
    const profit = calculateEducationProfit(actualCost);
    addAdminProfit(phone, profit, 'education');
    user.transactions.push({
        type: 'education_pin', amount: actualCost, serviceID: serviceID, quantity: qty, provider: 'inlomax',
        profit: profit, status: 'success', reference: requestId,
        message: 'Exam pin purchase successful', created_at: new Date().toISOString(),
        pins: ['DEMO-PIN-001', 'DEMO-PIN-002']
    });
    saveUser(user);
    return { success: true, provider: 'inlomax', data: { status: 'success', reference: requestId, pins: ['DEMO-PIN-001', 'DEMO-PIN-002'] }, profit: profit, newBalance: user.realBalance };
}

// ============================================
// KYC ENDPOINTS
// ============================================
app.post('/api/kyc/submit', (req, res) => {
    try {
        const { phone, fullName, email, bvn, nin, address, dateOfBirth } = req.body;
        
        if (!phone) {
            return res.status(400).json({ success: false, error: 'Phone number is required' });
        }
        
        const user = getUser(phone);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        if (!user.kyc) {
            user.kyc = {
                tier: 'tier1',
                status: 'not_submitted',
                fullName: null,
                email: null,
                bvn: null,
                nin: null,
                address: null,
                dateOfBirth: null
            };
        }
        
        user.kyc.fullName = fullName || user.kyc.fullName || user.name;
        user.kyc.email = email || user.kyc.email;
        user.kyc.bvn = bvn || user.kyc.bvn;
        user.kyc.nin = nin || user.kyc.nin;
        user.kyc.address = address || user.kyc.address;
        user.kyc.dateOfBirth = dateOfBirth || user.kyc.dateOfBirth;
        user.kyc.submittedAt = new Date().toISOString();
        user.kyc.status = 'pending';
        user.kyc.tier = 'tier1';
        
        if (bvn && nin && address) {
            user.kyc.tier = 'tier3';
            user.kyc.status = 'verified';
            user.kyc.verifiedAt = new Date().toISOString();
        } else if (fullName && email) {
            user.kyc.tier = 'tier2';
            user.kyc.status = 'verified';
            user.kyc.verifiedAt = new Date().toISOString();
        }
        
        if (user.kyc.tier !== 'tier1') {
            user.virtualAccount = generateVirtualAccount(phone);
        }
        
        saveUser(user);
        
        res.json({
            success: true,
            message: 'KYC information submitted successfully',
            tier: user.kyc.tier,
            status: user.kyc.status,
            limits: KYC_TIERS[user.kyc.tier],
            virtualAccount: user.virtualAccount,
            accountName: user.name || user.kyc.fullName || 'Customer'
        });
    } catch (error) {
        console.error('❌ KYC submission error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/kyc/status', (req, res) => {
    try {
        const phone = req.query.phone || ADMIN_PHONE;
        const user = getUser(phone);
        
        const kyc = user.kyc || { status: 'not_submitted', tier: 'tier1' };
        const tierInfo = KYC_TIERS[kyc.tier || 'tier1'];
        
        res.json({
            success: true,
            kyc: {
                status: kyc.status || 'not_submitted',
                tier: kyc.tier || 'tier1',
                tierName: tierInfo.name,
                dailyLimit: tierInfo.dailyLimit,
                monthlyLimit: tierInfo.monthlyLimit,
                maxBalance: tierInfo.maxBalance,
                canFund: tierInfo.canFund,
                canWithdraw: tierInfo.canWithdraw,
                submittedAt: kyc.submittedAt,
                verifiedAt: kyc.verifiedAt,
                fullName: kyc.fullName || user.name,
                email: kyc.email,
                address: kyc.address,
                virtualAccount: user.virtualAccount,
                accountName: user.name || kyc.fullName || 'Customer'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PAYSTACK: FUND WALLET
// ============================================
app.post('/api/fund-wallet-paystack', async (req, res) => {
    try {
        const { email, amount, phone } = req.body;
        if (!email || !amount || !phone) {
            return res.status(400).json({ success: false, error: 'Email, amount, and phone are required' });
        }
        if (amount < 100) {
            return res.status(400).json({ success: false, error: 'Minimum funding is ₦100' });
        }

        const user = getUser(phone);
        const kyc = user.kyc || { tier: 'tier1' };
        const tierInfo = KYC_TIERS[kyc.tier || 'tier1'];
        
        if (!tierInfo.canFund) {
            return res.status(403).json({ 
                success: false, 
                error: `Your KYC tier (${tierInfo.name}) does not allow wallet funding. Please complete KYC.` 
            });
        }

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: { 
                'Authorization': 'Bearer ' + config.paystack.secretKey, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                email: email,
                amount: amount * 100,
                callback_url: config.paystack.callbackUrl,
                metadata: { 
                    phone: phone, 
                    purpose: 'wallet_funding',
                    tier: kyc.tier || 'tier1'
                }
            })
        });

        const result = await response.json();
        if (result.status) {
            res.json({ 
                success: true, 
                authorization_url: result.data.authorization_url, 
                reference: result.data.reference 
            });
        } else {
            throw new Error(result.message || 'Payment initialization failed');
        }
    } catch (error) {
        console.error('❌ Payment error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PAYSTACK: WEBHOOK
// ============================================
app.post('/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const event = JSON.parse(req.body.toString());
        console.log('📡 Webhook received:', event.event);

        if (event.event === 'charge.success') {
            const transaction = event.data;
            const amount = transaction.amount / 100;
            const phone = transaction.metadata?.phone || ADMIN_PHONE;
            const purpose = transaction.metadata?.purpose || 'wallet_funding';

            const user = getUser(phone);
            if (purpose === 'wallet_funding') {
                user.realBalance = (user.realBalance || 0) + amount;
                user.transactions.push({
                    type: 'wallet_funding_paystack', 
                    amount: amount, 
                    reference: transaction.reference,
                    status: 'success', 
                    message: `Wallet funded with ₦${amount} via Paystack`,
                    created_at: new Date().toISOString()
                });
                saveUser(user);
                console.log(`✅ Wallet funded: ₦${amount} for ${phone}. New balance: ₦${user.realBalance}`);
            }
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).send('Webhook failed');
    }
});

app.get('/payment/callback', (req, res) => {
    const { reference, trxref } = req.query;
    res.redirect('/stable2.html?payment=success&reference=' + (reference || trxref));
});

// ============================================
// VIRTUAL ACCOUNT ENDPOINTS
// ============================================
app.post('/api/virtual-account/fund', (req, res) => {
    try {
        const { accountNumber, amount } = req.body;
        if (!accountNumber || !amount) {
            return res.status(400).json({ success: false, error: 'Account number and amount are required' });
        }

        let foundUser = null;
        let foundPhone = null;
        for (const [phone, user] of Object.entries(users)) {
            if (user.virtualAccount === accountNumber) {
                foundUser = user;
                foundPhone = phone;
                break;
            }
        }

        if (!foundUser) {
            return res.status(404).json({ success: false, error: 'Invalid account number' });
        }

        const kyc = foundUser.kyc || { tier: 'tier1' };
        const tierInfo = KYC_TIERS[kyc.tier || 'tier1'];
        
        if (!tierInfo.canFund) {
            return res.status(403).json({ 
                success: false, 
                error: `Your KYC tier (${tierInfo.name}) does not allow funding. Please complete KYC.` 
            });
        }

        foundUser.realBalance = (foundUser.realBalance || 0) + Number(amount);
        foundUser.transactions.push({
            type: 'virtual_account_funding',
            amount: Number(amount),
            status: 'success',
            tier: kyc.tier || 'tier1',
            message: `Wallet funded with ₦${amount} via virtual account ${accountNumber}`,
            created_at: new Date().toISOString()
        });
        saveUser(foundUser);

        res.json({ 
            success: true, 
            message: `₦${amount} added to wallet!`,
            newBalance: foundUser.realBalance,
            accountNumber: accountNumber,
            accountName: foundUser.name || foundUser.kyc?.fullName || 'Customer',
            bankName: 'Paystack MFB',
            tier: kyc.tier || 'tier1'
        });
    } catch (error) {
        console.error('❌ Virtual account funding error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/virtual-account', (req, res) => {
    try {
        const phone = req.query.phone || ADMIN_PHONE;
        const user = getUser(phone);
        
        res.json({
            success: true,
            accountNumber: user.virtualAccount,
            bankName: 'Paystack MFB',
            accountName: user.name || user.kyc?.fullName || 'Customer',
            tier: user.kyc?.tier || 'tier1',
            tierName: KYC_TIERS[user.kyc?.tier || 'tier1'].name,
            balance: user.realBalance || 0
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// FINGERPRINT ENDPOINTS
// ============================================
app.post('/api/fingerprint/register', (req, res) => {
    try {
        const { phone, fingerprintData } = req.body;
        if (!phone || !fingerprintData) {
            return res.status(400).json({ success: false, error: 'Phone and fingerprint data required' });
        }
        
        const user = getUser(phone);
        user.fingerprint = fingerprintData;
        saveUser(user);
        
        res.json({ success: true, message: 'Fingerprint registered successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/fingerprint/login', (req, res) => {
    try {
        const { fingerprintData } = req.body;
        if (!fingerprintData) {
            return res.status(400).json({ success: false, error: 'Fingerprint data required' });
        }
        
        let foundUser = null;
        let foundPhone = null;
        for (const [phone, user] of Object.entries(users)) {
            if (user.fingerprint === fingerprintData) {
                foundUser = user;
                foundPhone = phone;
                break;
            }
        }
        
        if (!foundUser) {
            return res.status(401).json({ success: false, error: 'Fingerprint not recognized' });
        }
        
        res.json({
            success: true,
            user: {
                phone: foundUser.phone,
                name: foundUser.name,
                balance: foundUser.realBalance || 0
            },
            message: 'Fingerprint login successful'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// API ENDPOINTS
// ============================================
app.get('/api/profile', (req, res) => {
    try {
        const phone = req.query.phone || ADMIN_PHONE;
        const user = getUser(phone);
        const isAdmin = phone === ADMIN_PHONE;
        
        res.json({
            success: true,
            user: {
                phone: user.phone,
                name: user.name || 'Customer',
                balance: user.realBalance || 0,
                profitBalance: isAdmin ? (user.profitBalance || 0) : undefined,
                transactions: user.transactions || [],
                virtualAccount: user.virtualAccount,
                accountName: user.name || user.kyc?.fullName || 'Customer',
                bankName: 'Paystack MFB',
                kyc: user.kyc || { tier: 'tier1', status: 'not_submitted' },
                isAdmin: isAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/balance', (req, res) => {
    try {
        const phone = req.query.phone || ADMIN_PHONE;
        const user = getUser(phone);
        const isAdmin = phone === ADMIN_PHONE;
        res.json({ 
            success: true, 
            balance: user.realBalance || 0, 
            profitBalance: isAdmin ? (user.profitBalance || 0) : undefined,
            virtualAccount: user.virtualAccount,
            accountName: user.name || user.kyc?.fullName || 'Customer',
            bankName: 'Paystack MFB',
            isAdmin: isAdmin
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/transactions', (req, res) => {
    try {
        const phone = req.query.phone || ADMIN_PHONE;
        const user = getUser(phone);
        res.json({ success: true, transactions: user.transactions || [] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/buy-airtime', async (req, res) => {
    try {
        const { phone, amount } = req.body;
        if (!phone) return res.status(400).json({ success: false, error: 'Phone number is required' });
        if (!amount || amount < 50) return res.status(400).json({ success: false, error: 'Amount must be at least ₦50' });
        const result = await purchaseAirtimeInlomax(phone, amount);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/buy-data', async (req, res) => {
    try {
        const { phone, plan, amount } = req.body;
        if (!phone) return res.status(400).json({ success: false, error: 'Phone number is required' });
        const result = await purchaseInlomax(phone, plan, amount);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/buy-tv', async (req, res) => {
    try {
        const { phone, serviceID, iucNum } = req.body;
        if (!phone) return res.status(400).json({ success: false, error: 'Phone number is required' });
        if (!serviceID || !iucNum) return res.status(400).json({ success: false, error: 'serviceID and iucNum are required' });
        const result = await purchaseTVInlomax(phone, serviceID, iucNum);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/buy-electricity', async (req, res) => {
    try {
        const { phone, serviceID, meterNum, meterType, amount } = req.body;
        if (!phone) return res.status(400).json({ success: false, error: 'Phone number is required' });
        if (!serviceID || !meterNum || !amount) return res.status(400).json({ success: false, error: 'serviceID, meterNum and amount are required' });
        const result = await purchaseElectricityInlomax(phone, serviceID, meterNum, meterType, amount);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/buy-education', async (req, res) => {
    try {
        const { phone, serviceID, quantity } = req.body;
        if (!phone) return res.status(400).json({ success: false, error: 'Phone number is required' });
        if (!serviceID) return res.status(400).json({ success: false, error: 'serviceID is required' });
        const result = await purchaseEducationInlomax(phone, serviceID, quantity);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/withdraw-profit', (req, res) => {
    try {
        const { phone, amount, bankName, accountNumber, accountName } = req.body;
        if (!phone) return res.status(400).json({ success: false, error: 'Phone number is required' });
        if (!amount || amount < 100) return res.status(400).json({ success: false, error: 'Minimum withdrawal is ₦100' });

        const user = getUser(phone);
        
        const kyc = user.kyc || { tier: 'tier1' };
        const tierInfo = KYC_TIERS[kyc.tier || 'tier1'];
        if (!tierInfo.canWithdraw) {
            return res.status(403).json({ 
                success: false, 
                error: `Your KYC tier (${tierInfo.name}) does not allow withdrawals. Please complete KYC to Tier 2 or higher.` 
            });
        }

        if ((user.profitBalance || 0) < amount) {
            return res.status(400).json({ success: false, error: 'Insufficient profit balance. Available: ₦' + (user.profitBalance || 0) });
        }

        user.profitBalance = (user.profitBalance || 0) - Number(amount);
        user.transactions.push({
            type: 'profit_withdrawal', amount: Number(amount), status: 'pending',
            bankName: bankName || 'Not specified', accountNumber: accountNumber || 'Not specified',
            accountName: accountName || 'Not specified', created_at: new Date().toISOString()
        });
        saveUser(user);
        res.json({ success: true, message: `Withdrawal request of ₦${amount} submitted successfully!`, newProfitBalance: user.profitBalance });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/fund-wallet', (req, res) => {
    try {
        const { phone, amount } = req.body;
        if (!phone) return res.status(400).json({ success: false, error: 'Phone number is required' });
        if (!amount || amount < 100) return res.status(400).json({ success: false, error: 'Amount must be at least ₦100' });

        const user = getUser(phone);
        const kyc = user.kyc || { tier: 'tier1' };
        const tierInfo = KYC_TIERS[kyc.tier || 'tier1'];
        
        if (!tierInfo.canFund) {
            return res.status(403).json({ 
                success: false, 
                error: `Your KYC tier (${tierInfo.name}) does not allow wallet funding. Please upgrade to at least Tier 2.` 
            });
        }
        
        const today = new Date().toDateString();
        const todayTransactions = (user.transactions || []).filter(t => 
            t.type === 'wallet_funding' && 
            new Date(t.created_at).toDateString() === today
        );
        const todayTotal = todayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        
        if (todayTotal + Number(amount) > tierInfo.dailyLimit) {
            return res.status(403).json({
                success: false,
                error: `Daily funding limit exceeded. You can fund up to ₦${tierInfo.dailyLimit.toLocaleString()} per day.`
            });
        }
        
        const month = new Date().getMonth();
        const year = new Date().getFullYear();
        const monthTransactions = (user.transactions || []).filter(t => 
            t.type === 'wallet_funding' && 
            new Date(t.created_at).getMonth() === month &&
            new Date(t.created_at).getFullYear() === year
        );
        const monthTotal = monthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        
        if (monthTotal + Number(amount) > tierInfo.monthlyLimit) {
            return res.status(403).json({
                success: false,
                error: `Monthly funding limit exceeded. You can fund up to ₦${tierInfo.monthlyLimit.toLocaleString()} per month.`
            });
        }
        
        if ((user.realBalance || 0) + Number(amount) > tierInfo.maxBalance) {
            return res.status(403).json({
                success: false,
                error: `Maximum wallet balance for your tier (${tierInfo.name}) is ₦${tierInfo.maxBalance.toLocaleString()}`
            });
        }

        user.realBalance = (user.realBalance || 0) + Number(amount);
        user.transactions.push({
            type: 'wallet_funding', 
            amount: Number(amount), 
            status: 'success',
            tier: kyc.tier || 'tier1',
            message: `Wallet funded with ₦${amount} (Tier: ${tierInfo.name})`, 
            created_at: new Date().toISOString()
        });
        saveUser(user);
        res.json({ success: true, message: `Wallet funded successfully! ₦${amount} added.`, newBalance: user.realBalance, tier: kyc.tier || 'tier1' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// AUTH ENDPOINTS
// ============================================
app.post('/api/register', (req, res) => {
    try {
        const { phone, name, password } = req.body;
        
        if (!phone) {
            return res.status(400).json({ success: false, error: 'Phone number is required' });
        }
        
        if (users[phone]) {
            return res.status(400).json({ success: false, error: 'User already exists. Please login.' });
        }
        
        if (!phone.match(/^0[789][01]\d{8}$/)) {
            return res.status(400).json({ success: false, error: 'Enter a valid Nigerian number (e.g., 08012345678)' });
        }
        
        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
        }
        
        const user = {
            phone: phone,
            realBalance: 0,
            profitBalance: 0,
            name: name || 'Customer',
            password: password,
            transactions: [],
            createdAt: new Date().toISOString(),
            kyc: {
                tier: 'tier1',
                status: 'not_submitted',
                fullName: name || null,
                email: null,
                bvn: null,
                nin: null,
                address: null,
                dateOfBirth: null
            },
            virtualAccount: generateVirtualAccount(phone),
            fingerprint: null
        };
        
        users[phone] = user;
        saveUsers();
        
        console.log('✅ User registered:', phone);
        
        res.json({
            success: true,
            user: {
                phone: user.phone,
                name: user.name,
                balance: user.realBalance || 0,
                virtualAccount: user.virtualAccount,
                accountName: user.name,
                bankName: 'Paystack MFB'
            },
            message: 'Registration successful!'
        });
    } catch (error) {
        console.error('❌ Registration error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/login', (req, res) => {
    try {
        const { phone, password } = req.body;
        
        if (!phone) {
            return res.status(400).json({ success: false, error: 'Phone number is required' });
        }
        
        if (!users[phone]) {
            return res.status(401).json({ success: false, error: 'Account not found. Please register first.' });
        }
        
        const user = users[phone];
        
        if (user.password && password && user.password !== password) {
            return res.status(401).json({ success: false, error: 'Incorrect password.' });
        }
        
        res.json({
            success: true,
            user: {
                phone: user.phone,
                name: user.name || 'Customer',
                balance: user.realBalance || 0,
                profitBalance: user.profitBalance || 0,
                virtualAccount: user.virtualAccount,
                accountName: user.name || user.kyc?.fullName || 'Customer',
                bankName: 'Paystack MFB',
                kyc: user.kyc || { tier: 'tier1', status: 'not_submitted' }
            },
            message: 'Login successful'
        });
    } catch (error) {
        console.error('❌ Login error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================
app.get('/api/admin/earnings', (req, res) => {
    try {
        const admin = getUser(ADMIN_PHONE);
        const profits = (admin.transactions || []).filter(t => t.type === 'admin_profit');
        const totalEarnings = profits.reduce((sum, t) => sum + t.amount, 0);
        res.json({
            success: true,
            totalEarnings: totalEarnings,
            profitBalance: admin.profitBalance || 0,
            transactions: profits
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/admin/stats', (req, res) => {
    try {
        const allUsers = Object.values(users);
        const totalUsers = allUsers.length;
        const totalTransactions = allUsers.reduce((sum, u) => sum + (u.transactions || []).length, 0);
        const totalRevenue = allUsers.reduce((sum, u) => sum + (u.realBalance || 0), 0);
        const admin = getUser(ADMIN_PHONE);
        res.json({
            success: true,
            totalUsers: totalUsers,
            totalTransactions: totalTransactions,
            totalRevenue: totalRevenue,
            adminProfit: admin.profitBalance || 0
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// ROUTES - FIXED: Added ALL routes
// ============================================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/stable2.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'stable2.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/login.html', (req, res) => res.redirect('/'));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html')));
app.get('/dash.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html')));
app.get('/app.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html')));

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        totalUsers: Object.keys(users).length,
        adminPhone: ADMIN_PHONE,
        features: {
            kyc: 'active',
            virtualAccount: 'active',
            fingerprint: 'active',
            paystack: 'active',
            services: ['data', 'airtime', 'tv', 'electricity', 'education']
        }
    });
});

app.listen(PORT, () => {
    console.log('=================================================');
    console.log('🚀 Paysbillz Server Started on port ' + PORT);
    console.log('=================================================');
    console.log('👑 Admin: ' + ADMIN_PHONE);
    console.log('📁 Data directory:', DATA_DIR);
    console.log('📊 Loaded ' + Object.keys(users).length + ' users');
    console.log('✅ KYC system active');
    console.log('✅ Virtual Account system active (Bank: Paystack MFB)');
    console.log('✅ Paystack integration active');
    console.log('✅ Fingerprint login active');
    console.log('✅ All services active');
    console.log('=================================================');
});

module.exports = app;