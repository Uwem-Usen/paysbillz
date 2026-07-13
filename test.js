const express = require('express');
const app = express();
app.get('/', (req, res) => res.json({ status: 'OK' }));
app.get('/health', (req, res) => res.json({ status: 'OK', message: 'Test server is running' }));
app.listen(3000, () => console.log('✅ Test server running on port 3000'));
