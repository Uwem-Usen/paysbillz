const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'postgres123',
  host: 'localhost',
  port: 5432,
  database: 'postgres',
});

async function addMoney() {
    try {
        const phone = '08022222222';
        
        // Get user
        const userResult = await pool.query(
            'SELECT id FROM users WHERE phone = ',
            [phone]
        );
        
        if (userResult.rows.length === 0) {
            console.log('❌ User not found. Please register first.');
            await pool.end();
            return;
        }
        
        const userId = userResult.rows[0].id;
        console.log('✅ User found. ID:', userId);
        
        // Check if wallet exists
        const walletCheck = await pool.query(
            'SELECT id FROM wallets WHERE user_id = ',
            [userId]
        );
        
        // If wallet doesn't exist, create it
        if (walletCheck.rows.length === 0) {
            console.log('Creating wallet...');
            await pool.query(
                'INSERT INTO wallets (user_id, balance) VALUES (, )',
                [userId, 0]
            );
            console.log('✅ Wallet created!');
        }
        
        // Add money
        await pool.query(
            'UPDATE wallets SET balance = balance +  WHERE user_id = ',
            [100000, userId]
        );
        
        // Check balance
        const balanceResult = await pool.query(
            'SELECT balance FROM wallets WHERE user_id = ',
            [userId]
        );
        
        console.log('💰 New Balance: ₦' + balanceResult.rows[0].balance);
        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
    }
}

addMoney();
