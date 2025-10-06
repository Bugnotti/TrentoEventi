import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticateToken = (req, res, next) => {
  // Modalità sviluppo: bypassa autenticazione se NODE_ENV è development
  if (process.env.NODE_ENV === 'development' && req.headers['x-dev-bypass'] === 'true') {
    // Crea un utente fittizio per i test
    req.user = {
      sub: '507f1f77bcf86cd799439011', // ID utente fittizio
      userId: '507f1f77bcf86cd799439011',
      username: 'testuser',
      role: 'user'
    };
    console.log('🔧 DEV MODE: Bypassing authentication');
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token di accesso richiesto' });
  }

  jwt.verify(token, process.env.JWT_SECRET || "dev_secret", (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token non valido' });
    }
    req.user = user;
    next();
  });
};

export const requireReviewerOrAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'reviewer' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Accesso negato: ruolo non autorizzato' });
  }
  next();
};
