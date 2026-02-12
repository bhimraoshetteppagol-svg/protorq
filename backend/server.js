const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin@evolutionapi.ipbubyl.mongodb.net/Protorq?appName=EvolutionAPI';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB Connected to Protorq database');
  console.log('Database connection state:', mongoose.connection.readyState);
})
.catch(err => {
  console.error('MongoDB Connection Error:', err.message);
  console.error('Full error:', err);
});

// Routes - specific routes first
app.use('/api/auth', require('./routes/auth'));

// Users routes
try {
  const usersRouter = require('./routes/users');
  app.use('/api', usersRouter);
  console.log('Users routes loaded successfully');
  console.log('Available routes: /api/users, /api/employees');
} catch (error) {
  console.error('Error loading users routes:', error);
}

// Products routes
try {
  const productsRouter = require('./routes/products');
  app.use('/api', productsRouter);
  console.log('Products routes loaded successfully');
  console.log('Available routes: /api/products');
} catch (error) {
  console.error('Error loading products routes:', error);
}

// Leads routes
try {
  const leadsRouter = require('./routes/leads');
  app.use('/api', leadsRouter);
  console.log('Leads routes loaded successfully');
  console.log('Available routes: /api/leads');
} catch (error) {
  console.error('Error loading leads routes:', error);
}

// Quotation routes
try {
  const quotationRouter = require('./routes/quotation');
  app.use('/api/quotation', quotationRouter);
  console.log('Quotation routes loaded successfully');
  console.log('Available routes: /api/quotation/generate, /api/quotation/send');
} catch (error) {
  console.error('Error loading quotation routes:', error);
}

// Basic route (must be last to avoid conflicts)
app.get('/api', (req, res) => {
  res.json({ message: 'MERN App Backend API' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

