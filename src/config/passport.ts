import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { AppDataSource } from './data-source';
import { User, AuthProvider, UserRole } from '../models/User';

const userRepo = () => AppDataSource.getRepository(User);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (_accessToken, _refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value ?? null;
        const googleId = profile.id;

        // 1. Try find by googleId
        let user = await userRepo().findOneBy({ googleId });

        // 2. Try find by email (existing local user)
        if (!user && email) {
          user = await userRepo().findOneBy({ email });
          if (user) {
            // Link google to existing account
            await userRepo().update(user.id, {
              googleId,
              authProvider: AuthProvider.GOOGLE,
              isEmailVerified: true,
              avatar: user.avatar || (profile.photos?.[0]?.value ?? undefined),
            });
            user = await userRepo().findOneBy({ id: user.id });
          }
        }

        // 3. Create new user
        if (!user) {
          const newUser = userRepo().create({
            googleId,
            email: email ?? undefined,
            firstName: profile.name?.givenName ?? 'User',
            lastName: profile.name?.familyName ?? '',
            avatar: profile.photos?.[0]?.value ?? undefined,
            authProvider: AuthProvider.GOOGLE,
            isEmailVerified: true,
            role: UserRole.USER,
          });
          user = await userRepo().save(newUser);
        }

        return done(null, user as unknown as Express.User);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

// No sessions — just serialize enough to pass user through callback
passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await userRepo().findOneBy({ id });
    done(null, user as unknown as Express.User);
  } catch (err) { done(err); }
});

export default passport;
