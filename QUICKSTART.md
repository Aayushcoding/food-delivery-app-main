# 🚀 Quick Start Guide

## Prerequisites
- Node.js (v16+)
- MongoDB running locally
- Angular CLI 15

## Setup Instructions

### 1️⃣ Backend Setup (5 minutes)

```bash
# Navigate to backend
cd infosys-project-og/backend

# Install dependencies
npm install

# Seed the database (populate with sample data)
npm run seed

# Start the server
npm start
```

✅ Backend running on: `http://localhost:5000`

### 2️⃣ Frontend Setup (5 minutes)

```bash
# In a new terminal, navigate to frontend
cd infosys-project-og/frontend

# Install dependencies
npm install

# Start the development server
ng serve
```

✅ Frontend running on: `http://localhost:4200`

## 🎯 Test the Application

### As a Customer:
1. Go to `http://localhost:4200`
2. Click "Register" → Create account with role "Customer"
3. Browse restaurants on home page
4. Click "View Menu" for any restaurant
5. Add items to cart
6. Go to cart and checkout
7. View orders in "My Orders" page

### As a Restaurant Owner:
1. Register with role "Restaurant Owner"
2. Go to navigation → "Owner Dashboard"
3. Add new menu items
4. Manage orders
5. Update order status

### As a Delivery Agent:
1. Login (mock authentication)
2. Go to "Delivery Dashboard"
3. View assigned deliveries
4. Update delivery status

## 📊 Sample Data

After seeding, the database contains:
- **50 Users** - Customers and Restaurant Owners
- **20 Restaurants** - With various cuisines
- **200 Menu Items** - Multiple categories
- **50 Delivery Agents** - For order delivery
- **100 Orders** - In various statuses
- **50 Carts** - Active shopping carts

## 🔌 API Base URL

```
http://localhost:5000/api
```

## 📱 Key Features to Try

✅ **Browse & Search**
- View all restaurants
- Search restaurants by name
- Filter by cuisine

✅ **Shopping**
- Add items to cart
- Update quantities
- Remove items
- View cart total

✅ **Orders**
- Place new order
- View order history
- Track order status

✅ **Management**
- Add menu items (Owner)
- Manage orders (Owner)
- Track deliveries (Agent)

## 🛠️ Useful Commands

```bash
# Backend
cd backend
npm run seed         # Reset and seed database
npm start           # Start server
npm run dev         # Start with nodemon (auto-reload)

# Frontend
cd frontend
ng serve            # Start dev server
ng build            # Build for production
ng test             # Run unit tests
```

## 🔑 Environment Variables

### Backend (.env)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/foodDelivery
JWT_SECRET=your_jwt_secret_here
```

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED
```
**Solution**: Ensure MongoDB is running
```bash
# Windows
mongod.exe

# Mac/Linux
mongod
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change port in backend `.env` file

### Angular Port Conflict
```bash
ng serve --port 4300
```

## 📚 File Structure Quick Reference

```
backend/
├── server.js          ← Start here
├── config/db.js       ← Database connection
├── models/            ← Data schemas
├── controllers/       ← Business logic
└── routes/            ← API endpoints

frontend/
├── src/app/
│   ├── modules/       ← Feature modules
│   ├── core/          ← Services
│   ├── shared/        ← Reusable components
│   └── app.component  ← Root component
└── angular.json       ← Angular config
```

## 🎓 Learning Path

1. **Understand Database**: Check `backend/models/` for data structure
2. **Explore API**: Check `backend/routes/` for available endpoints
3. **Review Services**: Check `frontend/src/app/core/services/` for API calls
4. **Study Components**: Check `frontend/src/app/modules/` for UI implementation
5. **Test End-to-End**: Interact with the application

## ❓ FAQ

**Q: Where is authentication handled?**
A: `frontend/src/app/core/services/auth.service.ts` - Currently mock, can be integrated with backend API

**Q: How is cart data stored?**
A: `frontend/src/app/core/services/cart.service.ts` - Uses browser localStorage

**Q: Can I use a remote database?**
A: Yes, update `MONGO_URI` in `backend/.env` to your MongoDB connection string

**Q: How to add more sample data?**
A: Edit `backend/seed/seed.js` and run `npm run seed`

## ✨ Next Steps

1. ✅ Get familiar with the project structure
2. ✅ Test all features as different user roles
3. ✅ Study the code for learning
4. ✅ Modify and experiment with features
5. ✅ Deploy to production (when ready)

---

**Happy Coding! 🚀**

For detailed documentation, see:
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Full Project Summary](./PROJECT_SUMMARY.md)