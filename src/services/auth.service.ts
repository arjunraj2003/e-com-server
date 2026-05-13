import { AppDataSource } from '../config/data-source';
import { User, UserRole } from '../models/User';
import { AppError } from '../middlewares/errorHandler';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateOTP,
  generateResetToken,
} from '../utils/tokens';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailTemplates';
import bcrypt from 'bcryptjs';

const userRepo = () => AppDataSource.getRepository(User);

export const registerUser = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}) => {
  const existing = await userRepo().findOneBy({ email: data.email });
  if (existing) throw new AppError('Email already registered', 409);

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  const user = userRepo().create({
    ...data,
    passwordHash: data.password, // BeforeInsert hashes it
    emailVerificationOtp: otp,
    emailOtpExpiresAt: otpExpiry,
  });
  await userRepo().save(user);

  await sendVerificationEmail(data.email, otp);

  return { message: 'Registration successful. Check your email for OTP.' };
};

export const verifyEmail = async (email: string, otp: string) => {
  const user = await userRepo().findOne({
    where: { email },
    select: ['id', 'email', 'isEmailVerified', 'emailVerificationOtp', 'emailOtpExpiresAt'],
  });
  if (!user) throw new AppError('User not found', 404);
  if (user.isEmailVerified) throw new AppError('Email already verified', 400);
  if (
    user.emailVerificationOtp !== otp ||
    !user.emailOtpExpiresAt ||
    user.emailOtpExpiresAt < new Date()
  ) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  await userRepo().update(user.id, {
    isEmailVerified: true,
    emailVerificationOtp: undefined as any,
    emailOtpExpiresAt: undefined as any,
  });

  return { message: 'Email verified successfully' };
};

export const loginUser = async (email: string, password: string) => {
  const user = await userRepo().findOne({
    where: { email },
    select: ['id', 'email', 'passwordHash', 'role', 'isEmailVerified', 'isActive', 'firstName', 'lastName'],
  });
  if (!user) throw new AppError('Invalid credentials', 401);
  if (!user.isActive) throw new AppError('Account disabled', 403);
  if (!user.isEmailVerified) throw new AppError('Please verify your email first', 403);

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new AppError('Invalid credentials', 401);

  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

  await userRepo().update(user.id, { refreshToken });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  };
};

export const refreshTokens = async (token: string) => {
  const decoded = verifyRefreshToken(token);
  const user = await userRepo().findOne({
    where: { id: decoded.userId },
    select: ['id', 'role', 'refreshToken'],
  });
  if (!user || user.refreshToken !== token) {
    throw new AppError('Invalid refresh token', 401);
  }

  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const newRefreshToken = generateRefreshToken({ userId: user.id, role: user.role });
  await userRepo().update(user.id, { refreshToken: newRefreshToken });

  return { accessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (userId: string) => {
  await userRepo().update(userId, { refreshToken: undefined as any });
};

export const forgotPassword = async (email: string) => {
  const user = await userRepo().findOneBy({ email });
  if (!user) return; // silent — don't reveal if email exists

  const resetToken = generateResetToken();
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await userRepo().update(user.id, {
    passwordResetToken: resetToken,
    passwordResetExpiresAt: resetExpiry,
  });

  const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;
  await sendPasswordResetEmail(email, resetUrl);
};

export const resetPassword = async (token: string, newPassword: string) => {
  const user = await userRepo().findOne({
    where: { passwordResetToken: token },
    select: ['id', 'passwordResetToken', 'passwordResetExpiresAt'],
  });
  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await userRepo().update(user.id, {
    passwordHash: hashedPassword,
    passwordResetToken: undefined as any,
    passwordResetExpiresAt: undefined as any,
    refreshToken: undefined as any,
  });
};

export const resendOtp = async (email: string) => {
  const user = await userRepo().findOne({
    where: { email },
    select: ['id', 'email', 'isEmailVerified'],
  });
  if (!user) throw new AppError('User not found', 404);
  if (user.isEmailVerified) throw new AppError('Email already verified', 400);

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await userRepo().update(user.id, {
    emailVerificationOtp: otp,
    emailOtpExpiresAt: otpExpiry,
  });

  const { sendOtpResendEmail } = await import('../utils/emailTemplates');
  await sendOtpResendEmail(email, otp);

  return { message: 'OTP sent successfully' };
};
