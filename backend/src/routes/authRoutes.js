import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authenticateToken, requireReviewerOrAdmin } from "../middleware/auth.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, instagram } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email e password sono obbligatori" });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(409).json({ error: "Username o email già in uso" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      username, 
      email, 
      passwordHash, 
      firstName, 
      lastName, 
      role: 'user',
      instagram: instagram || { showProfile: false, username: '' }
    });
    res.status(201).json({ 
      id: user._id, 
      email: user.email, 
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      points: user.points,
      instagram: user.instagram
    });
  } catch (err) {
    res.status(500).json({ error: "Errore registrazione" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Credenziali non valide" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Credenziali non valide" });
    const token = jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET || "dev_secret", { expiresIn: "7d" });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        username: user.username, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        role: user.role,
        points: user.points,
        instagram: user.instagram
      } 
    });
  } catch (err) {
    res.status(500).json({ error: "Errore login" });
  }
});

// PUT /api/auth/profile - Aggiorna profilo utente
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { firstName, lastName, instagram } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, instagram },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    
    res.json({
      message: "Profilo aggiornato con successo",
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        points: user.points,
        instagram: user.instagram
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Errore aggiornamento profilo" });
  }
});

// GET /api/auth/me - Ottieni dati utente corrente
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const user = await User.findById(userId).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        points: user.points,
        instagram: user.instagram,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Errore recupero dati utente" });
  }
});

// GET /api/auth/user/:username - Ottieni profilo utente specifico (solo per revisori/admin)
router.get("/user/:username", authenticateToken, requireReviewerOrAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('-passwordHash -email');
    
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        points: user.points,
        instagram: user.instagram,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Errore recupero utente" });
  }
});

// GET /api/auth/profile/:username - Ottieni profilo utente pubblico (per tutti gli utenti loggati)
router.get("/profile/:username", authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('-passwordHash -email');
    
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        points: user.points,
        instagram: user.instagram,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Errore nel recupero profilo utente:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

export default router;



