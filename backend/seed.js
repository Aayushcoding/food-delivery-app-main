const mongoose = require('mongoose');
const faker = require('faker');

// Import models
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const Menu = require('./models/Menu');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const DeliveryAgent = require('./models/DeliveryAgent');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/foodDelivery', {
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

    // Generate Users
    const users = [];
    for (let i = 0; i < 1000; i++) {
      users.push({
        id: faker.datatype.uuid(),
        username: faker.internet.userName(),
        email: faker.internet.email(),
        phoneNo: faker.phone.phoneNumber(),
        password: faker.internet.password(),
        address: [{
          street: faker.address.streetAddress(),
          city: faker.address.city()
        }],
        role: faker.random.arrayElement(['Customer', 'Owner'])
      });
    }
    await User.insertMany(users);
    console.log('Inserted 1000 users');

    // Generate Restaurants
    const restaurants = [];
    const owners = users.filter(u => u.role === 'Owner');
    for (let i = 0; i < 100; i++) {
      restaurants.push({
        restaurantId: faker.datatype.uuid(),
        restaurantName: faker.company.companyName(),
        ownerId: faker.random.arrayElement(owners).id,
        restaurantContactNo: faker.phone.phoneNumber(),
        address: faker.address.streetAddress(),
        email: faker.internet.email(),
        cuisine: faker.random.arrayElements(['Indian', 'Chinese', 'Italian', 'Mexican'], faker.datatype.number({ min: 1, max: 3 })),
        isVeg: faker.datatype.boolean(),
        rating: faker.datatype.float({ min: 0, max: 5 }),
        gstinNo: faker.datatype.string(15)
      });
    }
    await Restaurant.insertMany(restaurants);
    console.log('Inserted 100 restaurants');

    // Generate Menu Items
    const menus = [];
    for (let i = 0; i < 500; i++) {
      menus.push({
        menuId: faker.datatype.uuid(),
        restaurantId: faker.random.arrayElement(restaurants).restaurantId,
        itemName: faker.random.words(2),
        price: faker.datatype.number({ min: 50, max: 500 }),
        category: faker.random.arrayElement(['FastFood', 'Indian', 'Chinese', 'Continental']),
        rating: faker.datatype.float({ min: 0, max: 5 }),
        isAvailable: faker.datatype.boolean(),
        description: faker.lorem.sentence(),
        isVeg: faker.datatype.boolean()
      });
    }
    await Menu.insertMany(menus);
    console.log('Inserted 500 menu items');

    // Generate Delivery Agents
    const agents = [];
    for (let i = 0; i < 50; i++) {
      agents.push({
        id: faker.datatype.uuid(),
        agentName: faker.name.findName(),
        contactNo: faker.phone.phoneNumber(),
        isAvailable: faker.datatype.boolean(),
        vehicleNo: faker.vehicle.vin()
      });
    }
    await DeliveryAgent.insertMany(agents);
    console.log('Inserted 50 delivery agents');

    // Generate Carts
    const carts = [];
    const customers = users.filter(u => u.role === 'Customer');
    for (let i = 0; i < 200; i++) {
      const cartItems = [];
      for (let j = 0; j < faker.datatype.number({ min: 1, max: 5 }); j++) {
        cartItems.push({
          itemId: faker.random.arrayElement(menus).menuId,
          quantity: faker.datatype.number({ min: 1, max: 3 }),
          price: faker.datatype.number({ min: 50, max: 500 })
        });
      }
      carts.push({
        id: faker.datatype.uuid(),
        userId: faker.random.arrayElement(customers).id,
        restaurantId: faker.random.arrayElement(restaurants).restaurantId,
        items: cartItems,
        totalAmount: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      });
    }
    await Cart.insertMany(carts);
    console.log('Inserted 200 carts');

    // Generate Orders
    const orders = [];
    for (let i = 0; i < 300; i++) {
      const orderItems = [];
      for (let j = 0; j < faker.datatype.number({ min: 1, max: 5 }); j++) {
        orderItems.push({
          itemId: faker.random.arrayElement(menus).menuId,
          quantity: faker.datatype.number({ min: 1, max: 3 }),
          price: faker.datatype.number({ min: 50, max: 500 })
        });
      }
      orders.push({
        orderId: faker.datatype.uuid(),
        userId: faker.random.arrayElement(customers).id,
        restaurantId: faker.random.arrayElement(restaurants).restaurantId,
        items: orderItems,
        totalAmount: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        status: faker.random.arrayElement(['Pending', 'Preparing', 'Out for Delivery', 'Delivered']),
        date: faker.date.recent(),
        deliveryAgentId: faker.random.arrayElement(agents).id
      });
    }
    await Order.insertMany(orders);
    console.log('Inserted 300 orders');

    console.log('Seeding completed successfully');
    process.exit();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}