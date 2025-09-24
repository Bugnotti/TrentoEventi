// seedUser.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/trentoEventi";

async function upsertUsers() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    const passwordHash = await bcrypt.hash("password123", 10);

    // Utenti da creare/aggiornare
    const users = [
      {
        email: "admin@gmail.com",
        passwordHash: await bcrypt.hash("admin123", 10),
        username: "admin",
        firstName: "Admin",
        lastName: "Sistema",
        role: "admin",
        instagram: {
          username: "@admin_sistema",
          showProfile: false
        }
      },
      {
        email: "mario.rossi@gmail.com",
        passwordHash,
        username: "mario_rossi",
        firstName: "Mario",
        lastName: "Rossi",
        role: "user",
        instagram: {
          username: "@mario_rossi_trento",
          showProfile: true
        }
      },
      {
        email: "laura.bianchi@gmail.com",
        passwordHash,
        username: "laura_bianchi",
        firstName: "Laura",
        lastName: "Bianchi",
        role: "user",
        instagram: {
          username: "@laura_bianchi_events",
          showProfile: true
        }
      }
    ];

    for (const userData of users) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        Object.assign(existing, userData);
        await existing.save();
        console.log("✅ Utente aggiornato:", { 
          id: existing._id.toString(), 
          email: existing.email, 
          username: existing.username,
          role: existing.role 
        });
      } else {
        const user = await User.create(userData);
        console.log("✅ Utente creato:", { 
          id: user._id.toString(), 
          email: user.email, 
          username: user.username,
          role: user.role 
        });
      }
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error("❌ Errore seed utenti:", err.message);
    process.exit(1);
  }
}

upsertUsers();
