import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticateToken = (req, res, next) => {
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
