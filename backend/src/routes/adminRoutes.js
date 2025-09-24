import express from "express";
import User from "../models/User.js";
import Event from "../models/Event.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Middleware per verificare che l'utente sia admin
const requireAdmin = async (req, res, next) => {
  try {
    // Il token JWT contiene 'sub' (subject), non 'userId'
    const userId = req.user.sub || req.user.userId;
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Accesso negato. Solo gli amministratori possono accedere a questa risorsa.' });
    }
    next();
  } catch (error) {
    console.error('Error in requireAdmin middleware:', error);
    res.status(500).json({ error: 'Errore nella verifica dei permessi' });
  }
};

// Applica autenticazione e controllo admin a tutte le route
router.use(authenticateToken, requireAdmin);

// GET statistiche generali
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Statistiche utenti
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Statistiche eventi
    const totalEvents = await Event.countDocuments();
    const newEventsThisMonth = await Event.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    const approvedEvents = await Event.countDocuments({ approved: 'approved' });
    const pendingEvents = await Event.countDocuments({ approved: 'pending' });
    const rejectedEvents = await Event.countDocuments({ approved: 'rejected' });

    // Eventi per categoria
    const eventsByCategory = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Eventi per mese (ultimi 6 mesi)
    const eventsByMonth = await Event.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Utenti più attivi (per numero di eventi segnalati)
    const mostActiveUsers = await Event.aggregate([
      { $group: { _id: '$reportedBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Statistiche click eventi
    const totalClicks = await Event.aggregate([
      { $group: { _id: null, totalClicks: { $sum: '$clickCount' } } }
    ]);

    const mostClickedEvents = await Event.find({ clickCount: { $gt: 0 } })
      .populate('reporter', 'username firstName lastName')
      .select('name category clickCount clickedBy createdAt')
      .sort({ clickCount: -1 })
      .limit(10);

    res.json({
      totalUsers,
      newUsersThisMonth,
      totalEvents,
      newEventsThisMonth,
      approvedEvents,
      pendingEvents,
      rejectedEvents,
      eventsByCategory,
      eventsByMonth,
      mostActiveUsers,
      totalClicks: totalClicks[0]?.totalClicks || 0,
      mostClickedEvents
    });
  } catch (error) {
    console.error('Errore nel recupero statistiche:', error);
    res.status(500).json({ error: 'Errore nel recupero delle statistiche' });
  }
});

// GET utenti recenti
router.get('/users/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const users = await User.find()
      .select('username firstName lastName email createdAt')
      .sort({ createdAt: -1 })
      .limit(limit);

    // Aggiungi il conteggio degli eventi per ogni utente
    const usersWithEventCount = await Promise.all(
      users.map(async (user) => {
        const eventsCount = await Event.countDocuments({ reportedBy: user.username });
        return {
          ...user.toObject(),
          eventsCount
        };
      })
    );

    res.json(usersWithEventCount);
  } catch (error) {
    console.error('Errore nel recupero utenti recenti:', error);
    res.status(500).json({ error: 'Errore nel recupero degli utenti' });
  }
});

// GET eventi recenti
router.get('/events/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const events = await Event.find()
      .select('name category reportedBy date approved createdAt')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(events);
  } catch (error) {
    console.error('Errore nel recupero eventi recenti:', error);
    res.status(500).json({ error: 'Errore nel recupero degli eventi' });
  }
});

// GET tutti gli utenti (con paginazione)
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('username firstName lastName email role createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments();

    // Aggiungi il conteggio degli eventi per ogni utente
    const usersWithEventCount = await Promise.all(
      users.map(async (user) => {
        const eventsCount = await Event.countDocuments({ reportedBy: user.username });
        return {
          ...user.toObject(),
          eventsCount
        };
      })
    );

    res.json({
      users: usersWithEventCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNext: page < Math.ceil(totalUsers / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Errore nel recupero utenti:', error);
    res.status(500).json({ error: 'Errore nel recupero degli utenti' });
  }
});

// GET tutti gli eventi (con filtri)
router.get('/events', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, category, search } = req.query;

    let filter = {};
    if (status) filter.approved = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { reportedBy: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(filter)
      .populate('reporter', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalEvents = await Event.countDocuments(filter);

    res.json({
      events,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalEvents / limit),
        totalEvents,
        hasNext: page < Math.ceil(totalEvents / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Errore nel recupero eventi:', error);
    res.status(500).json({ error: 'Errore nel recupero degli eventi' });
  }
});

// PUT aggiorna ruolo utente
router.put('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'reviewer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Ruolo non valido' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('username firstName lastName email role');

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    res.json(user);
  } catch (error) {
    console.error('Errore nell\'aggiornamento ruolo utente:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento del ruolo' });
  }
});

// DELETE elimina utente
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Non permettere di eliminare se stessi
    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Non puoi eliminare il tuo stesso account' });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    // Opzionalmente, puoi anche eliminare tutti gli eventi dell'utente
    // await Event.deleteMany({ reportedBy: user.username });

    res.json({ message: 'Utente eliminato con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione utente:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione dell\'utente' });
  }
});

// GET statistiche click per evento specifico
router.get('/events/:eventId/clicks', async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate('clickedBy.user', 'username firstName lastName email')
      .select('name category clickCount clickedBy createdAt');

    if (!event) {
      return res.status(404).json({ error: 'Evento non trovato' });
    }

    // Raggruppa i click per utente per evitare duplicati
    const uniqueUsers = [];
    const userClickMap = new Map();

    event.clickedBy.forEach(click => {
      const userId = click.user._id.toString();
      if (!userClickMap.has(userId)) {
        userClickMap.set(userId, {
          user: click.user,
          firstClick: click.clickedAt,
          clickCount: 1
        });
      } else {
        userClickMap.get(userId).clickCount += 1;
        if (click.clickedAt < userClickMap.get(userId).firstClick) {
          userClickMap.get(userId).firstClick = click.clickedAt;
        }
      }
    });

    uniqueUsers.push(...userClickMap.values());

    res.json({
      event: {
        _id: event._id,
        name: event.name,
        category: event.category,
        clickCount: event.clickCount,
        createdAt: event.createdAt
      },
      uniqueUsers: uniqueUsers.length,
      usersWhoClicked: uniqueUsers.sort((a, b) => b.clickCount - a.clickCount)
    });
  } catch (error) {
    console.error('Errore nel recupero statistiche click evento:', error);
    res.status(500).json({ error: 'Errore nel recupero delle statistiche click' });
  }
});

// GET tutti gli eventi con statistiche click
router.get('/events/click-stats', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { sortBy = 'clickCount', order = 'desc' } = req.query;

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField = sortBy === 'name' ? 'name' : 'clickCount';

    const events = await Event.find({ clickCount: { $gt: 0 } })
      .populate('reporter', 'username firstName lastName')
      .populate('clickedBy.user', 'username firstName lastName')
      .select('name category clickCount clickedBy createdAt approved reportedBy')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);


    const totalEvents = await Event.countDocuments({ clickCount: { $gt: 0 } });

    // Aggiungi il conteggio degli utenti unici per ogni evento
    const eventsWithStats = events.map(event => {
      // Filtra solo i click che hanno un user popolato
      const validClicks = event.clickedBy.filter(click => click.user && click.user._id);
      const uniqueUsers = new Set(validClicks.map(click => click.user._id.toString()));
      
      return {
        ...event.toObject(),
        uniqueUsersCount: uniqueUsers.size,
        clickedBy: validClicks // Usa solo i click validi
      };
    });

    res.json({
      events: eventsWithStats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalEvents / limit),
        totalEvents,
        hasNext: page < Math.ceil(totalEvents / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Errore nel recupero eventi con statistiche click:', error);
    res.status(500).json({ error: 'Errore nel recupero delle statistiche click' });
  }
});

export default router;

