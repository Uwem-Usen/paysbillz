const { query } = require('./config/database');

async function checkTables() {
  try {
    const result = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables found:');
    result.rows.forEach(row => console.log('  -', row.table_name));
    if (result.rows.length === 0) {
      console.log('No tables found. Creating tables...');
      await createTables();
    }
  } catch(err) {
    console.error('Error:', err.message);
  }
}

async function createTables() {
  try {
    await query(\
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(15) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    \);
    console.log('Users table created');
    
    await query(\
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        balance DECIMAL(15,2) DEFAULT 0
      )
    \);
    console.log('Wallets table created');
    console.log('Setup complete!');
  } catch(err) {
    console.error('Error creating tables:', err.message);
  }
}

checkTables();
