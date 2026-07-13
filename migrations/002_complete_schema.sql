-- =====================================================
-- PAYSBILLZ COMPLETE DATABASE SCHEMA
-- Run this on your DigitalOcean Managed PostgreSQL
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'NGN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table (immutable ledger)
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    transaction_ref VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(30) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    balance_before DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    provider VARCHAR(50),
    provider_reference VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Airtime purchases
CREATE TABLE IF NOT EXISTS airtime_purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    transaction_ref VARCHAR(50) NOT NULL REFERENCES transactions(transaction_ref),
    phone_number VARCHAR(15) NOT NULL,
    network VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data purchases
CREATE TABLE IF NOT EXISTS data_purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    transaction_ref VARCHAR(50) NOT NULL REFERENCES transactions(transaction_ref),
    phone_number VARCHAR(15) NOT NULL,
    network VARCHAR(20) NOT NULL,
    data_plan VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bill payments
CREATE TABLE IF NOT EXISTS bill_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    transaction_ref VARCHAR(50) NOT NULL REFERENCES transactions(transaction_ref),
    bill_type VARCHAR(30) NOT NULL,
    biller_code VARCHAR(50),
    customer_id VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bets
CREATE TABLE IF NOT EXISTS bets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    transaction_ref VARCHAR(50) NOT NULL REFERENCES transactions(transaction_ref),
    provider VARCHAR(50) NOT NULL,
    event_name VARCHAR(200),
    odds DECIMAL(10,2) NOT NULL,
    stake DECIMAL(15,2) NOT NULL,
    potential_win DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    result VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_ref ON transactions(transaction_ref);
CREATE INDEX idx_transactions_created ON transactions(created_at);
CREATE INDEX idx_airtime_user ON airtime_purchases(user_id);
CREATE INDEX idx_data_user ON data_purchases(user_id);
CREATE INDEX idx_bills_user ON bill_payments(user_id);
CREATE INDEX idx_bets_user ON bets(user_id);
CREATE INDEX idx_bets_status ON bets(status);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create wallet when user is created
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id, balance) VALUES (NEW.id, 0.00);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_wallet_after_user_signup
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_wallet_for_user();