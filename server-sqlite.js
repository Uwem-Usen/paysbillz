const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

let db;

async function initDB() {
    db = await open({
        filename: "./paysbillz.db",
        driver: sqlite3.Database
    });

    await db.exec(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password_hash TEXT,
        is_active INTEGER DEFAULT 1,
        referral_code TEXT UNIQUE,
        referred_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await db.exec(`CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        balance REAL DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    await db.exec(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,
        amount REAL,
        description TEXT,
        reference TEXT,
        status TEXT DEFAULT "success",
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    await db.exec(`CREATE TABLE IF NOT EXISTS referrals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        referrer_id INTEGER,
        referred_id INTEGER,
        bonus_amount REAL,
        status TEXT DEFAULT "completed",
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(referrer_id) REFERENCES users(id),
        FOREIGN KEY(referred_id) REFERENCES users(id)
    )`);

    console.log("Database ready");
}

function generateReferralCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "REF";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

app.post("/api/auth/register", async (req, res) => {
    try {
        const { fullName, email, phone, password, referralCode } = req.body;
        if (!fullName || !phone || !password) {
            return res.status(400).json({ success: false, message: "All fields required" });
        }

        const existing = await db.get("SELECT id FROM users WHERE phone = ?", [phone]);
        if (existing) {
            return res.status(400).json({ success: false, message: "Phone already registered" });
        }

        let refCode = generateReferralCode();
        let existingRef = await db.get("SELECT id FROM users WHERE referral_code = ?", [refCode]);
        while (existingRef) {
            refCode = generateReferralCode();
            existingRef = await db.get("SELECT id FROM users WHERE referral_code = ?", [refCode]);
        }

        let referredBy = null;
        if (referralCode) {
            const referrer = await db.get("SELECT id FROM users WHERE referral_code = ?", [referralCode]);
            if (referrer) {
                referredBy = referrer.id;
            }
        }

        const hashed = await bcrypt.hash(password, 10);
        const result = await db.run(
            "INSERT INTO users (full_name, email, phone, password_hash, referral_code, referred_by) VALUES (?, ?, ?, ?, ?, ?)",
            [fullName, email || null, phone, hashed, refCode, referredBy]
        );

        const userId = result.lastID;
        await db.run("INSERT INTO wallets (user_id, balance) VALUES (?, ?)", [userId, 0]);

        if (referredBy) {
            const bonusAmount = 100;
            await db.run("UPDATE wallets SET balance = balance + ? WHERE user_id = ?", [bonusAmount, referredBy]);
            await db.run(
                "INSERT INTO referrals (referrer_id, referred_id, bonus_amount) VALUES (?, ?, ?)",
                [referredBy, userId, bonusAmount]
            );
            await db.run(
                "INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)",
                [referredBy, "bonus", bonusAmount, "Referral bonus for inviting " + fullName]
            );
        }

        const token = jwt.sign({ userId: userId }, process.env.JWT_SECRET || "secret", { expiresIn: "30d" });
        res.json({
            success: true,
            token,
            user: {
                id: userId,
                fullName: fullName,
                email: email || null,
                phone: phone,
                referralCode: refCode
            }
        });
    } catch (error) {
        console.error("Registration error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) {
            return res.status(400).json({ success: false, message: "Phone and password required" });
        }

        const user = await db.get("SELECT * FROM users WHERE phone = ?", [phone]);
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "secret", { expiresIn: "30d" });
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
        res.status(500).json({ success: false, message: error.message });
    }
});

function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }
    jwt.verify(token, process.env.JWT_SECRET || "secret", (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: "Invalid token" });
        }
        req.userId = decoded.userId;
        next();
    });
}

app.get("/api/user/profile", authenticate, async (req, res) => {
    try {
        const user = await db.get("SELECT id, full_name, email, phone, referral_code, created_at FROM users WHERE id = ?", [req.userId]);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({
            success: true,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                phone: user.phone,
                referralCode: user.referral_code,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get("/api/wallet/balance", authenticate, async (req, res) => {
    try {
        const wallet = await db.get("SELECT balance FROM wallets WHERE user_id = ?", [req.userId]);
        if (!wallet) {
            return res.status(404).json({ success: false, message: "Wallet not found" });
        }
        res.json({ success: true, balance: wallet.balance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get("/api/referrals", authenticate, async (req, res) => {
    try {
        const referrals = await db.all(
            "SELECT r.*, u.full_name as referred_name, u.phone as referred_phone FROM referrals r JOIN users u ON r.referred_id = u.id WHERE r.referrer_id = ? ORDER BY r.created_at DESC",
            [req.userId]
        );

        const stats = await db.get(
            "SELECT COUNT(*) as total, SUM(bonus_amount) as total_bonus FROM referrals WHERE referrer_id = ?",
            [req.userId]
        );

        res.json({
            success: true,
            referrals: referrals || [],
            stats: {
                total: stats?.total || 0,
                totalBonus: stats?.total_bonus || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get("/api/transactions", authenticate, async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const transactions = await db.all(
            "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            [req.userId, parseInt(limit), parseInt(offset)]
        );

        const count = await db.get("SELECT COUNT(*) as total FROM transactions WHERE user_id = ?", [req.userId]);

        const summary = await db.get(
            "SELECT COUNT(*) as total_transactions, SUM(CASE WHEN type IN ('airtime', 'data', 'electricity', 'cable') THEN amount ELSE 0 END) as total_spent, SUM(CASE WHEN type = 'bonus' THEN amount ELSE 0 END) as total_bonus FROM transactions WHERE user_id = ?",
            [req.userId]
        );

        res.json({
            success: true,
            transactions: transactions || [],
            total: count?.total || 0,
            limit: parseInt(limit),
            offset: parseInt(offset),
            summary: {
                totalTransactions: summary?.total_transactions || 0,
                totalSpent: summary?.total_spent || 0,
                totalBonus: summary?.total_bonus || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/api/airtime/buy", authenticate, async (req, res) => {
    try {
        const { phoneNumber, amount } = req.body;
        const userId = req.userId;

        if (!phoneNumber || !amount) {
            return res.status(400).json({ status: "error", message: "Phone and amount required" });
        }

        const wallet = await db.get("SELECT balance FROM wallets WHERE user_id = ?", [userId]);
        if (!wallet) {
            return res.status(404).json({ status: "error", message: "Wallet not found" });
        }

        const amountNum = parseFloat(amount);
        if (wallet.balance < amountNum) {
            return res.status(400).json({ status: "error", message: "Insufficient balance" });
        }

        await db.run("UPDATE wallets SET balance = balance - ? WHERE user_id = ?", [amountNum, userId]);

        const reference = "AIR-" + Date.now().toString(36).toUpperCase();
        await db.run(
            "INSERT INTO transactions (user_id, type, amount, description, reference) VALUES (?, ?, ?, ?, ?)",
            [userId, "airtime", amountNum, "Airtime for " + phoneNumber, reference]
        );

        res.json({
            status: "success",
            message: "Airtime of ₦" + amountNum + " sent to " + phoneNumber,
            data: { reference, amount: amountNum, phoneNumber }
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

app.post("/api/data/buy", authenticate, async (req, res) => {
    try {
        const { serviceID, phoneNumber } = req.body;
        const userId = req.userId;

        if (!serviceID || !phoneNumber) {
            return res.status(400).json({ status: "error", message: "Service ID and phone required" });
        }

        const dataPlans = {
            "35": { name: "500MB", price: 205 },
            "36": { name: "1GB", price: 430 },
            "37": { name: "2GB", price: 800 },
            "38": { name: "5GB", price: 1400 },
            "39": { name: "10GB", price: 2650 }
        };

        const plan = dataPlans[serviceID];
        if (!plan) {
            return res.status(400).json({ status: "error", message: "Invalid data plan" });
        }

        const wallet = await db.get("SELECT balance FROM wallets WHERE user_id = ?", [userId]);
        if (!wallet) {
            return res.status(404).json({ status: "error", message: "Wallet not found" });
        }

        if (wallet.balance < plan.price) {
            return res.status(400).json({ status: "error", message: "Insufficient balance. Need ₦" + plan.price });
        }

        await db.run("UPDATE wallets SET balance = balance - ? WHERE user_id = ?", [plan.price, userId]);

        const reference = "DATA-" + Date.now().toString(36).toUpperCase();
        await db.run(
            "INSERT INTO transactions (user_id, type, amount, description, reference) VALUES (?, ?, ?, ?, ?)",
            [userId, "data", plan.price, plan.name + " data for " + phoneNumber, reference]
        );

        res.json({
            status: "success",
            message: plan.name + " data sent to " + phoneNumber,
            data: { reference, amount: plan.price, plan: plan.name, phoneNumber }
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

app.post("/api/electricity/pay", authenticate, async (req, res) => {
    try {
        const { meterNumber, amount, disco } = req.body;
        const userId = req.userId;

        if (!meterNumber || !amount || !disco) {
            return res.status(400).json({ status: "error", message: "All fields required" });
        }

        const amountNum = parseFloat(amount);
        const wallet = await db.get("SELECT balance FROM wallets WHERE user_id = ?", [userId]);

        if (!wallet) {
            return res.status(404).json({ status: "error", message: "Wallet not found" });
        }

        if (wallet.balance < amountNum) {
            return res.status(400).json({ status: "error", message: "Insufficient balance" });
        }

        await db.run("UPDATE wallets SET balance = balance - ? WHERE user_id = ?", [amountNum, userId]);

        const reference = "ELEC-" + Date.now().toString(36).toUpperCase();
        await db.run(
            "INSERT INTO transactions (user_id, type, amount, description, reference) VALUES (?, ?, ?, ?, ?)",
            [userId, "electricity", amountNum, "Electricity bill for " + meterNumber + " (" + disco + ")", reference]
        );

        res.json({
            status: "success",
            message: "Electricity bill of ₦" + amountNum + " paid",
            data: { reference, amount: amountNum, meterNumber, disco }
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

app.post("/api/cable/subscribe", authenticate, async (req, res) => {
    try {
        const { smartCardNumber, packageName, amount } = req.body;
        const userId = req.userId;

        if (!smartCardNumber || !packageName) {
            return res.status(400).json({ status: "error", message: "Smart card and package required" });
        }

        const packages = {
            "DSTV Premium": 15000,
            "DSTV Compact": 8500,
            "DSTV Confam": 4500,
            "GOTV Max": 3500
        };

        const price = packages[packageName] || 0;
        const amountNum = parseFloat(amount) || price;

        const wallet = await db.get("SELECT balance FROM wallets WHERE user_id = ?", [userId]);

        if (!wallet) {
            return res.status(404).json({ status: "error", message: "Wallet not found" });
        }

        if (wallet.balance < amountNum) {
            return res.status(400).json({ status: "error", message: "Insufficient balance" });
        }

        await db.run("UPDATE wallets SET balance = balance - ? WHERE user_id = ?", [amountNum, userId]);

        const reference = "CABLE-" + Date.now().toString(36).toUpperCase();
        await db.run(
            "INSERT INTO transactions (user_id, type, amount, description, reference) VALUES (?, ?, ?, ?, ?)",
            [userId, "cable", amountNum, packageName + " for " + smartCardNumber, reference]
        );

        res.json({
            status: "success",
            message: packageName + " subscribed",
            data: { reference, amount: amountNum, package: packageName, smartCardNumber }
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

app.get("/health", (req, res) => {
    res.json({ status: "OK", message: "Paysbillz API is running" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    await initDB();
    console.log("Server running on port " + PORT);
    console.log("Features: Airtime, Data, Electricity, Cable, Referrals, History");
});
