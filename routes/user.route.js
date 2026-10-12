import {Router} from 'express';
import { changePasswordControllerOTP, forgotPasswordController, loginUserController, logoutController, registerUserController, verifyEmailController, verifyForgotPasswordController } from '../controllers/user.controller.js';
import auth from '../middlewares/auth.js';

const userRouter = Router();
userRouter.post('/register', registerUserController);
userRouter.post('/verifyEmail', verifyEmailController);
userRouter.post('/login', loginUserController);
userRouter.post('/logout', logoutController);
userRouter.post('/forgot-password', forgotPasswordController);
userRouter.post('/verify-forgot-password-otp', verifyForgotPasswordController);
userRouter.post('/forgot-password/change-password', changePasswordControllerOTP);

export default userRouter; 