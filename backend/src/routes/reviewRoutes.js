import express from "express";
import Event from "../models/Event.js";
import User from "../models/User.js";
import { authenticateToken, requireReviewerOrAdmin } from "../middleware/auth.js";
import { createNotificationForEventReporter } from "../utils/notifications.js";

const router = express.Router();

// GET /api/review/events - Lista eventi da revisionare
router.get("/events", authenticateToken, requireReviewerOrAdmin, async (req, res) => {
  try {
    const events = await Event.find({ approved: "pending" })
      .sort({ createdAt: -1 });
    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: "Errore recupero eventi da revisionare" });
  }
});

// PUT /api/review/events/:id/approve - Approva un evento
router.put("/events/:id/approve", authenticateToken, requireReviewerOrAdmin, async (req, res) => {
  try {
    const eventId = req.params.id;
    
    const event = await Event.findByIdAndUpdate(
      eventId,
      { approved: "approved" },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({ error: "Evento non trovato" });
    }
    
    // Aggiungi un punto all'utente che ha segnalato l'evento
    if (event.reportedBy && event.reportedBy !== 'Anonimo') {
      await User.findOneAndUpdate(
        { username: event.reportedBy },
        { $inc: { points: 1 } }
      );
    }
    
    // Invia notifica all'utente che ha segnalato l'evento
    await createNotificationForEventReporter(eventId, event.name, 'event_approved');
    
    res.json({ 
      message: "Evento approvato con successo",
      event 
    });
  } catch (error) {
    res.status(500).json({ error: "Errore approvazione evento" });
  }
});

// PUT /api/review/events/:id/reject - Rifiuta un evento
router.put("/events/:id/reject", authenticateToken, requireReviewerOrAdmin, async (req, res) => {
  try {
    const eventId = req.params.id;
    
    const event = await Event.findByIdAndUpdate(
      eventId,
      { approved: "rejected" },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({ error: "Evento non trovato" });
    }
    
    // Invia notifica all'utente che ha segnalato l'evento
    await createNotificationForEventReporter(eventId, event.name, 'event_rejected');
    
    res.json({ 
      message: "Evento rifiutato con successo",
      event 
    });
  } catch (error) {
    res.status(500).json({ error: "Errore rifiuto evento" });
  }
});

// PUT /api/review/events/:id - Modifica un evento in attesa di revisione
router.put("/events/:id", authenticateToken, requireReviewerOrAdmin, async (req, res) => {
  try {
    const eventId = req.params.id;
    const { name, category, date, location, link } = req.body;
    
    const existingEvent = await Event.findById(eventId);
    if (!existingEvent) {
      return res.status(404).json({ error: "Evento non trovato" });
    }
    
    if (existingEvent.approved !== "pending") {
      return res.status(400).json({ error: "Solo gli eventi in attesa di revisione possono essere modificati" });
    }
    
    // Aggiorna l'evento
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { 
        name, 
        category, 
        date: new Date(date), 
        location, 
        link 
      },
      { new: true }
    );
    
    // Invia notifica all'utente che ha segnalato l'evento
    await createNotificationForEventReporter(eventId, updatedEvent.name, 'event_modified');
    
    res.json({ 
      message: "Evento aggiornato con successo",
      event: updatedEvent 
    });
  } catch (error) {
    res.status(500).json({ error: "Errore aggiornamento evento" });
  }
});

// GET /api/review/stats - Statistiche per i revisori
router.get("/stats", authenticateToken, requireReviewerOrAdmin, async (req, res) => {
  try {
    const pending = await Event.countDocuments({ approved: "pending" });
    const approved = await Event.countDocuments({ approved: "approved" });
    const rejected = await Event.countDocuments({ approved: "rejected" });
    const total = await Event.countDocuments();
    
    res.json({
      pending,
      approved,
      rejected,
      total
    });
  } catch (error) {
    res.status(500).json({ error: "Errore recupero statistiche" });
  }
});

export default router;
