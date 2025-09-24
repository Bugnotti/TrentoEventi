import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();
connectDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server avviato su http://localhost:${PORT}`));
