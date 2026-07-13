require('dotenv').config();
const { pool, connectDB } = require('../config/database');
const fs = require('fs');
const path = require('path');

const runMigrations = async () => {
  try {
    await connectDB();
    
    const sql = fs.readFileSync(path.join(__dirname, '001_create_users_table.sql'), 'utf8');
    await pool.query(sql);
    
    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

runMigrations();