////Cart.js
// models/Cart.js
// Exact fields: id, userId, restaurantId, items[{itemId, quantity, price}], totalAmount
// All IDs are STRING — DO NOT use ObjectId or ref

const mongoose=require('mongoose');

const cartItemSchema=new mongoose.Schema(
{
itemId:{type:String,required:true,trim:true},
quantity:{type:Number,required:true,min:1},
price:{type:Number,required:true,min:0}
},
{_id:false}
);

const cartSchema=new mongoose.Schema(
{
id:{type:String,required:true,unique:true,trim:true},
userId:{type:String,required:true,trim:true}, // STRING ref to users.id
restaurantId:{type:String,required:true,trim:true}, // STRING ref to restaurants.restaurantId
items:{type:[cartItemSchema],default:[]},
totalAmount:{type:Number,default:0}
},
{versionKey:false}
);

// Add indexes for performance
cartSchema.index({userId:1,restaurantId:1}); // Compound index for cart lookups
cartSchema.index({'items.itemId':1}); // For item searches

module.exports=mongoose.model('Cart',cartSchema);