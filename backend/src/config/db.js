import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error("❌ MONGO_URI environment variable is not set");
      process.exit(1);
    }
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connesso");
  } catch (err) {
    console.error("❌ Errore connessione MongoDB:", err.message);
    process.exit(1);
  }
};

export default connectDB;
