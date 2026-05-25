const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const connectDB = require('../backend/config/db');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

connectDB();

app.use('/api/auth', require('../backend/routes/auth'));
app.use('/api/products', require('../backend/routes/products'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
