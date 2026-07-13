const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'postgres123',
  host: 'localhost',
  port: 5432,
  database: 'postgres',
});

async function checkUser() {
    try {
        const result = await pool.query(
            SELECT id, full_name, phone FROM users WHERE phone = '08099999999'
        );
        
        if (result.rows.length > 0) {
            console.log('✅ User found:');
            console.log('   ID:', result.rows[0].id);
            console.log('   Name:', result.rows[0].full_name);
            console.log('   Phone:', result.rows[0].phone);
            
            // Check if wallet exists
            const walletResult = await pool.query(
                SELECT * FROM wallets WHERE user_id = ,
                [result.rows[0].id]
            );
            
            if (walletResult.rows.length > 0) {
                console.log('✅ Wallet found! Balance: ₦' + walletResult.rows[0].balance);
            } else {
                console.log('❌ Wallet not found. Creating one...');
                await pool.query(
                    INSERT INTO wallets (user_id, balance) VALUES (, ),
                    [result.rows[0].id, 0]
                );
                console.log('✅ Wallet created!');
            }
        } else {
            console.log('❌ User not found.');
        }
        
        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkUser();
