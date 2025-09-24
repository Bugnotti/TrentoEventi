import dotenv from "dotenv";
import mongoose from "mongoose";
import Event from "./models/Event.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

// Crea utenti di esempio
const users = [
  {
    username: "maria_rossi",
    email: "maria.rossi@email.com",
    passwordHash: await bcrypt.hash("password123", 10),
    firstName: "Maria",
    lastName: "Rossi",
    instagram: {
      username: "@maria_rossi_trento",
      showProfile: true
    }
  },
  {
    username: "luca_bianchi",
    email: "luca.bianchi@email.com", 
    passwordHash: await bcrypt.hash("password123", 10),
    firstName: "Luca",
    lastName: "Bianchi",
    instagram: {
      username: "@luca_bianchi",
      showProfile: true
    }
  },
  {
    username: "anna_verdi",
    email: "anna.verdi@email.com",
    passwordHash: await bcrypt.hash("password123", 10),
    firstName: "Anna",
    lastName: "Verdi",
    instagram: {
      username: "@anna_verdi_trento",
      showProfile: true
    }
  },
  {
    username: "giuseppe_neri",
    email: "giuseppe.neri@email.com",
    passwordHash: await bcrypt.hash("password123", 10),
    firstName: "Giuseppe",
    lastName: "Neri",
    instagram: {
      username: "@giuseppe_neri",
      showProfile: true
    }
  },
  {
    username: "sofia_blu",
    email: "sofia.blu@email.com",
    passwordHash: await bcrypt.hash("password123", 10),
    firstName: "Sofia",
    lastName: "Blu",
    instagram: {
      username: "@sofia_blu_cinema",
      showProfile: true
    }
  },
  {
    username: "marco_sport",
    email: "marco.sport@email.com",
    passwordHash: await bcrypt.hash("password123", 10),
    firstName: "Marco",
    lastName: "Sport",
    instagram: {
      username: "@marco_sport_trento",
      showProfile: true
    }
  },
  {
    username: "chef_elena",
    email: "elena.chef@email.com",
    passwordHash: await bcrypt.hash("password123", 10),
    firstName: "Elena",
    lastName: "Chef",
    instagram: {
      username: "@chef_elena_trento",
      showProfile: true
    }
  },
  {
    username: "maestro_antonio",
    email: "antonio.maestro@email.com",
    passwordHash: await bcrypt.hash("password123", 10),
    firstName: "Antonio",
    lastName: "Maestro",
    instagram: {
      username: "@maestro_antonio",
      showProfile: true
    }
  },
  {
    username: "artigiana_laura",
    email: "laura.artigiana@email.com",
    passwordHash: await bcrypt.hash("password123", 10),
    firstName: "Laura",
    lastName: "Artigiana",
    instagram: {
      username: "@artigiana_laura",
      showProfile: true
    }
  },
  {
    username: "dj_max",
    email: "max.dj@email.com",
    passwordHash: await bcrypt.hash("password123", 10),
    firstName: "Max",
    lastName: "DJ",
    instagram: {
      username: "@dj_max_trento",
      showProfile: true
    }
  },
  {
    username: "fotografo_paolo",
    email: "paolo.fotografo@email.com",
    passwordHash: await bcrypt.hash("password123", 10),
    firstName: "Paolo",
    lastName: "Fotografo",
    instagram: {
      username: "@fotografo_paolo",
      showProfile: true
    }
  },
  {
    username: "sommelier_francesca",
    email: "francesca.sommelier@email.com",
    passwordHash: await bcrypt.hash("password123", 10),
    firstName: "Francesca",
    lastName: "Sommelier",
    instagram: {
      username: "@sommelier_francesca",
      showProfile: true
    }
  },
  {
    username: "foto_natura",
    email: "natura.foto@email.com",
    passwordHash: await bcrypt.hash("password123", 10),
    firstName: "Fotografo",
    lastName: "Naturalista",
    instagram: {
      username: "@foto_natura_trento",
      showProfile: true
    }
  },
  {
    username: "utente_anonimo",
    email: "anonimo@email.com",
    passwordHash: await bcrypt.hash("password123", 10),
    firstName: "Utente",
    lastName: "Anonimo",
    instagram: {
      username: null,
      showProfile: false
    }
  },
  {
    username: "luis",
    email: "luis@email.com",
    passwordHash: await bcrypt.hash("password123", 10),
    firstName: "Luis",
    lastName: "Martinez",
    role: "user",
    instagram: {
      username: "@luis_martinez",
      showProfile: true
    }
  },
  {
    username: "reviewer1",
    email: "reviewer1@email.com",
    passwordHash: await bcrypt.hash("password123", 10),
    firstName: "Reviewer",
    lastName: "Uno",
    role: "reviewer",
    instagram: {
      username: "@reviewer_uno",
      showProfile: true
    }
  },
  {
    username: "admin",
    email: "admin@email.com",
    passwordHash: await bcrypt.hash("password123", 10),
    firstName: "Admin",
    lastName: "Sistema",
    role: "admin",
    instagram: {
      username: "@admin_sistema",
      showProfile: false
    }
  }
];

const events = [
  {
    name: "Concerto di Natale in Piazza Duomo",
    category: "Musica",
    date: "2025-09-17T20:30:00.000Z",
    location: "Piazza Duomo, Trento",
    link: "https://www.instagram.com/p/ABC123/",
    reportedBy: "maria_rossi",
    reporterInstagram: "@maria_rossi_trento",
    approved: "approved"
  },
  {
    name: "Mercatini di Natale 2024",
    category: "Shopping",
    date: "2025-09-15T10:00:00.000Z",
    location: "Centro Storico, Trento",
    link: "https://www.instagram.com/p/DEF456/",
    reportedBy: "luca_bianchi",
    reporterInstagram: "@luca_bianchi",
    approved: "approved"
  },
  {
    name: "Escursione al Castello del Buonconsiglio",
    category: "Cultura",
    date: "2024-12-20T14:00:00.000Z",
    location: "Via Bernardo Clesio, Trento",
    link: "https://www.instagram.com/p/GHI789/",
    reportedBy: "anna_verdi",
    reporterInstagram: "@anna_verdi_trento",
    approved: "approved"
  },
  {
    name: "Festival Street Food Trentino",
    category: "Gastronomia",
    date: "2026-01-10T12:00:00.000Z",
    location: "Piazza Fiera, Trento",
    link: "https://www.instagram.com/p/JKL012/",
    reportedBy: "giuseppe_neri",
    reporterInstagram: "@giuseppe_neri",
    approved: "approved"
  },
  {
    name: "Rassegna di Cinema sotto le Stelle",
    category: "Cinema",
    date: "2027-07-05T21:15:00.000Z",
    location: "Giardini Pubblici, Trento",
    link: "https://www.instagram.com/p/MNO345/",
    reportedBy: "sofia_blu",
    reporterInstagram: "@sofia_blu_cinema",
    approved: "approved"
  },
  {
    name: "Corsa non competitiva Trento Run",
    category: "Sport",
    date: "2025-12-18T08:30:00.000Z",
    location: "Parco delle Albere, Trento",
    link: "https://www.instagram.com/p/PQR678/",
    reportedBy: "marco_sport",
    reporterInstagram: "@marco_sport_trento",
    approved: "approved"
  },
  {
    name: "Laboratorio di Pasta Fresca",
    category: "Cucina",
    date: "2025-12-12T17:30:00.000Z",
    location: "Scuola di Cucina, Trento",
    link: "https://www.instagram.com/p/STU901/",
    reportedBy: "chef_elena",
    reporterInstagram: "@chef_elena_trento",
    approved: "approved"
  },
  {
    name: "Concerto Orchestra Giovanile",
    category: "Musica",
    date: "2025-02-20T19:30:00.000Z",
    location: "Auditorium Santa Chiara, Trento",
    link: "https://www.instagram.com/p/VWX234/",
    reportedBy: "maestro_antonio",
    reporterInstagram: "@maestro_antonio",
    approved: "approved"
  },
  {
    name: "Fiera dell'Artigianato Locale",
    category: "Fiere",
    date: "2025-12-06T09:00:00.000Z",
    location: "Piazza Duomo, Trento",
    link: "https://www.instagram.com/p/YZA567/",
    reportedBy: "artigiana_laura",
    reporterInstagram: "@artigiana_laura",
    approved: "approved"
  },
  {
    name: "Serata Karaoke in Centro",
    category: "Intrattenimento",
    date: "2028-01-24T21:00:00.000Z",
    location: "Via Manci 12, Trento",
    link: "https://www.instagram.com/p/BCD890/",
    reportedBy: "dj_max",
    reporterInstagram: "@dj_max_trento",
    approved: "approved"
  },
  {
    name: "Mostra Fotografica sulle Dolomiti",
    category: "Mostre",
    date: "2025-10-08T10:00:00.000Z",
    location: "Palazzo delle Albere, Trento",
    link: "https://www.instagram.com/p/EFG123/",
    reportedBy: "fotografo_paolo",
    reporterInstagram: "@fotografo_paolo",
    approved: "approved"
  },
  {
    name: "Degustazione di Vini Trentini",
    category: "Gastronomia",
    date: "2025-11-22T19:00:00.000Z",
    location: "Enoteca del Borgo, Trento",
    link: "https://www.instagram.com/p/HIJ456/",
    reportedBy: "sommelier_francesca",
    reporterInstagram: "@sommelier_francesca",
    approved: "approved"
  },
  {
    name: "Workshop di Fotografia Naturalistica",
    category: "Formazione",
    date: "2025-09-19T15:00:00.000Z",
    location: "Muse, Trento",
    link: "https://www.instagram.com/p/KLM789/",
    reportedBy: "foto_natura",
    reporterInstagram: "@foto_natura_trento",
    approved: "approved"
  },
  {
    name: "Evento Anonimo di Test",
    category: "Cultura",
    date: "2025-12-25T18:00:00.000Z",
    location: "Museo di Arte Moderna, Trento",
    link: "https://www.instagram.com/p/ANONIMO123/",
    reportedBy: "utente_anonimo",
    reporterInstagram: null,
    approved: "approved"
  },
  {
    name: "Serata Networking per Sviluppatori",
    category: "Formazione",
    date: "2025-12-30T19:00:00.000Z",
    location: "Coworking Trento, Via Manci 15",
    link: "https://www.instagram.com/p/LUIS_NETWORKING/",
    reportedBy: "luis",
    reporterInstagram: "@luis_martinez",
    approved: "approved"
  },
  {
    name: "Workshop di Programmazione Web",
    category: "Formazione",
    date: "2026-01-15T14:00:00.000Z",
    location: "Università di Trento, Dipartimento Informatica",
    link: "https://www.instagram.com/p/LUIS_WORKSHOP/",
    reportedBy: "luis",
    reporterInstagram: "@luis_martinez",
    approved: "approved"
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Pulisce vecchi dati
    await Event.deleteMany();
    await User.deleteMany();
    
    // Crea utenti
    const createdUsers = await User.insertMany(users);
    console.log("✅ Utenti creati");
    
    // Crea mappa username -> ObjectId per i riferimenti
    const userMap = {};
    createdUsers.forEach(user => {
      userMap[user.username] = user._id;
    });
    
    // Aggiorna eventi con riferimenti agli utenti
    const eventsWithUsers = events.map(event => ({
      ...event,
      reporter: userMap[event.reportedBy] || null
    }));
    
    // Crea eventi
    await Event.insertMany(eventsWithUsers);
    console.log("✅ Eventi creati");
    
    console.log("✅ Database popolato con successo!");
    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Errore seed:", err);
  }
};

seedDB();
