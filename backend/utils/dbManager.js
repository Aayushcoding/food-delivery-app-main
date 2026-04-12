const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../config/db.json');

// ────────────────────────────────────────────────────────────────────
// READ & WRITE DATABASE
// ────────────────────────────────────────────────────────────────────

const readDB = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading db.json:', err);
    return { users: [], restaurants: [], menus: [], carts: [], orders: [], deliveryAgents: [] };
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing db.json:', err);
    throw new Error('Database write failed: ' + err.message);
  }
};

// ────────────────────────────────────────────────────────────────────
// USERS OPERATIONS
// ────────────────────────────────────────────────────────────────────

const getUser = (id) => {
  const db = readDB();
  return db.users.find(u => u.id === id);
};

const getUserByEmail = (email) => {
  const db = readDB();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

const getAllUsers = () => {
  const db = readDB();
  return db.users.map(u => {
    const copy = { ...u };
    delete copy.password;
    return copy;
  });
};

const createUser = (userData) => {
  const db = readDB();
  const newUser = {
    id: userData.id || `usr_${String(db.users.length + 1).padStart(3, '0')}`,
    username: userData.username,
    email: userData.email,
    password: userData.password,
    phoneNo: userData.phoneNo,
    address: userData.address || [],
    role: userData.role || 'Customer',
    createdAt: new Date().toISOString()
  };
  db.users.push(newUser);
  writeDB(db);
  return newUser;
};

const updateUser = (id, updates) => {
  const db = readDB();
  const user = db.users.find(u => u.id === id);
  if (!user) return null;
  
  Object.assign(user, updates);
  writeDB(db);
  return user;
};

const deleteUser = (id) => {
  const db = readDB();
  const index = db.users.findIndex(u => u.id === id);
  if (index === -1) return null;
  
  const deleted = db.users.splice(index, 1);
  writeDB(db);
  return deleted[0];
};

// ────────────────────────────────────────────────────────────────────
// RESTAURANTS OPERATIONS
// ────────────────────────────────────────────────────────────────────

const getRestaurant = (restaurantId) => {
  const db = readDB();
  return db.restaurants.find(r => r.restaurantId === restaurantId);
};

const getRestaurantByOwnerId = (ownerId) => {
  const db = readDB();
  return db.restaurants.find(r => r.ownerId === ownerId);
};

const getAllRestaurants = () => {
  const db = readDB();
  return db.restaurants;
};

const createRestaurant = (restaurantData) => {
  const db = readDB();
  const newRestaurant = {
    restaurantId: restaurantData.restaurantId || `rest_${String(db.restaurants.length + 1).padStart(3, '0')}`,
    ownerId: restaurantData.ownerId,
    restaurantName: restaurantData.restaurantName,
    address: restaurantData.address || '',
    restaurantContactNo: restaurantData.restaurantContactNo,
    email: restaurantData.email,
    gstinNo: restaurantData.gstinNo || '',
    cuisine: restaurantData.cuisine || [],
    isVeg: restaurantData.isVeg || false,
    rating: restaurantData.rating || 0,
    createdAt: new Date().toISOString()
  };
  db.restaurants.push(newRestaurant);
  writeDB(db);
  return newRestaurant;
};

const updateRestaurant = (restaurantId, updates) => {
  const db = readDB();
  const restaurant = db.restaurants.find(r => r.restaurantId === restaurantId);
  if (!restaurant) return null;
  
  Object.assign(restaurant, updates);
  writeDB(db);
  return restaurant;
};

const deleteRestaurant = (restaurantId) => {
  const db = readDB();
  const index = db.restaurants.findIndex(r => r.restaurantId === restaurantId);
  if (index === -1) return null;
  
  const deleted = db.restaurants.splice(index, 1);
  writeDB(db);
  return deleted[0];
};

// ────────────────────────────────────────────────────────────────────
// MENUS OPERATIONS
// ────────────────────────────────────────────────────────────────────

const getMenuItem = (menuId) => {
  const db = readDB();
  return db.menus.find(m => m.menuId === menuId);
};

const getMenuByRestaurant = (restaurantId) => {
  const db = readDB();
  return db.menus.filter(m => m.restaurantId === restaurantId);
};

const getAllMenus = () => {
  const db = readDB();
  return db.menus;
};

const createMenuItem = (menuData) => {
  const db = readDB();
  const newMenu = {
    menuId: menuData.menuId || `menu_${String(db.menus.length + 1).padStart(3, '0')}`,
    restaurantId: menuData.restaurantId,
    itemName: menuData.itemName,
    price: menuData.price,
    description: menuData.description || '',
    isVeg: menuData.isVeg || false,
    category: menuData.category,
    isAvailable: menuData.isAvailable !== false,
    rating: menuData.rating || 0,
    createdAt: new Date().toISOString()
  };
  db.menus.push(newMenu);
  writeDB(db);
  return newMenu;
};

const updateMenuItem = (menuId, updates) => {
  const db = readDB();
  const menu = db.menus.find(m => m.menuId === menuId);
  if (!menu) return null;
  
  Object.assign(menu, updates);
  writeDB(db);
  return menu;
};

const deleteMenuItem = (menuId) => {
  const db = readDB();
  const index = db.menus.findIndex(m => m.menuId === menuId);
  if (index === -1) return null;
  
  const deleted = db.menus.splice(index, 1);
  writeDB(db);
  return deleted[0];
};

// ────────────────────────────────────────────────────────────────────
// CARTS OPERATIONS
// ────────────────────────────────────────────────────────────────────

const getCart = (cartId) => {
  const db = readDB();
  return db.carts.find(c => c.id === cartId);
};

const getCartByUserId = (userId) => {
  const db = readDB();
  return db.carts.find(c => c.userId === userId);
};

const getAllCarts = () => {
  const db = readDB();
  return db.carts;
};

const createCart = (cartData) => {
  const db = readDB();
  
  // Check if cart already exists for this user
  const existing = db.carts.find(c => c.userId === cartData.userId && c.restaurantId === cartData.restaurantId);
  if (existing) {
    return existing;
  }
  
  const newCart = {
    id: cartData.id || `cart_${String(db.carts.length + 1).padStart(3, '0')}`,
    userId: cartData.userId,
    restaurantId: cartData.restaurantId,
    items: cartData.items || [],
    totalAmount: cartData.totalAmount || 0,
    createdAt: new Date().toISOString()
  };
  db.carts.push(newCart);
  writeDB(db);
  return newCart;
};

const updateCart = (cartId, updates) => {
  const db = readDB();
  const cart = db.carts.find(c => c.id === cartId);
  if (!cart) return null;
  
  Object.assign(cart, updates);
  writeDB(db);
  return cart;
};

const addItemToCart = (cartId, item) => {
  const db = readDB();
  const cart = db.carts.find(c => c.id === cartId);
  if (!cart) return null;
  
  const existingIndex = cart.items.findIndex(i => i.itemId === item.itemId);
  if (existingIndex !== -1) {
    cart.items[existingIndex].quantity += item.quantity;
  } else {
    cart.items.push(item);
  }
  
  cart.totalAmount = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  writeDB(db);
  return cart;
};

const removeItemFromCart = (cartId, itemId) => {
  const db = readDB();
  const cart = db.carts.find(c => c.id === cartId);
  if (!cart) return null;
  
  cart.items = cart.items.filter(i => i.itemId !== itemId);
  cart.totalAmount = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  writeDB(db);
  return cart;
};

const clearCart = (cartId) => {
  const db = readDB();
  const cart = db.carts.find(c => c.id === cartId);
  if (!cart) return null;
  
  cart.items = [];
  cart.totalAmount = 0;
  writeDB(db);
  return cart;
};

const deleteCart = (cartId) => {
  const db = readDB();
  const index = db.carts.findIndex(c => c.id === cartId);
  if (index === -1) return null;
  
  const deleted = db.carts.splice(index, 1);
  writeDB(db);
  return deleted[0];
};

// ────────────────────────────────────────────────────────────────────
// ORDERS OPERATIONS
// ────────────────────────────────────────────────────────────────────

const getOrder = (orderId) => {
  const db = readDB();
  return db.orders.find(o => o.id === orderId);
};

const getOrdersByUserId = (userId) => {
  const db = readDB();
  return db.orders.filter(o => o.userId === userId);
};

const getAllOrders = () => {
  const db = readDB();
  return db.orders;
};

const createOrder = (orderData) => {
  const db = readDB();
  const newOrder = {
    id: orderData.id || `order_${String(db.orders.length + 1).padStart(3, '0')}`,
    userId: orderData.userId,
    restaurantId: orderData.restaurantId,
    items: orderData.items || [],
    totalAmount: orderData.totalAmount || 0,
    deliveryAddress: orderData.deliveryAddress || {},
    status: orderData.status || 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.orders.push(newOrder);
  writeDB(db);
  return newOrder;
};

const updateOrder = (orderId, updates) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === orderId);
  if (!order) return null;
  
  Object.assign(order, updates, { updatedAt: new Date().toISOString() });
  writeDB(db);
  return order;
};

const deleteOrder = (orderId) => {
  const db = readDB();
  const index = db.orders.findIndex(o => o.id === orderId);
  if (index === -1) return null;
  
  const deleted = db.orders.splice(index, 1);
  writeDB(db);
  return deleted[0];
};

// ────────────────────────────────────────────────────────────────────
// DELIVERY AGENTS OPERATIONS
// ────────────────────────────────────────────────────────────────────

const getDeliveryAgent = (agentId) => {
  const db = readDB();
  return db.deliveryAgents.find(a => a.id === agentId);
};

const getAllDeliveryAgents = () => {
  const db = readDB();
  return db.deliveryAgents;
};

const createDeliveryAgent = (agentData) => {
  const db = readDB();
  const newAgent = {
    id: agentData.id || `agent_${String(db.deliveryAgents.length + 1).padStart(3, '0')}`,
    name: agentData.name,
    phone: agentData.phone,
    status: agentData.status || 'available',
    currentLocation: agentData.currentLocation || {},
    createdAt: new Date().toISOString()
  };
  db.deliveryAgents.push(newAgent);
  writeDB(db);
  return newAgent;
};

const updateDeliveryAgent = (agentId, updates) => {
  const db = readDB();
  const agent = db.deliveryAgents.find(a => a.id === agentId);
  if (!agent) return null;
  
  Object.assign(agent, updates);
  writeDB(db);
  return agent;
};

const deleteDeliveryAgent = (agentId) => {
  const db = readDB();
  const index = db.deliveryAgents.findIndex(a => a.id === agentId);
  if (index === -1) return null;
  
  const deleted = db.deliveryAgents.splice(index, 1);
  writeDB(db);
  return deleted[0];
};

// ────────────────────────────────────────────────────────────────────
// EXPORTS
// ────────────────────────────────────────────────────────────────────

module.exports = {
  readDB,
  writeDB,
  
  // Users
  getUser,
  getUserByEmail,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  
  // Restaurants
  getRestaurant,
  getRestaurantByOwnerId,
  getAllRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  
  // Menus
  getMenuItem,
  getMenuByRestaurant,
  getAllMenus,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  
  // Carts
  getCart,
  getCartByUserId,
  getAllCarts,
  createCart,
  updateCart,
  addItemToCart,
  removeItemFromCart,
  clearCart,
  deleteCart,
  
  // Orders
  getOrder,
  getOrdersByUserId,
  getAllOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  
  // Delivery Agents
  getDeliveryAgent,
  getAllDeliveryAgents,
  createDeliveryAgent,
  updateDeliveryAgent,
  deleteDeliveryAgent
};
