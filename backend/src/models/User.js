import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: false }, // Non obbligatorio per utenti Google
  googleId: { type: String, unique: true, sparse: true }, // ID Google per OAuth
  authProvider: { type: String, enum: ["local", "google"], default: "local" },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  profilePicture: { type: String }, // URL immagine profilo Google
  role: { type: String, enum: ["user", "reviewer", "admin"], default: "user" },
  points: { type: Number, default: 0 },
  instagram: {
    showProfile: { type: Boolean, default: false },
    username: { type: String, trim: true }
  }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;



