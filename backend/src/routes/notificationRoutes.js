import express from "express";
import Notification from "../models/Notification.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// GET /api/notifications - Ottieni notifiche dell'utente
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('eventId', 'name category date location');
    
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: "Errore recupero notifiche" });
  }
});

// GET /api/notifications/unread-count - Conta notifiche non lette
router.get("/unread-count", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    
    const unreadCount = await Notification.countDocuments({ 
      userId, 
      read: false 
    });
    
    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ error: "Errore conteggio notifiche" });
  }
});

// PUT /api/notifications/:id/read - Marca notifica come letta
router.put("/:id/read", authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.sub;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { 
        read: true, 
        readAt: new Date() 
      },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: "Notifica non trovata" });
    }
    
    res.json({ message: "Notifica marcata come letta" });
  } catch (error) {
    res.status(500).json({ error: "Errore aggiornamento notifica" });
  }
});

// PUT /api/notifications/read-all - Marca tutte le notifiche come lette
router.put("/read-all", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    
    await Notification.updateMany(
      { userId, read: false },
      { 
        read: true, 
        readAt: new Date() 
      }
    );
    
    res.json({ message: "Tutte le notifiche marcate come lette" });
  } catch (error) {
    res.status(500).json({ error: "Errore aggiornamento notifiche" });
  }
});

// DELETE /api/notifications/:id - Elimina notifica
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.sub;
    
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });
    
    if (!notification) {
      return res.status(404).json({ error: "Notifica non trovata" });
    }
    
    res.json({ message: "Notifica eliminata" });
  } catch (error) {
    res.status(500).json({ error: "Errore eliminazione notifica" });
  }
});

export default router;
