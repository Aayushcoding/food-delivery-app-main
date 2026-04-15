# ByteBites — Food Delivery System

A full-stack food delivery web application built with **Angular 15**, **Node.js + Express**, and **MongoDB**.

---

## Requirements

| Tool | Version |
|---|---|
| Node.js | 24.14.0 |
| npm | 11.9.0 |
| Angular CLI | 15.2.11 |
| MongoDB | 8.2.5 |

---

## Setup Instructions

### 1. Clone / Extract the project

```
infosys-project/
├── backend/
└── frontend/
```

### 2. Start MongoDB

Make sure MongoDB is running locally on the default port `27017`.

---

### Backend

```bash
cd backend
npm install
npm start
```

Server runs at: `http://localhost:3000`

---

### Frontend

```bash
cd frontend
npm install
npx ng serve
```

App runs at: `http://localhost:4200`

> The Angular proxy (`proxy.conf.json`) automatically forwards `/api` and `/uploads` requests to the backend.

---

## Features

- **Authentication** — Register and login as Customer or Restaurant Owner (role-based)
- **Restaurant Management** — Owners can create, edit, delete multiple restaurants
- **Menu Management** — Add, edit, toggle availability, delete menu items per restaurant
- **Image Uploads** — Optional image upload (JPG / PNG / SVG) stored locally via Multer; text fallback shown when no image
- **Customer Home** — Browse restaurants, filter by cuisine, search by name
- **Cart System** — Add items, adjust quantities, remove items
- **Order System** — Place orders from cart, view order history, cancel within 5 minutes
- **Owner Orders** — View incoming orders, update order status
- **Profile** — View and edit user profile

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/register/customer | Register customer |
| POST | /api/auth/register/owner | Register owner |
| POST | /api/auth/login | Login (any role) |
| GET | /api/restaurants | List all restaurants |
| POST | /api/restaurants | Create restaurant (Owner) |
| PUT | /api/restaurants/:id | Update restaurant (Owner) |
| DELETE | /api/restaurants/:id | Delete restaurant (Owner) |
| GET | /api/menu | Get available menu items |
| POST | /api/menu | Add menu item (Owner) |
| PUT | /api/menu/:id | Update menu item (Owner) |
| DELETE | /api/menu/:id | Delete menu item (Owner) |
| POST | /api/cart/add-item | Add item to cart |
| PUT | /api/cart/update-quantity | Update item quantity |
| POST | /api/cart/remove-item | Remove item from cart |
| POST | /api/orders | Place order |
| GET | /api/orders/user/:userId | Get user orders |
| PUT | /api/orders/:id/cancel | Cancel order (within 5 min) |

---

## Notes

- No external APIs used — fully offline-capable
- Images are stored in `backend/uploads/` and served statically
- If no image is uploaded, the restaurant/item **name is shown as text** instead
- All IDs are auto-incremented using a MongoDB Counter model (`usr_1`, `rest_1`, `menu_1`, `ord_1`)
- Auth uses a token stored in `localStorage` (format: `logged-in-<userId>-<timestamp>`)

---

## Project Structure

```
backend/
├── config/         db.js
├── controllers/    auth, cart, menu, order, restaurant, user
├── middleware/     auth.js, upload.js
├── models/         Cart, Counter, Menu, Order, Restaurant, User
├── routes/         auth, cart, menu, order, restaurant, user
├── utils/          counter.js, dbManager.js
└── server.js

frontend/src/app/
├── auth/           login, signup
├── core/           guards/auth.guard, services/
├── customer/       customer-home, customer-cart, customer-menu,
│                   customer-orders, customer-profile, item-card, success
├── RestaurantOwner/ home-page, menu, orders, owner-dashboard, profile
└── shared/         navbar
```
