require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const productRoutes = require('./routes/productRoutes');
const billRoutes = require('./routes/billRoutes');

const app = express();
connectDB();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// BASE URL middleware
app.use((req, res, next) => {
  const port = process.env.PORT || 5001;
  req.baseUrlString = process.env.BASE_URL || `http://localhost:${port}`;
  next();
});

app.use('/api/products', productRoutes);
app.use('/api/bills', billRoutes);

// Dashboard summary
const Product = require('./models/Product');
const Bill = require('./models/Bill');

app.get('/api/dashboard', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const products = await Product.find({});
    const inventoryValue = products.reduce((sum, p) => sum + (p.quantity * p.rate), 0);

    const totalTransactions = await Bill.countDocuments();
    const revenueData = await Bill.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } }}
    ]);
    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    res.json({
      totalProducts,
      inventoryValue,
      totalTransactions,
      totalRevenue
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Dashboard error' });
  }
});

// Health check
app.get('/', (req, res) => res.send({ ok: true, server: 'Ferti Backend Running' }));

app.use((req, res, next) => {
    console.log("🌐 Incoming Request From:", req.ip, req.originalUrl);
    next();
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
