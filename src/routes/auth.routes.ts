import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import * as PhoneAuthController from '../controllers/phoneAuth.controller';
import * as GoogleAuthController from '../controllers/googleAuth.controller';
import * as GuestAuthController from '../controllers/guestAuth.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import passport from '../config/passport';
import {
  registerSchema, loginSchema, verifyEmailSchema,
  forgotPasswordSchema, resetPasswordSchema, refreshTokenSchema,
  resendOtpSchema,
} from '../validations/auth.schema';

const router = Router();

// ─── Existing local auth ───────────────────────────────────────────
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/verify-email', validate(verifyEmailSchema), AuthController.verifyEmail);
router.post('/resend-otp', validate(resendOtpSchema), AuthController.resendOtp);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshTokenSchema), AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);
router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);

// ─── Google OAuth ──────────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/auth/login?error=google_failed` }),
  GoogleAuthController.googleCallback
);

// ─── Phone OTP ─────────────────────────────────────────────────────
router.post('/phone/send-otp', PhoneAuthController.sendOtp);
router.post('/phone/verify-otp', PhoneAuthController.verifyOtp);

// ─── Guest Checkout ────────────────────────────────────────────────
router.post('/guest', GuestAuthController.guestLogin);
router.post('/guest/upgrade', authenticate, GuestAuthController.upgradeGuest);

export default router;
