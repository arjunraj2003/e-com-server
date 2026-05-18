import { AppDataSource } from '../config/data-source';
import { User, AuthProvider, UserRole } from '../models/User';
import { AppError } from '../middlewares/errorHandler';
import { generateAccessToken } from '../utils/tokens';
import { cacheGet, cacheDel } from '../config/redis';

const userRepo = () => AppDataSource.getRepository(User);

export const createGuestUser = async (data: {
  name: string;
  phone: string;
  email?: string;
}): Promise<{ accessToken: string; user: object }> => {
  // Check phone not already a full user
  if (data.phone) {
    const existing = await userRepo().findOneBy({ phone: data.phone });
    if (existing && !existing.isGuest) {
      throw new AppError('Phone already registered. Please login instead.', 409);
    }
  }

  const newUser = userRepo().create({
    firstName: data.name,
    phone: data.phone,
    email: data.email ?? undefined,
    authProvider: AuthProvider.GUEST,
    isGuest: true,
    role: UserRole.USER,
  });
  const user = await userRepo().save(newUser);

  // Limited access token — no refresh token for guests
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });

  return {
    accessToken,
    user: {
      id: user.id,
      firstName: user.firstName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      authProvider: user.authProvider,
      isGuest: user.isGuest,
    },
  };
};

export const upgradeGuestUser = async (
  userId: string,
  phone: string,
  otp: string
): Promise<{ accessToken: string; refreshToken: string; user: object }> => {
  const otpKey = `phone_otp:${phone}`;
  const storedOtp = await cacheGet(otpKey);

  if (!storedOtp) throw new AppError('OTP expired. Please request a new one.', 400);
  if (storedOtp !== otp) throw new AppError('Invalid OTP', 400);

  await cacheDel(otpKey);

  const user = await userRepo().findOneBy({ id: userId });
  if (!user) throw new AppError('User not found', 404);
  if (!user.isGuest) throw new AppError('Account is already a full account', 400);

  await userRepo().update(userId, {
    isGuest: false,
    authProvider: AuthProvider.PHONE,
    phone,
    isPhoneVerified: true,
  });

  const { generateRefreshToken } = await import('../utils/tokens');
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });
  await userRepo().update(userId, { refreshToken });

  const updated = await userRepo().findOneBy({ id: userId });

  return {
    accessToken,
    refreshToken,
    user: {
      id: updated!.id,
      firstName: updated!.firstName,
      email: updated!.email,
      phone: updated!.phone,
      role: updated!.role,
      authProvider: updated!.authProvider,
      isGuest: updated!.isGuest,
    },
  };
};
