# Food Delivery System - Complete Project

## 📋 Project Overview

A full-stack food delivery application built with:
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Frontend**: Angular 15 + TypeScript + RxJS

## 🏗️ Project Structure

```
infosys-project-og/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── models/
│   │   ├── User.js
│   │   ├── Restaurant.js
│   │   ├── Menu.js
│   │   ├── Cart.js
│   │   ├── Order.js
│   │   └── DeliveryAgent.js
│   ├── controllers/
│   │   ├── userController.js
│   │   ├── restaurantController.js
│   │   ├── menuController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   └── deliveryController.js
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── restaurantRoutes.js
│   │   ├── menuRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── orderRoutes.js
│   │   └── deliveryRoutes.js
│   ├── seed/
│   │   └── seed.js                 # Database seeding script
│   ├── utils/
│   │   └── idGenerator.js
│   ├── .env
│   ├── package.json
│   ├── server.js                   # Express server
│   └── README.md
│
└── frontend/
    ├── src/app/
    │   ├── core/
    │   │   ├── services/
    │   │   │   ├── api.service.ts
    │   │   │   ├── auth.service.ts
    │   │   │   └── cart.service.ts
    │   │   └── interceptors/
    │   │       └── auth.interceptor.ts
    │   ├── shared/
    │   │   ├── components/
    │   │   │   ├── navbar/
    │   │   │   └── footer/
    │   │   └── models/
    │   │       └── index.ts
    │   ├── modules/
    │   │   ├── auth/
    │   │   │   ├── login/
    │   │   │   ├── register/
    │   │   │   ├── auth.module.ts
    │   │   │   └── auth-routing.module.ts
    │   │   ├── user/
    │   │   │   ├── home/
    │   │   │   ├── restaurant-list/
    │   │   │   ├── menu/
    │   │   │   ├── cart/
    │   │   │   ├── orders/
    │   │   │   ├── user.module.ts
    │   │   │   └── user-routing.module.ts
    │   │   ├── owner/
    │   │   │   ├── dashboard/
    │   │   │   ├── add-menu/
    │   │   │   ├── manage-orders/
    │   │   │   ├── owner.module.ts
    │   │   │   └── owner-routing.module.ts
    │   │   └── delivery/
    │   │       ├── dashboard/
    │   │       ├── deliveries/
    │   │       ├── delivery.module.ts
    │   │       └── delivery-routing.module.ts
    │   ├── app-routing.module.ts
    │   ├── app.module.ts
    │   ├── app.component.ts
    │   └── app.component.html
    ├── angular.json
    ├── package.json
    ├── tsconfig.json
    └── README.md
```

## 🎯 Features Implemented

### Backend Features
- ✅ RESTful API with Express.js
- ✅ MongoDB database with Mongoose models
- ✅ CRUD operations for all entities
- ✅ Database seeding with realistic data
- ✅ Modular routing and controllers
- ✅ Environment configuration (.env)

### Frontend Features
- ✅ Angular 15 with modular architecture
- ✅ Lazy loading for all modules
- ✅ Authentication & Authorization
- ✅ Cart management with local storage
- ✅ HTTP interceptors for API calls
- ✅ Responsive design with CSS3
- ✅ Type-safe TypeScript interfaces

### User Features
- Customer authentication (login/register)
- Browse restaurants and menus
- Add items to cart
- Place orders
- View order history
- Track delivery status

### Owner Features
- Dashboard with statistics
- Add/manage menu items
- View and manage customer orders
- Update order status

### Delivery Agent Features
- Dashboard with delivery stats
- View assigned deliveries
- Update delivery status
- Track earnings

## 🚀 Getting Started

### Backend Setup

1. Navigate to backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup MongoDB:
   - Ensure MongoDB is running on localhost:27017
   - Or update `MONGO_URI` in `.env`

4. Seed the database:
   ```bash
   npm run seed
   ```

5. Start the server:
   ```bash
   npm start
   ```
   Server runs on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   ng serve
   ```
   or
   ```bash
   npm start
   ```

4. Navigate to `http://localhost:4200/`

## 📊 Database Schema

### User
```javascript
{
  id: String (unique),
  username: String,
  email: String (unique),
  phoneNo: String,
  password: String,
  address: [{ street, city }],
  role: 'Customer' | 'Owner',
  createdAt: Date
}
```

### Restaurant
```javascript
{
  restaurantId: String (unique),
  restaurantName: String,
  ownerId: String,
  contactNo: String,
  address: String,
  email: String,
  cuisine: [String],
  isVeg: Boolean,
  rating: Number,
  gstinNo: String
}
```

### Menu
```javascript
{
  menuId: String (unique),
  restaurantId: String,
  itemName: String,
  price: Number,
  category: 'FastFood' | 'Indian' | 'Chinese' | 'Continental',
  rating: Number,
  isAvailable: Boolean,
  description: String,
  isVeg: Boolean
}
```

### Order
```javascript
{
  orderId: String (unique),
  userId: String,
  restaurantId: String,
  items: [{ itemId, quantity, price }],
  totalAmount: Number,
  status: 'Pending' | 'Preparing' | 'Out for Delivery' | 'Delivered',
  date: Date,
  deliveryAgentId: String
}
```

### Cart
```javascript
{
  id: String (unique),
  userId: String,
  restaurantId: String,
  items: [{ itemId, quantity, price }],
  totalAmount: Number
}
```

### DeliveryAgent
```javascript
{
  id: String (unique),
  agentName: String,
  contactNo: String,
  isAvailable: Boolean,
  vehicleNo: String
}
```

## 🔗 API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Restaurants
- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurants/:id` - Get single restaurant
- `POST /api/restaurants` - Create restaurant
- `PUT /api/restaurants/:id` - Update restaurant
- `DELETE /api/restaurants/:id` - Delete restaurant

### Menus
- `GET /api/menus` - Get all menu items
- `GET /api/menus/:id` - Get single menu item
- `POST /api/menus` - Create menu item
- `PUT /api/menus/:id` - Update menu item
- `DELETE /api/menus/:id` - Delete menu item

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Cart
- `GET /api/carts` - Get all carts
- `GET /api/carts/:id` - Get single cart
- `POST /api/carts` - Create cart
- `PUT /api/carts/:id` - Update cart
- `DELETE /api/carts/:id` - Delete cart

### Delivery Agents
- `GET /api/delivery-agents` - Get all agents
- `GET /api/delivery-agents/:id` - Get single agent
- `POST /api/delivery-agents` - Create agent
- `PUT /api/delivery-agents/:id` - Update agent
- `DELETE /api/delivery-agents/:id` - Delete agent

## 🛣️ Frontend Routes

- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/user/home` - Customer dashboard
- `/user/restaurants` - Browse all restaurants
- `/user/menu/:restaurantId` - View restaurant menu
- `/user/cart` - Shopping cart
- `/user/orders` - Order history
- `/owner/dashboard` - Owner dashboard
- `/owner/add-menu` - Add menu items
- `/owner/manage-orders` - Manage orders
- `/delivery/dashboard` - Delivery dashboard
- `/delivery/deliveries` - View deliveries

## 🔐 Authentication

- Mock authentication implemented in frontend
- Stores token in localStorage
- Auth interceptor adds token to API requests
- Auth service manages user sessions

## 💾 Data Seeding

Run this command to seed database with sample data:
```bash
npm run seed
```

This generates:
- 50 users (mix of customers and owners)
- 20 restaurants
- 200 menu items
- 50 delivery agents
- 100 orders
- 50 shopping carts

## 📦 Dependencies

### Backend
- express: Web framework
- mongoose: MongoDB ODM
- dotenv: Environment variables
- bcryptjs: Password hashing (ready to use)
- jsonwebtoken: JWT authentication (ready to use)

### Frontend
- @angular/core: Angular framework
- @angular/common: Common utilities
- @angular/forms: Form handling
- @angular/router: Routing
- @angular/http: HTTP client
- rxjs: Reactive programming

## 🎨 UI/UX Features

- Responsive design for mobile and desktop
- Clean and modern interface
- Color scheme: Orange (#ff6b35) and white
- Smooth transitions and hover effects
- Form validation with error messages
- Loading states for async operations

## 🔧 Technologies Used

**Backend:**
- Node.js
- Express.js
- MongoDB
- Mongoose

**Frontend:**
- Angular 15
- TypeScript
- RxJS
- CSS3
- HTML5

## 📝 Notes

- Frontend uses mock authentication (can be integrated with real backend API)
- Cart data is stored in localStorage
- All operations are client-side for demo purposes
- Real implementation would require server-side validation and business logic

## 🚦 Next Steps

1. Integrate frontend authentication with backend
2. Implement payment gateway integration
3. Add real-time order tracking with WebSockets
4. Add email notifications
5. Implement reviews and ratings system
6. Add admin dashboard

## 👨‍💻 Author

Food Delivery Team