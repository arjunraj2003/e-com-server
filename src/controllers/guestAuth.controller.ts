import { Request, Response, NextFunction } from 'express';
import { createGuestUser, upgradeGuestUser } from '../services/guestAuth.service';
import { AuthRequest } from '../middlewares/auth';

export const guestLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone, email } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required for guest checkout' });
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit Indian mobile number' });
    }
    const result = await createGuestUser({ name, phone, email });
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const upgradeGuest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { phone, otp } = req.body;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }
    const result = await upgradeGuestUser(userId, phone, otp);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
