import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true }, // es. Musica, Shopping, Sport
  date: { type: Date, required: true },
  location: { type: String, required: true },
  link: { type: String }, // Link al post Instagram dell'evento
  approved: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  reportedBy: { type: String, default: "Anonimo" },
  reporterInstagram: { type: String }, // Instagram del reporter
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Riferimento all'utente
  clickCount: { type: Number, default: 0 }, // Numero totale di click
  clickedBy: [{ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    clickedAt: { type: Date, default: Date.now }
  }] // Array degli utenti che hanno cliccato e quando
}, { timestamps: true });

const Event = mongoose.model("Event", eventSchema);
export default Event;
