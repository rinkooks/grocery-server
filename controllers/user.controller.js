import UserModel from "../models/user.model.js";
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";
import sendEmailFun from "../config/sendEmail.js";
import verificationEmail from "../utils/verifyEmailTemplate.js";

export async function registerUserController(request, response) {
   try{
    let user;
    const {name, email, password} = request.body;
    
    if(!name || !email || !password){
        return response.status(400).json({
            message:"provide name email and password",
            error:true,
            success:false
        })
    }
    user  = await UserModel.findOne({email:email.toLowerCase().trim()});

    if(user){
        return response.status(409).json({
            message:"User already registered with this email",
            error:true,
            success:false
        })
    }

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString()

    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(password, salt);

    user = new UserModel({
        email:email,
        password:hashPassword,
        name:name.trim(),
        otp:verifyCode,
        otpExpires: Date.now() + 600000
    })

    await user.save();

    await sendEmailFun({
       sendTo: user.email,
       subject:"Verify email from nopcommerce",
       text:`Your verification code is ${verifyCode}`,
       html:verificationEmail(name, verifyCode)
    })

    const  token = jwt.sign(
        {email:user.email, id:user._id},
        process.env.JSON_WEB_TOKEN_SECRET_KEY,
        {expiresIn: "1h",}   
    )
    return response.status(201).json({
        success:true,
        error:false,
        message:"User Registred successfully! Please verify your email",
        token:token
    })

   }catch(error){
    console.error("Registration error:", error);
    return response.status(500).json({
        success:false,
        error:true,
        message: error.message || "Internal server error",
    })    
   }
}

export async function verifyEmailController(request, response) {
    try {
      const {email, otp } = request.body;      
      const user  = await UserModel.findOne({email:email});

      if(!user){
        return response.status(409).json({
            message:"User not found",
            error:true,
            success:false
        })
    }

    const isCodeValid = user.otp === otp;
    const isNotExpired = user.otpExpires > Date.now();

    if(isCodeValid && isNotExpired){
        user.verify_Email = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        return response.status(200).json({
            message:"Email Verified",
            error:false,
            success:true
        })
    }
    else if(!isCodeValid){
        return response.status(409).json({
            message:"Invalid OTP",
            error:true,
            success:false
        })
    }else{
        return response.status(409).json({
            message:"OTP Expired",
            error:true,
            success:false
        })   
    }
        
    } catch (error) {
      return response.status(500).json({
        success:false,
        error:true,
        message: error.message || "Internal server error",
    })    
    }
}

export async function loginUserController(request, response) {
    try {
       const { email, password } = request.body;
       
       const user = await UserModel.findOne({email:email});
       if(!user){
         return response.status(400).json({
            message:"User not register",
            error:true,
            success:false
        })
       }
       if(user.status !== "Active"){
         return response.status(400).json({
            message:"Contact to Admin",
            error:true,
            success:false
        })
       }
       if(user?.verify_Email !== true){
         return response.status(400).json({
            message:"Your email is not verify yet please verify your email address",
            error:true,
            success:false
        })
       }  
       const checkPassword = await bcryptjs.compare(password, user.password);
       if(!checkPassword){
        return response.status(400).json({
            message:"Check your password",
            error:true,
            success:false
        })
       }
       const accessToken = await generateAccessToken(user?._id);
       const refreshToken = await generateRefreshToken(user?._id);

       const updateUser = await UserModel.findByIdAndUpdate(user?._id,{
          last_login_date: new Date()
       })
       const cookiesOption={
          httpOnly:true,
          secure:true,
          sameSite:"None"
       }
       response.cookie('accessToken', accessToken, cookiesOption);
       response.cookie('refreshToken', refreshToken, cookiesOption);

       return response.json({
         message:"Login successfully",
         error:false,
         success:true,
         data:{
            accessToken,
            refreshToken
         }
       })

     } catch (error) {
      return response.status(500).json({
        success:false,
        error:true,
        message: error.message || "Internal server error",
    })    
    }
}

export async function logoutController(request, response) {
   try {
    const userId = request?.userId;
    const cookiesOption={
       httpOnly:true,
       secure:true,
       sameSite:"None"
    }
    response.clearCookie('accessToken', cookiesOption);
    response.clearCookie('refresToken', cookiesOption);

    const removeRefreshToken = await UserModel.findByIdAndUpdate(userId, {
        refresh:""
    })
    return response.json({
        message:"Logout Successfully",
        error:false,
        success:true
    })
    
  }catch(error){   
    return response.status(500).json({
        success:false,
        error:true,
        message: error.message || "Internal server error",
    })    
   }
}

export async function forgotPasswordController(request, response) {
   try {
     const {email} = request.body;
     const user = await UserModel.findOne({email:email});
     
     if(!user){
        return response.status(400).json({
            message:"User not available",
            error:true,
            success:false
        })
    }else{
       const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
       
       user.otp = verifyCode;
       user.otpExpires = Date.now() + 600000

       await user.save();

       await sendEmailFun({
         sendTo:email,
         subject:"Verify OTP from Nopcommerce",
         text:"",
         html:verificationEmail(user.name, verifyCode)
       })
       
       return response.json({
          message:"Check your email",
          error:false,
          success:true
       })

    }

   }catch(error){   
    return response.status(500).json({
        success:false,
        error:true,
        message: error.message || "Internal server error",
    })    
   }
}

export async function verifyForgotPasswordController(request, response) {
    try {
     const  {email, otp} = request.body;

     const user  = await UserModel.findOne({email:email});

      if(!user){
        return response.status(409).json({
            message:"User not found with this email",
            error:true,
            success:false
        })
    }
    if(!email || !otp){
        return response.status(400).json({
            message: "Provide required field email, otp",
            error: true,
            success: false
        })
    }
    if(otp !== user.otp){
        return response.status(400).json({
            message: "Invalid otp",
            error: true,
            success: false
        }) 
    }

    const currentTime = new Date().toString();
    if(user.otpExpires < currentTime){
       return response.status(400).json({
            message: "OTP is expired",
            error: true,
            success: false
        })  
    }
    user.otp = "";
    user.otpExpires = "";

    await user.save();

     return response.status(400).json({
         message: "Verified OTP successfully",
         error: false,
         success: true
      }) 

        
    } catch (error) {
    return response.status(500).json({
        success:false,
        error:true,
        message: error.message || "Internal server error",
    })   
    }
} 

export async function changePasswordControllerOTP(request, response) {
   try {
    const {email, newPassword, confirmPassword } = request.body;
    
    if(!email || !newPassword || !confirmPassword){
      return response.status(400).json({
         message: "Provide required fields email, new password and confirm password ",
         error: true,
         success: false
      })   
    }
    const user  = await UserModel.findOne({email:email});
    if(!user){
    return response.status(400).json({
        message:"User not found with this email",
        error:true,
        success:false
    })
    }
    if(newPassword !== confirmPassword){
     return response.status(400).json({
        message:"new password and confirm password must be same",
        error:true,
        success:false
    })   
    }
    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(confirmPassword, salt);

    user.password = hashPassword;
    user.signUpWithGoogle = false;
    await user.save();

    return response.status(200).json({
        message:"password updated successfully",
        error:false,
        success:true
    })   

   } catch (error) {
     return response.status(500).json({
        success:false,
        error:true,
        message: error.message || "Internal server error",
    }) 
   } 
}

export async function resendOtpController(request, response) {
    const { email} = request.body;

    let user;    
    user  = await UserModel.findOne({email:email});

    if(!user){
        return response.status(409).json({
            message:"User Not registered with this email",
            error:true,
            success:false
        })
    }
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString()

    user = new UserModel({       
        otp:verifyCode,
        otpExpires: Date.now() + 600000
    })

    await user.save();

    return response.status(201).json({
        success:true,
        error:false,
        message:"OTP Send successfully! Please verify your email"      
    })
}
