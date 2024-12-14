const mongoose = require('mongoose');
const {Schema,model}=mongoose;

const UserSchema=new Schema({
    username:{
        type:String,
        required:true,
        min:4,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
   
   
    createdAt:{
        type:Date,
        default:Date.now
    },
    lastLogin:{
        type:Date
    }

});

const UserModel=model('User',UserSchema);

module.exports=UserModel;
