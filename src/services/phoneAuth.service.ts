import { AppDataSource } from '../config/data-source';
import { User, AuthProvider, UserRole } from '../models/User';
import { AppError } from '../middlewares/errorHandler';
import { generateAccessToken, generateRefreshToken } from '../utils/tokens';
import { cacheGet, cacheSet, cacheDel } from '../config/redis';
import { sendSmsOtp } from '../utils/sms';

const userRepo = () => AppDataSource.getRepository(User);

const OTP_TTL = 5 * 60;           // 5 minutes
const RATE_TTL = 10 * 60;         // 10 minutes window
const MAX_OTP_PER_WINDOW = 3;

export const sendPhoneOtp = async (phone: string): Promise<{ message: string }> => {
  // Rate limit: max 3 OTPs per 10 minutes
  const rateKey = `phone_otp_count:${phone}`;
  const countStr = await cacheGet(rateKey);
  const count = countStr ? parseInt(countStr, 10) : 0;

  if (count >= MAX_OTP_PER_WINDOW) {
    throw new AppError('Too many OTP requests. Please wait 10 minutes and try again.', 429);
  }

  // Generate 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const otpKey = `phone_otp:${phone}`;

  // Store OTP in Redis
  await cacheSet(otpKey, otp, OTP_TTL);

  // Increment rate counter (set TTL only on first request)
  if (count === 0) {
    await cacheSet(rateKey, '1', RATE_TTL);
  } else {
    // Update count without resetting the TTL window  
    await cacheSet(rateKey, String(count + 1), RATE_TTL);
  }

  // Send SMS
  await sendSmsOtp(phone, otp);

  return { message: `OTP sent to +91${phone}` };
};

export const verifyPhoneOtp = async (
  phone: string,
  otp: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  user: object;
}> => {
  const otpKey = `phone_otp:${phone}`;
  const storedOtp = await cacheGet(otpKey);

  if (!storedOtp) throw new AppError('OTP expired. Please request a new one.', 400);
  if (storedOtp !== otp) throw new AppError('Invalid OTP', 400);

  // Consume OTP immediately (prevent replay)
  await cacheDel(otpKey);

  let isNewUser = false;

  // Find or create user
  let user = await userRepo().findOneBy({ phone });

  if (!user) {
    isNewUser = true;
    const newUser = userRepo().create({
      phone,
      firstName: 'User',
      authProvider: AuthProvider.PHONE,
      isPhoneVerified: true,
      role: UserRole.USER,
    });
    user = await userRepo().save(newUser);
  } else {
    // Mark phone as verified if not already
    if (!user.isPhoneVerified) {
      await userRepo().update(user.id, { isPhoneVerified: true });
    }
  }

  if (!user.isActive) throw new AppError('Account disabled', 403);

  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });
  await userRepo().update(user.id, { refreshToken });

  return {
    accessToken,
    refreshToken,
    isNewUser,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      authProvider: user.authProvider,
      isGuest: user.isGuest,
    },
  };
};
