import { Request, Response, NextFunction } from 'express';
import { findOrCreateGoogleUser } from '../services/googleAuth.service';
import { User } from '../models/User';

export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const googleUser = req.user as unknown as User;
    if (!googleUser) {
      return res.redirect(`${process.env.CLIENT_URL}/auth/login?error=google_failed`);
    }

    const { accessToken, refreshToken, isNewUser } = await findOrCreateGoogleUser(googleUser);

    // Redirect to frontend with tokens in query params
    // Frontend reads them once and stores in memory/localStorage then cleans URL
    const redirectUrl = new URL(`${process.env.CLIENT_URL}/auth/oauth-callback`);
    redirectUrl.searchParams.set('accessToken', accessToken);
    redirectUrl.searchParams.set('refreshToken', refreshToken);
    redirectUrl.searchParams.set('isNewUser', String(isNewUser));

    res.redirect(redirectUrl.toString());
  } catch (err) { next(err); }
};
