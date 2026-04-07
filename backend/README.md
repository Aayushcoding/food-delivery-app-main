# Food Delivery App Schemas

This project contains Mongoose schemas for a food delivery application.

## Models

- **User**: User information including customers and owners
- **Restaurant**: Restaurant details
- **Menu**: Menu items for restaurants
- **Cart**: Shopping cart for users
- **Order**: Order details
- **DeliveryAgent**: Delivery agent information

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start MongoDB locally on port 27017.

3. Run the seed script to generate large dataset:
   ```
   npm run seed
   ```

This will generate:
- 1000 users
- 100 restaurants
- 500 menu items
- 50 delivery agents
- 200 carts
- 300 orders

## Usage

Require the models in your application:

```javascript
const User = require('./models/User');
// etc.
```