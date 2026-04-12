////seed.js
const mongoose=require('mongoose');
const fs=require('fs');
const path=require('path');
require('dotenv').config({path:"../.env"});

// ✅ USE SAME DB CONFIG
const connectDB=require('../config/db');

// Models
const User=require('../models/User');
const Restaurant=require('../models/Restaurant');
const Menu=require('../models/Menu');
const Cart=require('../models/Cart');
const Order=require('../models/Order');
const DeliveryAgent=require('../models/DeliveryAgent');

async function seedData(){
try{
// 🔥 CONNECT DB
await connectDB();

console.log('✅ MongoDB Connected');

// 🔥 CLEAR OLD DATA
await User.deleteMany({});
await Restaurant.deleteMany({});
await Menu.deleteMany({});
await Cart.deleteMany({});
await Order.deleteMany({});
await DeliveryAgent.deleteMany({});

console.log('🧹 Old data cleared');

// 🔥 READ db.json
const dbPath=path.join(__dirname,'../config/db.json');
const rawData=fs.readFileSync(dbPath,'utf-8');
const data=JSON.parse(rawData);

// ⚠️ SAFETY CHECK
if(!data){
throw new Error('db.json empty or invalid');
}

// 🔥 INSERT DATA
if(data.users?.length){
await User.insertMany(data.users);
console.log(`👤 Inserted ${data.users.length} users`);
}

if(data.restaurants?.length){
await Restaurant.insertMany(data.restaurants);
console.log(`🏪 Inserted ${data.restaurants.length} restaurants`);
}

if(data.menus?.length){
await Menu.insertMany(data.menus);
console.log(`🍔 Inserted ${data.menus.length} menus`);
}

if(data.deliveryAgents?.length){
await DeliveryAgent.insertMany(data.deliveryAgents);
console.log(`🚴 Inserted ${data.deliveryAgents.length} delivery agents`);
}

if(data.orders?.length){
await Order.insertMany(data.orders);
console.log(`📦 Inserted ${data.orders.length} orders`);
}

if(data.carts?.length){
await Cart.insertMany(data.carts);
console.log(`🛒 Inserted ${data.carts.length} carts`);
}

console.log('\n🎉 DATABASE SEEDED SUCCESSFULLY');

process.exit(0);
}catch(error){
console.error('❌ Seeding error:',error.message);
process.exit(1);
}
}

// RUN
seedData();