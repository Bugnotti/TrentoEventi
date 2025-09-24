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
