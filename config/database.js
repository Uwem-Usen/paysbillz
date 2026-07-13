const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

const connectDB = async () => {
  try {
    await pool.connect();
    console.log('PostgreSQL connected');
    return true;
  } catch (error) {
    console.error('DB error:', error.message);
    return false;
  }
};

const query = (text, params) => pool.query(text, params);

module.exports = { pool, connectDB, query };
