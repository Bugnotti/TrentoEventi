import express from "express";
import Event from "../models/Event.js";
import { authenticateToken } from "../middleware/auth.js";

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
router.post("/", authenticateToken, async (req, res) => {
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
    res.status(400).json({ error: err.message });
  }
});

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
        $sort: { eventCount: -1 }
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
