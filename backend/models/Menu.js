////Menu.js
const mongoose=require("mongoose");

const menuSchema=new mongoose.Schema({
menuId:{
type:String,
required:true,
unique:true
},

restaurantId:{
type:String,
required:true
},

itemName:{
type:String,
required:true
},

price:{
type:Number,
required:true
},

category:{
type:String,
enum:["FastFood","Indian","Chinese","Continental"]
},

rating:{
type:Number,
default:0
},

isAvailable:{
type:Boolean,
default:true
},

description:String,
isVeg:Boolean
});

module.exports=mongoose.model("Menu",menuSchema);