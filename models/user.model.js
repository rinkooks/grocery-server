import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    name:{
      type:String,
      required:[true, "Provide Name"]  
    },
    email:{
        type:String,
        required:[true, "Provide Email"],
        unique:true
    },
    password:{
        type:String,
        required:[true, "Provide password"],      
    },
    avatar:{
        type:String,
        default:""      
    },
    mobile:{
        type:String,
        default:null      
    },
    verify_Email:{
        type:Boolean,
        default:false   
    },
    accessToken:{
        type:String,
        default:''   
    },
    refreshToken:{
        type:String,
        default:''   
    },
    last_login_date:{
        type:Date,
        default:''   
    },
    status:{
        type:String,
        enum:["Active", "InActive", "Suspended"],
        default:'Active'   
    },
    address_details:[
        {
          type:mongoose.Schema.ObjectId,
          ref:'address'  
        }
    ],
    orderHistory:[
        {
          type:mongoose.Schema.ObjectId,
          ref:'order'  
        }
    ],
    otp:{
        type:String
    },
    otpExpires:{
        type:Date
    },
    role:{
      type:String,
      enum:["ADMIN", "USER"],
      default:'USER'  
    },
    signUpWithGoogle:{
      type:Boolean,
      default:false  
    }
},{ timetamps: true}
)

const UserModel = mongoose.model("User", userSchema)

export default UserModel;