import { AppDataSource } from '../config/data-source';
import { User, AuthProvider, UserRole } from '../models/User';
import { generateAccessToken, generateRefreshToken } from '../utils/tokens';

const userRepo = () => AppDataSource.getRepository(User);

export const findOrCreateGoogleUser = async (googleUser: User): Promise<{
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  user: object;
}> => {
  // At this point passport has already found/created the user
  // We just need to issue tokens
  const isNewUser = !googleUser.refreshToken;

  const accessToken = generateAccessToken({ userId: googleUser.id, role: googleUser.role });
  const refreshToken = generateRefreshToken({ userId: googleUser.id, role: googleUser.role });

  await userRepo().update(googleUser.id, { refreshToken });

  return {
    accessToken,
    refreshToken,
    isNewUser,
    user: {
      id: googleUser.id,
      firstName: googleUser.firstName,
      lastName: googleUser.lastName,
      email: googleUser.email,
      phone: googleUser.phone,
      avatar: googleUser.avatar,
      role: googleUser.role,
      authProvider: googleUser.authProvider,
      isGuest: googleUser.isGuest,
    },
  };
};
