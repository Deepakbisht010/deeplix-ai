require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');

const app = express();            // ✅ pehle app banao
app.set('trust proxy', 1);        // ✅ phir use karo

connectDB();

// Security & Logging
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// ✅ CORRECT ROUTE PATH
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/chat', require('./src/routes/chat'));
app.use('/api/tasks', require('./src/routes/tasks'));
app.use('/api/users', require('./src/routes/users'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});