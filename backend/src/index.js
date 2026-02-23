const express = require('express');
const mongoose = require('mongoose');
const cors= require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }))

app.get('/health', (req, res) => {
  res.json({ status: 'ok', project: 'ai-shield' })
})

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(' MongoDB connected'))
  .catch((err) => console.error(' MongoDB error:', err.message))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`)
})