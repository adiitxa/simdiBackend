require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const productRoutes = require('./routes/productRoutes');
const billRoutes = require('./routes/billRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const dealerRoutes = require('./routes/dealerRoutes');

const app = express();
connectDB();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger - MUST be before routes
app.use((req, res, next) => {
    console.log("🌐 INCOMING REQUEST:", {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });
    next();
});

// Base URL middleware
app.use((req, res, next) => {
    const port = process.env.PORT || 5001;
    req.baseUrlString = process.env.BASE_URL || `http://localhost:${port}`;
    next();
});

app.use('/api/products', productRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/dealers', dealerRoutes);

app.get('/api/bills/debug-test', (req, res) => {
    console.log('✅ BILL DEBUG ROUTE HIT - GET');
    res.json({
        success: true,
        message: 'Bill GET route is working perfectly!',
        timestamp: new Date().toISOString()
    });
});

app.post('/api/bills/debug-test', (req, res) => {
    console.log('✅ BILL DEBUG ROUTE HIT - POST', req.body);
    res.json({
        success: true,
        message: 'Bill POST route is working perfectly!',
        receivedData: req.body,
        timestamp: new Date().toISOString()
    });
});


const Product = require('./models/Product');
const Bill = require('./models/Bill');
const Employee = require('./models/Employee');

app.get('/api/dashboard', async (req, res) => {
    try {
        console.log('📊 Dashboard route hit');
        
        const totalProducts = await Product.countDocuments();
        const products = await Product.find({});
        const inventoryValue = products.reduce((sum, p) => sum + (p.quantity * p.rate), 0);

        const totalTransactions = await Bill.countDocuments();
        const revenueData = await Bill.aggregate([
            { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } }}
        ]);
        const totalRevenue = revenueData[0]?.totalRevenue || 0;
        const totalEmployees = await Employee.countDocuments({ isActive: true });

        res.json({
            success: true,
            data: {
                totalProducts,
                inventoryValue,
                totalTransactions,
                totalRevenue,
                totalEmployees
            }
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Dashboard error',
            error: err.message 
        });
    }
});

app.get('/', (req, res) => res.json({ 
    success: true,
    message: 'Ferti Backend Server Running 🚀',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
}));


app.use((req, res, next) => {
    console.log('❌ 404 - Route not found:', req.method, req.originalUrl);
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        availableRoutes: [
            'GET /',
            'GET /api/dashboard',
            'POST /api/bills',
            'GET /api/bills',
            'GET /api/bills/debug-test',
            'POST /api/bills/debug-test',
            'GET /api/products',
            'GET /api/employees',
            'GET /api/dealers',
            'GET /api/dealers/:employeeId',
            'POST /api/dealers',
            'PUT /api/dealers/:id',
            'DELETE /api/dealers/:id'
        ]
    });
});


app.use((err, req, res, next) => {
    console.error('💥 Global Error Handler:', err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// ======================
// SERVER STARTUP
// ======================
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 FERTI BACKEND SERVER STARTED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🟢 Health Check: http://localhost:${PORT}/`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard`);
    console.log(`🧾 Bills API: http://localhost:${PORT}/api/bills`);
    console.log(`🐛 Debug GET: http://localhost:${PORT}/api/bills/debug-test`);
    console.log(`🐛 Debug POST: http://localhost:${PORT}/api/bills/debug-test`);
    console.log('='.repeat(60));
    console.log('✅ Server is ready to accept requests!');
    console.log('='.repeat(60) + '\n');
});