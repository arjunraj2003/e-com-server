import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import {
  registerSchema, loginSchema, verifyEmailSchema,
  forgotPasswordSchema, resetPasswordSchema, refreshTokenSchema,
  resendOtpSchema,
} from '../validations/auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/verify-email', validate(verifyEmailSchema), AuthController.verifyEmail);
router.post('/resend-otp', validate(resendOtpSchema), AuthController.resendOtp);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshTokenSchema), AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);
router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);

export default router;
