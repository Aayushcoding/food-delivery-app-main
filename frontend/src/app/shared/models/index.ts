export interface User {
  id: string;
  username: string;
  email: string;
  phoneNo: string;
  address: Address[];
  role: 'Customer' | 'Owner' | 'DeliveryAgent';
  createdAt: Date;
}

export interface Address {
  street: string;
  city: string;
}

export interface Restaurant {
  restaurantId: string;
  restaurantName: string;
  ownerId: string;
  contactNo: string;
  address: string;
  email: string;
  cuisine: string[];
  isVeg: boolean;
  rating: number;
  gstinNo: string;
  imageUrl?: string;
}

export interface Menu {
  menuId: string;
  restaurantId: string;
  itemName: string;
  price: number;
  category: 'FastFood' | 'Indian' | 'Chinese' | 'Continental';
  rating: number;
  isAvailable: boolean;
  description: string;
  isVeg: boolean;
  imageUrl?: string;
}

export interface CartItem {
  itemId: string;
  quantity: number;
  price: number;
  name?: string;
  description?: string;
  image?: string;
}

export interface Cart {
  id: string;
  userId: string;
  restaurantId: string;
  items: CartItem[];
  totalAmount: number;
}

export interface OrderItem {
  itemId: string;
  quantity: number;
  price: number;
}

export interface Order {
  orderId: string;
  userId: string;
  restaurantId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Preparing' | 'Out for Delivery' | 'Delivered';
  date: Date;
  deliveryAgentId: string;
}

export interface DeliveryAgent {
  id: string;
  agentName: string;
  contactNo: string;
  isAvailable: boolean;
  vehicleNo: string;
}