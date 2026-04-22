const express  = require('express');
const cors     = require('cors');
const dotenv   = require('dotenv');
const path     = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization','x-auth-token'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',        require('./routes/authRoutes'));
app.use('/api/users',       require('./routes/userRoutes'));
app.use('/api/restaurants', require('./routes/restaurantRoutes'));
app.use('/api/menu',        require('./routes/menuRoutes'));
app.use('/api/cart',        require('./routes/cartRoutes'));
app.use('/api/orders',      require('./routes/orderRoutes'));
app.use('/api/delivery',    require('./routes/deliveryRoutes'));
app.use('/api/agent',       require('./routes/agentRoutes'));
app.use('/api/payment',     require('./routes/paymentRoutes'));
app.use('/api/reviews',     require('./routes/reviewRoutes'));

// ── TEMP DEBUG ROUTES (remove before production) ──────────────────────────────
const { debugMakeAvailable } = require('./controllers/deliveryController');
app.post('/debug/make-available/:orderId', debugMakeAvailable);


// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Server running' }));

// Diagnostic: show restaurants with missing city (no auth needed — useful for debugging)
app.get('/api/health/cities', async (req, res) => {
  const Restaurant = require('./models/Restaurant');
  const all   = await Restaurant.find({}).select('restaurantName city ownerId').lean();
  const missing = all.filter(r => !r.city || !r.city.trim());
  res.json({
    success: true,
    total: all.length,
    missingCity: missing.length,
    restaurants: all.map(r => ({ name: r.restaurantName, city: r.city || '(empty)', ownerId: r.ownerId })),
    fix: 'Owner must edit each restaurant with missing city and save it.'
  });
});

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Server running on http://127.0.0.1:${PORT}`);
});