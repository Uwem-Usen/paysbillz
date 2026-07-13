const express = require('express');
const app = express();
app.use(express.json());

app.post('/api/auth/register', (req, res) => {
  console.log('Received:', req.body);
  res.json({ 
    success: true, 
    message: 'Registration successful (no DB)', 
    data: req.body 
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000 - NO DATABASE');
});
