# Food Delivery Application - Full Stack

An Angular frontend with Node.js + Express backend for a food delivery system. Uses **JSON-based database** (`db.json`) with **localStorage authentication** (JWT disabled for development).

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npm start
```
Runs on `http://localhost:5000`

### Frontend Setup
```bash
cd frontend
npm install
ng serve --open
```
Opens at `http://localhost:4200`

### Integration Check
```bash
node integration-check.js
```

## 🔐 Authentication

- **Login**: `POST /api/auth/login` with `email` + `password`
- **User stored in**: `localStorage` as `user` object
- **Roles**: Customer, Owner, DeliveryAgent, Admin
- **Test Credentials**: 
  - Email: `ishita.kumar11@example.com`
  - Password: `password123`

## 📁 Project Structure

```
.
├── backend/
│   ├── controllers/      # Business logic
│   ├── models/          # Data models
│   ├── routes/          # API endpoints
│   ├── middleware/      # Custom middleware
│   ├── config/          # Database (db.json)
│   ├── utils/           # Utilities (dbManager)
│   └── server.js        # Express server
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/    # Services, guards, interceptors
│   │   │   ├── auth/    # Login, signup
│   │   │   ├── customer/
│   │   │   └── RestaurantOwner/
│   │   └── environments/
│   └── angular.json
│
├── STARTUP_GUIDE.md     # Complete setup guide
├── integration-check.js # Integration verification
└── README.md
```

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| GET | `/api/restaurants` | Get all restaurants |
| GET | `/api/menu` | Get all menu items |
| POST | `/api/cart/add-item` | Add item to cart |
| GET | `/api/cart/user/:userId` | Get user cart |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/user/:userId` | Get user orders |

## 📋 Key Features

✅ Full-stack JavaScript (Node.js + Angular)  
✅ JSON-based database (db.json)  
✅ localStorage authentication  
✅ Role-based access control  
✅ One cart per user per restaurant  
✅ Complete order workflow  
✅ CORS enabled for frontend-backend communication  

## 🧪 Testing

```bash
# Verify backend is running
curl http://localhost:5000/api/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ishita.kumar11@example.com","password":"password123"}'
```

## 📚 Documentation

- **[STARTUP_GUIDE.md](./STARTUP_GUIDE.md)** - Complete setup and configuration guide
- **[integration-check.js](./integration-check.js)** - Integration verification script

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Ensure backend is running on port 5000 |
| Login fails | Check db.json has users with hashed passwords |
| API returns 404 | Verify routes match backend/routes/*.js |
| Frontend blank | Check browser console for errors |

## ✅ Status
- Backend: ✅ Running on port 5000
- Frontend: ✅ Running on port 4200
- Integration: ✅ All endpoints tested and working
- Database: ✅ JSON-based db.json with 57 users, 20 restaurants, 200+ menu items

---

**Last Updated**: April 12, 2026  
**Status**: ✅ Frontend & Backend Fully Integrated
