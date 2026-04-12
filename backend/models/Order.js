/////Order.js
const mongoose=require("mongoose");

const orderItemSchema=new mongoose.Schema(
{
itemId:{
type:String,
required:true,
trim:true,
},
name:{
type:String,
required:true,
trim:true,
},
quantity:{
type:Number,
required:true,
min:[1,"Quantity must be at least 1"],
},
price:{
type:Number,
required:true,
min:[0,"Price cannot be negative"],
},
totalAmount:{
type:Number,
required:true,
min:[0,"Total amount cannot be negative"],
},
},
{_id:false}
);

const orderSchema=new mongoose.Schema(
{
userId:{
type:String,
required:[true,"userId is required"],
trim:true,
},
restaurantId:{
type:String,
required:[true,"restaurantId is required"],
trim:true,
},
deliveryAgentId:{
type:String,
trim:true,
default:null,
},
items:{
type:[orderItemSchema],
validate:{
validator:(items)=>items.length>0,
message:"Order must contain at least one item",
},
},
totalAmount:{
type:Number,
required:true,
min:[0,"Total amount cannot be negative"],
},
deliveryAddress:{
street:{type:String,required:true,trim:true},
city:{type:String,required:true,trim:true},
state:{type:String,required:true,trim:true},
zip:{type:String,required:true,trim:true},
},
status:{
type:String,
enum:["pending","confirmed","preparing","out_for_delivery","delivered","cancelled"],
default:"pending",
},
},
{timestamps:true}
);

module.exports=mongoose.model("Order",orderSchema);