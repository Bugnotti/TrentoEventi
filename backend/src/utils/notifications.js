import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Event from "../models/Event.js";

export const createNotification = async (userId, type, eventId, eventName) => {
  try {
    let title, message;
    
    switch (type) {
      case 'event_approved':
        title = 'Evento Approvato! 🎉';
        message = `Il tuo evento "${eventName}" è stato approvato ed è ora visibile a tutti gli utenti. Hai guadagnato 1 punto! 🏆`;
        break;
      case 'event_rejected':
        title = 'Evento Rifiutato';
        message = `Il tuo evento "${eventName}" è stato rifiutato. Controlla le informazioni e riprova.`;
        break;
      case 'event_modified':
        title = 'Evento Modificato';
        message = `Il tuo evento "${eventName}" è stato modificato da un revisore.`;
        break;
      case 'modification_requested':
        title = 'Richiesta di Modifica Inviata';
        message = `La tua richiesta di modifica per l'evento "${eventName}" è stata inviata e sarà esaminata presto.`;
        break;
      case 'modification_approved':
        title = 'Modifica Approvata! ✅';
        message = `La tua richiesta di modifica per l'evento "${eventName}" è stata approvata e applicata.`;
        break;
      case 'modification_rejected':
        title = 'Modifica Rifiutata';
        message = `La tua richiesta di modifica per l'evento "${eventName}" è stata rifiutata.`;
        break;
      case 'modification_requested_admin':
        title = '🔄 Nuova Richiesta di Modifica';
        message = `L'utente ha richiesto una modifica per l'evento "${eventName}". Controlla la sezione modifiche in attesa.`;
        break;
      default:
        return;
    }
    
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      eventId,
      eventName
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Errore creazione notifica:', error);
  }
};

export const createNotificationForEventReporter = async (eventId, eventName, type) => {
  try {
    // Trova l'evento per ottenere il reportedBy
    const event = await Event.findById(eventId);
    if (!event || !event.reportedBy) return;
    
    // Trova l'utente per username
    const user = await User.findOne({ username: event.reportedBy });
    if (!user) return;
    
    // Crea la notifica
    await createNotification(user._id, type, eventId, eventName);
  } catch (error) {
    console.error('Errore creazione notifica per reporter:', error);
  }
};

export const createNotificationForAdminsAndReviewers = async (eventId, eventName, type) => {
  try {
    // Trova tutti gli admin e reviewer
    const adminsAndReviewers = await User.find({ 
      role: { $in: ['admin', 'reviewer'] } 
    });
    
    // Crea notifiche per tutti gli admin e reviewer
    const notificationPromises = adminsAndReviewers.map(user => 
      createNotification(user._id, type, eventId, eventName)
    );
    
    await Promise.all(notificationPromises);
    console.log(`📧 Notifiche inviate a ${adminsAndReviewers.length} admin/reviewer per evento: ${eventName}`);
  } catch (error) {
    console.error('Errore creazione notifiche per admin/reviewer:', error);
  }
};
