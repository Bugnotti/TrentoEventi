import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Configura la strategia Google OAuth
export const configureGoogleAuth = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Cerca l'utente esistente con questo Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // Utente esistente trovato
            return done(null, user);
          }

          // Controlla se esiste già un utente con questa email
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // L'utente esiste con email ma non ha Google ID
            // Collega l'account Google a quello esistente
            user.googleId = profile.id;
            user.authProvider = "google";
            user.profilePicture = profile.photos[0]?.value;
            await user.save();
            return done(null, user);
          }

          // Crea nuovo utente
          const username = profile.emails[0].value.split('@')[0] + '_' + Date.now();
          
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            username: username,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            profilePicture: profile.photos[0]?.value,
            authProvider: "google",
            role: "user",
          });

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );

  // Serializzazione utente per la sessione
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

// Controller per gestire il callback di Google
export const googleCallback = (req, res) => {
  try {
    // Genera JWT token per l'utente
    const token = jwt.sign(
      { sub: req.user._id, role: req.user.role },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );

    // Redirect al frontend con il token
    const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendURL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error("Errore callback Google:", error);
    const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendURL}/login?error=auth_failed`);
  }
};

