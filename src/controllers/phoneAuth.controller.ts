import { Request, Response, NextFunction } from 'express';
import { sendPhoneOtp, verifyPhoneOtp } from '../services/phoneAuth.service';

export const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit Indian mobile number' });
    }
    const result = await sendPhoneOtp(phone);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }
    const result = await verifyPhoneOtp(phone, otp);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
