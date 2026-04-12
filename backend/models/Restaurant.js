///Restaurant.js
const mongoose=require("mongoose");

const restaurantSchema=new mongoose.Schema({
restaurantId:{
type:String,
required:true,
unique:true
},

restaurantName:{
type:String,
required:true
},

ownerId:{
type:String, // link to User
required:true
},

restaurantContactNo:String,
address:String,
email:String,

cuisine:[String],

isVeg:{
type:Boolean,
default:false
},

rating:{
type:Number,
default:0
},

gstinNo:String,

createdAt:{
type:Date,
default:Date.now
}
});

module.exports=mongoose.model("Restaurant",restaurantSchema);