const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const DeliveryAgent = require('../models/DeliveryAgent');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/foodDelivery', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  seedData();
}).catch(err => console.error('Connection error:', err));

async function seedData() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await Menu.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});
    await DeliveryAgent.deleteMany({});

    console.log('Cleared existing data');

    // Read data from JSON file
    const dbPath = path.join(__dirname, '../config/db.json');
    const rawData = fs.readFileSync(dbPath, 'utf8');
    const data = JSON.parse(rawData);

    // Hash passwords for users
    const hashedUsers = await Promise.all(data.users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return {
        ...user,
        password: hashedPassword
      };
    }));

    // Insert data using insertMany
    await User.insertMany(hashedUsers);
    console.log(`Inserted ${hashedUsers.length} users`);

    await Restaurant.insertMany(data.restaurants);
    console.log(`Inserted ${data.restaurants.length} restaurants`);

    await Menu.insertMany(data.menus);
    console.log(`Inserted ${data.menus.length} menu items`);

    await DeliveryAgent.insertMany(data.deliveryAgents);
    console.log(`Inserted ${data.deliveryAgents.length} delivery agents`);

    await Order.insertMany(data.orders);
    console.log(`Inserted ${data.orders.length} orders`);

    await Cart.insertMany(data.carts);
    console.log(`Inserted ${data.carts.length} carts`);

    console.log('Database seeded successfully');
    process.exit();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}