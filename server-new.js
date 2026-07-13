const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  password: 'postgres123',
  host: 'localhost',
  port: 5432,
  database: 'postgres',
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;
    console.log('Registration:', { fullName, email, phone });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Simple insert without RETURNING first to test
    const insertQuery = 'INSERT INTO users (full_name, email, phone, password_hash) VALUES (, , , )';
    await pool.query(insertQuery, [fullName, email, phone, hashedPassword]);
    
    // Then get the user
    const selectQuery = 'SELECT id, full_name, email, phone FROM users WHERE phone = ';
    const result = await pool.query(selectQuery, [phone]);
    const user = result.rows[0];
    
    const token = jwt.sign({ id: user.id }, 'secret123');
    
    res.json({
      success: true,
      token: token,
      user: user
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server on port 3000');
});
