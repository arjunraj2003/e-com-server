import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.registerUser(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.verifyEmail(req.body.email, req.body.otp);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.loginUser(req.body.email, req.body.password);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.refreshTokens(req.body.refreshToken);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await AuthService.logoutUser(req.user!.userId);
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AuthService.forgotPassword(req.body.email);
    res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
  } catch (err) { next(err); }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AuthService.resetPassword(req.body.token, req.body.password);
    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) { next(err); }
};

export const resendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.resendOtp(req.body.email);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};
