# Food Delivery System - Frontend

Angular 15 frontend application for a Food Delivery System.

## Project Structure

```
src/app/
├── core/
│   ├── services/
│   │   ├── api.service.ts         # HTTP API calls
│   │   ├── auth.service.ts        # Authentication
│   │   └── cart.service.ts        # Cart management
│   └── interceptors/
│       └── auth.interceptor.ts    # HTTP interceptor for auth tokens
├── shared/
│   ├── components/
│   │   ├── navbar/               # Navigation bar
│   │   └── footer/               # Footer
│   └── models/                   # Data models/interfaces
├── modules/
│   ├── auth/                     # Login & Register
│   ├── user/                     # Customer features
│   ├── owner/                    # Restaurant owner features
│   └── delivery/                 # Delivery agent features
└── app-routing.module.ts         # Main routing config
```

## Features

### Auth Module
- Login page
- Register page
- Token-based authentication

### User Module (Customer)
- Home page with featured restaurants
- Browse restaurants
- View restaurant menus
- Add items to cart
- View and manage orders

### Owner Module
- Dashboard with stats
- Add new menu items
- Manage orders
- Update order status

### Delivery Module
- Dashboard with delivery stats
- View assigned deliveries
- Update delivery status

## Services

- **ApiService**: REST API integration with backend
- **AuthService**: User authentication and authorization
- **CartService**: Shopping cart management with local storage

## Installation & Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   ng serve
   ```

3. Navigate to `http://localhost:4200/`

## API Integration

The application connects to the backend API at `http://localhost:5000/api`

Endpoints:
- `/users` - User management
- `/restaurants` - Restaurant data
- `/menus` - Menu items
- `/orders` - Orders
- `/carts` - Shopping cart
- `/delivery-agents` - Delivery agents

## Routing

- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/user/home` - Customer home
- `/user/restaurants` - All restaurants
- `/user/menu/:restaurantId` - Restaurant menu
- `/user/cart` - Shopping cart
- `/user/orders` - Customer orders
- `/owner/dashboard` - Owner dashboard
- `/owner/add-menu` - Add menu items
- `/owner/manage-orders` - Manage orders
- `/delivery/dashboard` - Delivery dashboard
- `/delivery/deliveries` - View deliveries

## Build

Run `ng build` to build the project. Build artifacts stored in `dist/`.

## Technologies Used

- Angular 15
- TypeScript
- RxJS
- HTTP Client
- Angular Forms (Reactive & Template-driven)
- CSS3

## Author

Food Delivery Team
