import express from "express";
import Event from "../models/Event.js";
import { authenticateToken } from "../middleware/auth.js";
import { createNotification, createNotificationForAdminsAndReviewers } from "../utils/notifications.js";
import { 
  validateEvent, 
  validateEventModification,
  validateObjectId,
  handleValidationErrors,
  sanitizeInput 
} from "../middleware/validation.js";

const router = express.Router();

// GET tutti gli eventi approvati
router.get("/", async (req, res) => {
  console.log("🔍 GET /api/events - attempt to fetch events");
  try {
    const events = await Event.find({ approved: "approved" })
      .populate('reporter', 'username firstName lastName instagram')
      .sort({ date: 1 });
    console.log(`✅ Found ${events.length} approved events`);
    res.json(events);
  } catch (err) {
    console.error("❌ Errore /api/events:", err);
    res.status(500).json({ error: "Errore nel recupero eventi", details: err.message });
  }
});

// POST nuovo evento
router.post("/", 
  authenticateToken,
  sanitizeInput,
  validateEvent,
  handleValidationErrors,
  async (req, res) => {
    try {
      const eventData = {
        ...req.body,
        reporter: req.body.reporter || req.user?.userId || null // Usa il reporter dal body o dall'utente autenticato
      };
      const newEvent = new Event(eventData);
      await newEvent.save();
      
      // Popola i dati dell'utente per la risposta
      await newEvent.populate('reporter', 'username firstName lastName instagram');
      res.status(201).json(newEvent);
    } catch (err) {
      console.error("Errore creazione evento:", err);
      res.status(400).json({ 
        error: "Errore nella creazione dell'evento",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
);

// GET eventi dell'utente corrente
router.get("/my-events", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub || req.user.userId;
    
    const events = await Event.find({ reporter: userId })
      .populate('reporter', 'username firstName lastName instagram')
      .sort({ date: -1 }); // Più recenti prima
    
    res.json(events);
  } catch (err) {
    console.error("Errore /api/events/my-events:", err);
    res.status(500).json({ error: "Errore nel recupero eventi utente", details: err.message });
  }
});

// GET classifica top 10 utenti per numero di segnalazioni
router.get("/leaderboard", async (req, res) => {
  try {
    // Aggrega gli eventi per contare le segnalazioni per utente
    const leaderboard = await Event.aggregate([
      {
        $match: {
          reporter: { $exists: true, $ne: null } // Solo eventi con reporter valido
        }
      },
      {
        $group: {
          _id: "$reporter",
          eventCount: { $sum: 1 },
          approvedCount: {
            $sum: { $cond: [{ $eq: ["$approved", "approved"] }, 1, 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$approved", "pending"] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      {
        $unwind: "$userInfo"
      },
      {
        $project: {
          _id: 1,
          username: "$userInfo.username",
          firstName: "$userInfo.firstName",
          lastName: "$userInfo.lastName",
          instagram: "$userInfo.instagram",
          eventCount: 1,
          approvedCount: 1,
          pendingCount: 1
        }
      },
      {
        $sort: { approvedCount: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    res.json(leaderboard);
  } catch (err) {
    console.error("Errore /api/events/leaderboard:", err);
    res.status(500).json({ error: "Errore nel recupero classifica", details: err.message });
  }
});

// PUT aggiorna evento dell'utente (solo se pending)
router.put("/:eventId", authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.sub || req.user.userId;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Evento non trovato' });
    }
    
    // Verifica che l'evento appartenga all'utente
    if (event.reporter.toString() !== userId) {
      return res.status(403).json({ error: 'Non hai il permesso di modificare questo evento' });
    }
    
    // Verifica che l'evento sia ancora in pending
    if (event.approved !== 'pending') {
      return res.status(400).json({ error: 'Puoi modificare solo eventi in attesa di approvazione' });
    }
    
    // Aggiorna l'evento
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        ...req.body,
        date: new Date(req.body.date),
        reporter: userId // Mantieni il reporter originale
      },
      { new: true }
    ).populate('reporter', 'username firstName lastName instagram');
    
    res.json(updatedEvent);
  } catch (err) {
    console.error("Errore aggiornamento evento:", err);
    res.status(500).json({ error: "Errore nell'aggiornamento dell'evento", details: err.message });
  }
});

// POST richiedi modifica di un evento approvato
router.post("/:eventId/request-modification", authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.sub || req.user.userId;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Evento non trovato' });
    }
    
    // Verifica che l'evento appartenga all'utente
    if (event.reporter.toString() !== userId) {
      return res.status(403).json({ error: 'Non hai il permesso di modificare questo evento' });
    }
    
    // Verifica che l'evento sia approvato
    if (event.approved !== 'approved') {
      return res.status(400).json({ error: 'Puoi richiedere modifiche solo per eventi già approvati' });
    }
    
    // Verifica che non ci siano già modifiche in attesa
    if (event.hasPendingModifications) {
      return res.status(400).json({ error: 'Hai già una richiesta di modifica in attesa di approvazione' });
    }
    
    // Salva le modifiche richieste
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        pendingModifications: {
          ...req.body,
          date: req.body.date ? new Date(req.body.date) : undefined,
          requestedAt: new Date(),
          requestedBy: userId
        },
        hasPendingModifications: true
      },
      { new: true }
    ).populate('reporter', 'username firstName lastName instagram');
    
    // Crea notifica per l'utente
    await createNotification(userId, 'modification_requested', eventId, event.name);
    
    // Crea notifiche per tutti gli admin e reviewer
    await createNotificationForAdminsAndReviewers(eventId, event.name, 'modification_requested_admin');
    
    res.json({
      message: 'Richiesta di modifica inviata con successo',
      event: updatedEvent
    });
  } catch (err) {
    console.error("Errore richiesta modifica evento:", err);
    res.status(500).json({ error: "Errore nella richiesta di modifica", details: err.message });
  }
});

// GET eventi con modifiche in attesa (per admin e reviewer)
router.get("/pending-modifications", authenticateToken, async (req, res) => {
  try {
    // Verifica che l'utente sia admin o reviewer
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'reviewer')) {
      return res.status(403).json({ error: 'Accesso negato: solo admin e reviewer possono vedere le modifiche in attesa' });
    }
    
    const events = await Event.find({ hasPendingModifications: true })
      .populate('reporter', 'username firstName lastName instagram')
      .populate('pendingModifications.requestedBy', 'username firstName lastName')
      .sort({ 'pendingModifications.requestedAt': -1 });
    
    res.json(events);
  } catch (err) {
    console.error("Errore recupero modifiche in attesa:", err);
    res.status(500).json({ error: "Errore nel recupero delle modifiche", details: err.message });
  }
});

// POST approva/rifiuta modifica evento (per admin e reviewer)
router.post("/:eventId/modification/:action", authenticateToken, async (req, res) => {
  try {
    const { eventId, action } = req.params;
    const userId = req.user.sub || req.user.userId;
    
    // Verifica che l'utente sia admin o reviewer
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'reviewer')) {
      return res.status(403).json({ error: 'Accesso negato: solo admin e reviewer possono approvare/rifiutare modifiche' });
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Azione non valida. Usa "approve" o "reject"' });
    }
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Evento non trovato' });
    }
    
    if (!event.hasPendingModifications) {
      return res.status(400).json({ error: 'Non ci sono modifiche in attesa per questo evento' });
    }
    
    let updatedEvent;
    
    if (action === 'approve') {
      // Applica le modifiche
      const modifications = event.pendingModifications;
      updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        {
          name: modifications.name || event.name,
          category: modifications.category || event.category,
          date: modifications.date || event.date,
          location: modifications.location || event.location,
          link: modifications.link !== undefined ? modifications.link : event.link,
          hasPendingModifications: false,
          pendingModifications: {}
        },
        { new: true }
      ).populate('reporter', 'username firstName lastName instagram');
      
      // Crea notifica di approvazione per l'utente che ha richiesto la modifica
      await createNotification(event.pendingModifications.requestedBy, 'modification_approved', eventId, event.name);
    } else {
      // Rifiuta le modifiche
      updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        {
          hasPendingModifications: false,
          pendingModifications: {}
        },
        { new: true }
      ).populate('reporter', 'username firstName lastName instagram');
      
      // Crea notifica di rifiuto per l'utente che ha richiesto la modifica
      await createNotification(event.pendingModifications.requestedBy, 'modification_rejected', eventId, event.name);
    }
    
    res.json({
      message: `Modifica ${action === 'approve' ? 'approvata' : 'rifiutata'} con successo`,
      event: updatedEvent
    });
  } catch (err) {
    console.error("Errore approvazione/rifiuto modifica:", err);
    res.status(500).json({ error: "Errore nell'approvazione della modifica", details: err.message });
  }
});

// POST traccia click su evento
router.post("/:eventId/click", authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    // Il token JWT contiene 'sub' (subject), non 'userId'
    const userId = req.user.sub || req.user.userId;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Evento non trovato' });
    }

    // Verifica se l'utente ha già cliccato su questo evento
    const alreadyClicked = event.clickedBy.some(click => 
      click.user && click.user.toString() === userId
    );

    if (!alreadyClicked) {
      // Aggiungi il click
      event.clickedBy.push({ user: userId });
      event.clickCount += 1;
      await event.save();
    }

    res.json({ 
      success: true, 
      clickCount: event.clickCount,
      alreadyClicked 
    });
  } catch (err) {
    console.error("Errore tracking click:", err);
    res.status(500).json({ error: "Errore nel tracking del click" });
  }
});

export default router;
