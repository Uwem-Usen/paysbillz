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
    console.log('Received:', req.body);
    
    const { fullName, email, phone, password } = req.body;
    
    // Simple insert - minimal fields
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = 'INSERT INTO users (full_name, email, phone, password_hash) VALUES (, , , ) RETURNING id, full_name, email, phone';
    const values = [fullName, email, phone, hashedPassword];
    
    console.log('Executing query:', query);
    console.log('With values:', values);
    
    const result = await pool.query(query, values);
    
    const user = result.rows[0];
    
    res.json({
      success: true,
      token: jwt.sign({ id: user.id }, 'secret'),
      user: user
    });
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server on port 3000');
});
